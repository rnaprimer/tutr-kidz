import { trackEvent } from '../../lib/analytics';
/**
 * Tutr Kidz - Cloud Synchronization Service (Phase 14)
 *
 * Implements bi-directional cloud sync, offline queue flushing,
 * multi-device restoration, export, and account deletion.
 */

import { getSupabaseClient } from '../../lib/supabase/client';
import { getCurrentParentUser, signOutParent } from '../../lib/supabase/auth';
import { familyStorageAdapter } from '../family/familyStorageAdapter';
import { progressStorageAdapter } from '../progress/progressStorageAdapter';
import { migrateLocalToCloud } from '../../lib/supabase/migration';
import { getSyncQueue, removeQueueItem, updateQueueItemError } from './syncQueue';
import { SyncResult } from './syncTypes';
import { FamilyState, ChildRecord, ChildProfile, LearningPreferences, ChildId } from '../family/familyTypes';
import { ProgressState, ProgressRecord, OverallProgress } from '../progress/types';
import { ParentSettings, AppSettingsState } from '../settings/settingsTypes';
import { DEFAULT_PARENT_SETTINGS, SETTINGS_STORAGE_KEY } from '../settings/settingsStorageAdapter';
import { FAMILY_STORAGE_KEY, DEFAULT_FAMILY_STATE } from '../family/familyStorageAdapter';
import { DEFAULT_PROGRESS } from '../progress/progressStorageAdapter';
import { getFamilyState } from '../family/familyRepository';
import { getSettings } from '../settings/settingsRepository';
import { getProgress } from '../progress/progressRepository';

const LAST_SYNCED_KEY = 'tutr_kidz_last_synced_at';

export async function getLastSyncedAt(): Promise<string | null> {
  return await familyStorageAdapter.getItem(LAST_SYNCED_KEY);
}

export async function setLastSyncedAt(timestamp: string): Promise<void> {
  await familyStorageAdapter.setItem(LAST_SYNCED_KEY, timestamp);
}

/**
 * Multi-device restoration:
 * Pulls all cloud state (family, children, preferences, progress, settings) from Supabase
 * and writes to local storage cache so that a newly signed-in device gets the complete family history.
 */
export async function restoreCloudToLocal(userId: string): Promise<{ success: boolean; childCount: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, childCount: 0, error: 'Backend is not configured.' };
  }

  try {
    // 1. Fetch user's family
    const { data: family, error: famErr } = await client
      .from('families')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (famErr || !family) {
      return { success: false, childCount: 0, error: famErr?.message || 'Family not found' };
    }

    // 2. Fetch family settings
    const { data: dbSettings } = await client
      .from('family_settings')
      .select('*')
      .eq('family_id', family.id)
      .maybeSingle();

    if (dbSettings) {
      const restoredSettings: ParentSettings = {
        dailyQuestionGoalEnabled: dbSettings.daily_question_goal_enabled,
        defaultDailyQuestionGoal: dbSettings.default_daily_question_goal,
        showAllLevelsByDefault: dbSettings.show_all_levels_by_default,
        sessionQuestionCount: dbSettings.session_question_count,
        reduceMotion: dbSettings.reduce_motion,
        parentLockEnabled: dbSettings.parent_lock_enabled,
        requireParentConfirmationForReset: dbSettings.require_parent_confirmation_for_reset,
      };

      const settingsState: AppSettingsState = {
        settings: restoredSettings,
        updatedAt: dbSettings.updated_at,
      };
      await familyStorageAdapter.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
    }

    // 3. Fetch children for this family
    const { data: dbChildren, error: childErr } = await client
      .from('children')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: true });

    if (childErr) {
      return { success: false, childCount: 0, error: childErr.message };
    }

    const childrenMap: Record<ChildId, ChildRecord> = {};

    if (dbChildren && dbChildren.length > 0) {
      for (const row of dbChildren) {
        // Fetch preferences
        const { data: prefRow } = await client
          .from('child_preferences')
          .select('*')
          .eq('child_id', row.id)
          .maybeSingle();

        const preferences: LearningPreferences = {
          dailyQuestionGoal: prefRow?.daily_question_goal ?? 5,
          showAllLevels: prefRow?.show_all_levels ?? true,
        };

        const profile: ChildProfile = {
          id: row.id,
          name: row.name,
          level: row.level as any,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        childrenMap[row.id] = { profile, preferences };

        // 4. Fetch topic progress for child
        const { data: dbTopics } = await client
          .from('topic_progress')
          .select('*')
          .eq('child_id', row.id);

        if (dbTopics && dbTopics.length > 0) {
          const topics: Record<string, ProgressRecord> = {};
          let totalQuestionsAnswered = 0;
          let totalCorrectAnswers = 0;
          let totalIncorrectAnswers = 0;
          let quizzesCompleted = 0;
          let lastPlayedAt: string | undefined = undefined;

          for (const t of dbTopics) {
            topics[t.topic] = {
              level: t.level as any,
              topic: t.topic,
              attempts: t.attempts,
              questionsAnswered: t.questions_answered,
              correctAnswers: t.correct_answers,
              incorrectAnswers: t.incorrect_answers,
              bestScore: t.best_score,
              bestTotal: t.best_total,
              lastScore: t.last_score,
              lastTotal: t.last_total,
              lastPlayedAt: t.last_played_at || '',
            };

            totalQuestionsAnswered += t.questions_answered;
            totalCorrectAnswers += t.correct_answers;
            totalIncorrectAnswers += t.incorrect_answers;
            quizzesCompleted += t.attempts;
            if (t.last_played_at) {
              if (!lastPlayedAt || new Date(t.last_played_at) > new Date(lastPlayedAt)) {
                lastPlayedAt = t.last_played_at;
              }
            }
          }

          const overall: OverallProgress = {
            totalQuestionsAnswered,
            totalCorrectAnswers,
            totalIncorrectAnswers,
            quizzesCompleted,
            lastPlayedAt,
          };

          const childProgressState: ProgressState = { topics, overall };
          await progressStorageAdapter.setItem(
            `tutr_kidz_progress_${row.id}`,
            JSON.stringify(childProgressState)
          );
        }
      }
    }

    // 5. Save restored family state
    const childIds = Object.keys(childrenMap);
    const existingFamilyRaw = await familyStorageAdapter.getItem(FAMILY_STORAGE_KEY);
    let activeId: ChildId | null = null;
    if (existingFamilyRaw) {
      try {
        const parsed = JSON.parse(existingFamilyRaw);
        if (parsed.activeChildId && childrenMap[parsed.activeChildId]) {
          activeId = parsed.activeChildId;
        }
      } catch {
        // ignore
      }
    }
    if (!activeId) {
      activeId = childIds.length > 0 ? childIds[0] : null;
    }

    const restoredFamilyState: FamilyState = {
      children: childrenMap,
      activeChildId: activeId,
    };

    await familyStorageAdapter.setItem(FAMILY_STORAGE_KEY, JSON.stringify(restoredFamilyState));

    return {
      success: true,
      childCount: childIds.length,
    };
  } catch (err) {
    return {
      success: false,
      childCount: 0,
      error: err instanceof Error ? err.message : 'Unknown restoration error',
    };
  }
}

/**
 * Flush any pending offline queue items to Supabase.
 */
export async function flushSyncQueue(): Promise<{ processed: number; errors: number }> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();
  if (!client || !user) return { processed: 0, errors: 0 };

  const queue = await getSyncQueue();
  if (queue.length === 0) return { processed: 0, errors: 0 };

  let processed = 0;
  let errors = 0;

  for (const item of queue) {
    try {
      if (item.entityType === 'child') {
        if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
          await client.from('children').upsert(item.payload);
        } else if (item.operation === 'DELETE') {
          await client.from('children').delete().eq('id', item.entityId);
        }
      } else if (item.entityType === 'preference') {
        await client.from('child_preferences').upsert(item.payload);
      } else if (item.entityType === 'topic_progress') {
        await client.from('topic_progress').upsert(item.payload);
      } else if (item.entityType === 'quiz_attempt') {
        await client.from('quiz_attempts').insert(item.payload);
      } else if (item.entityType === 'family_settings') {
        await client.from('family_settings').upsert(item.payload);
      } else if (item.entityType === 'feedback') {
        try {
          const { error } = await client.from('feedback').upsert(item.payload);
          if (error && error.code !== '42P01' && !error.message?.includes('does not exist')) {
            throw error;
          }
          trackEvent('feedback_sync_completed', { success: true });
        } catch (fbErr) {
          // Local storage remains authoritative if table is not yet migrated in Supabase
        }
      } else if (item.entityType === 'learning_plan') {
        try {
          const { error } = await client.from('learning_plans').upsert(item.payload);
          if (error && error.code !== '42P01' && !error.message?.includes('does not exist')) {
            throw error;
          }
        } catch (planErr) {
          // Local persistence remains authoritative if table is not yet migrated in Supabase
        }
      }

      await removeQueueItem(item.id);
      processed++;
    } catch (err) {
      errors++;
      await updateQueueItemError(item.id, err instanceof Error ? err.message : 'Sync error');
    }
  }

  return { processed, errors };
}

/**
 * Manual "Sync Now" action:
 * 1. Verifies cloud connection and parent session.
 * 2. Uploads local changes (via idempotent migrateLocalToCloud).
 * 3. Flushes offline queue items.
 * 4. Pulls latest cloud state to local storage cache.
 * 5. Updates and stores last synced timestamp.
 */
export async function syncNow(): Promise<SyncResult> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (!client || !user) {
    return {
      success: false,
      error: 'Please sign in to sync your family data with the cloud.',
    };
  }

  try {
    // 1. Get family
    const { data: family, error: famErr } = await client
      .from('families')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (famErr || !family) {
      return {
        success: false,
        error: 'Unable to locate parent family in the cloud.',
      };
    }

    // 2. Upload local data to cloud (idempotent upsert)
    const localUploadResult = await migrateLocalToCloud(family.id);

    // 3. Flush sync queue
    await flushSyncQueue();

    // 4. Pull cloud data back into local cache (multi-device restoration & sync)
    const restoreResult = await restoreCloudToLocal(user.id);

    if (!restoreResult.success) {
      return {
        success: false,
        error: restoreResult.error || 'Failed to update local learning cache.',
      };
    }

    const now = new Date().toISOString();
    await setLastSyncedAt(now);

    return {
      success: true,
      syncedAt: now,
      uploadedItems: localUploadResult.childrenMigrated + localUploadResult.topicsMigrated,
      downloadedItems: restoreResult.childCount,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown synchronization error',
    };
  }
}

/**
 * Exports all local family data, child profiles, preferences, topic progress,
 * and family settings as a clean JSON object.
 */
export async function exportFamilyData(): Promise<string> {
  const familyState = await getFamilyState();
  const settings = await getSettings();

  const childrenData: Array<{
    profile: ChildProfile;
    preferences: LearningPreferences;
    progress: ProgressState;
  }> = [];

  for (const childId of Object.keys(familyState.children)) {
    const child = familyState.children[childId];
    const progress = await getProgress(childId);
    childrenData.push({
      profile: child.profile,
      preferences: child.preferences,
      progress,
    });
  }

  const exportPayload = {
    appName: 'Tutr Kidz',
    version: 'Phase 14',
    exportedAt: new Date().toISOString(),
    family: {
      activeChildId: familyState.activeChildId,
      childCount: childrenData.length,
      children: childrenData,
    },
    settings,
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Safely deletes parent account and all cloud family data.
 * - Deletes the parent's family in Supabase (cascades via PostgreSQL foreign keys to
 *   children, child_preferences, topic_progress, quiz_attempts, family_settings).
 * - Cleans all local storage data.
 * - Signs out from Supabase Auth.
 * Never requires service-role keys!
 */
export async function deleteParentAccount(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user) {
    try {
      // 1. Delete family (cascades to all children and progress)
      await client.from('families').delete().eq('owner_id', user.id);

      // 2. Delete profile
      await client.from('profiles').delete().eq('id', user.id);
    } catch (err) {
      console.warn('Error deleting cloud account data:', err);
    }
  }

  // 3. Clear all local family & progress storage
  const familyState = await getFamilyState();
  for (const childId of Object.keys(familyState.children)) {
    await progressStorageAdapter.removeItem(`tutr_kidz_progress_${childId}`);
  }
  await progressStorageAdapter.removeItem('tutr_kidz_progress');
  await familyStorageAdapter.removeItem(FAMILY_STORAGE_KEY);
  await familyStorageAdapter.removeItem(SETTINGS_STORAGE_KEY);
  await familyStorageAdapter.removeItem(LAST_SYNCED_KEY);
  await familyStorageAdapter.removeItem('tutr_kidz_cloud_migrated');

  // 4. Sign out parent
  await signOutParent();

  return { success: true };
}
