/**
 * Tutr Kidz - Local to Cloud Migration Service (Phase 13)
 *
 * Idempotently migrates existing Phase 8–12 local storage data
 * (family, children, preferences, settings, progress, quiz attempts)
 * into Supabase without destroying local cache.
 */

import { getSupabaseClient } from './client';
import { familyStorageAdapter, FAMILY_STORAGE_KEY } from '../../features/family/familyStorage';
import { progressStorageAdapter } from '../../features/progress/progressStorage';
import { SETTINGS_STORAGE_KEY, DEFAULT_PARENT_SETTINGS } from '../../features/settings/settingsStorage';
import { FamilyState } from '../../features/family/familyTypes';
import { ProgressState } from '../../features/progress/types';
import { ParentSettings } from '../../features/settings/settingsTypes';

export const MIGRATION_MARKER_KEY = 'tutr_kidz_cloud_migration_v1';

export interface LocalDataSummary {
  hasLocalData: boolean;
  childCount: number;
  hasSettings: boolean;
  migrated: boolean;
}

export interface MigrationResult {
  success: boolean;
  childrenMigrated: number;
  topicsMigrated: number;
  attemptsMigrated: number;
  settingsMigrated: boolean;
  error?: string;
}

/**
 * Detect whether local Phase 8–12 data exists on the device.
 */
export async function detectLocalData(): Promise<LocalDataSummary> {
  const marker = await familyStorageAdapter.getItem(MIGRATION_MARKER_KEY);
  const familyRaw = await familyStorageAdapter.getItem(FAMILY_STORAGE_KEY);
  const settingsRaw = await familyStorageAdapter.getItem(SETTINGS_STORAGE_KEY);

  let childCount = 0;
  if (familyRaw) {
    try {
      const family = JSON.parse(familyRaw) as FamilyState;
      if (family.children) {
        childCount = Object.keys(family.children).length;
      }
    } catch {
      // ignore parse error
    }
  }

  const hasLocalData = childCount > 0 || !!settingsRaw;

  return {
    hasLocalData,
    childCount,
    hasSettings: !!settingsRaw,
    migrated: marker === 'true',
  };
}

/**
 * Check if the cloud migration has already been recorded as completed.
 */
export async function isCloudMigrated(): Promise<boolean> {
  const marker = await familyStorageAdapter.getItem(MIGRATION_MARKER_KEY);
  return marker === 'true';
}

/**
 * Idempotently migrate local family, settings, and progress data into Supabase.
 */
export async function migrateLocalToCloud(familyId: string): Promise<MigrationResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      childrenMigrated: 0,
      topicsMigrated: 0,
      attemptsMigrated: 0,
      settingsMigrated: false,
      error: 'Cloud backend is not configured.',
    };
  }

  try {
    let childrenCount = 0;
    let topicsCount = 0;
    let attemptsCount = 0;
    let settingsMigrated = false;

    // 1. Migrate Settings
    const settingsRaw = await familyStorageAdapter.getItem(SETTINGS_STORAGE_KEY);
    let settings: ParentSettings = DEFAULT_PARENT_SETTINGS;
    if (settingsRaw) {
      try {
        const parsed = JSON.parse(settingsRaw);
        if (parsed.settings) settings = parsed.settings;
        else settings = parsed;
      } catch {
        settings = DEFAULT_PARENT_SETTINGS;
      }
    }

    const { error: settingsError } = await client.from('family_settings').upsert(
      {
        family_id: familyId,
        daily_question_goal_enabled: settings.dailyQuestionGoalEnabled,
        default_daily_question_goal: settings.defaultDailyQuestionGoal,
        show_all_levels_by_default: settings.showAllLevelsByDefault,
        session_question_count: settings.sessionQuestionCount,
        reduce_motion: settings.reduceMotion,
        parent_lock_enabled: settings.parentLockEnabled,
        require_parent_confirmation_for_reset: settings.requireParentConfirmationForReset,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'family_id' }
    );

    if (!settingsError) {
      settingsMigrated = true;
    }

    // 2. Migrate Family & Children
    const familyRaw = await familyStorageAdapter.getItem(FAMILY_STORAGE_KEY);
    if (familyRaw) {
      let familyState: FamilyState | null = null;
      try {
        familyState = JSON.parse(familyRaw) as FamilyState;
      } catch {
        familyState = null;
      }

      if (familyState && familyState.children) {
        const localChildren = Object.values(familyState.children);

        for (const childRecord of localChildren) {
          const profile = childRecord.profile;
          const preferences = childRecord.preferences;

          // Check if child with same id or name already exists in this family to avoid duplicates
          const { data: existingChildren } = await client
            .from('children')
            .select('id, name')
            .eq('family_id', familyId);

          let targetChildId = profile.id;
          const matched = existingChildren?.find(
            (c) => c.id === profile.id || c.name.toLowerCase() === profile.name.toLowerCase()
          );

          if (matched) {
            targetChildId = matched.id;
            // Update child level & updated_at
            await client
              .from('children')
              .update({
                name: profile.name,
                level: profile.level,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetChildId);
          } else {
            // Insert child
            const { data: insertedChild } = await client
              .from('children')
              .insert({
                id: profile.id,
                family_id: familyId,
                name: profile.name,
                level: profile.level,
                created_at: profile.createdAt || new Date().toISOString(),
                updated_at: profile.updatedAt || new Date().toISOString(),
              })
              .select('id')
              .single();

            if (insertedChild) {
              targetChildId = insertedChild.id;
            }
          }

          childrenCount++;

          // Upsert child preferences
          if (preferences) {
            await client.from('child_preferences').upsert(
              {
                child_id: targetChildId,
                daily_question_goal: preferences.dailyQuestionGoal,
                show_all_levels: preferences.showAllLevels,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'child_id' }
            );
          }

          // 3. Migrate Child Progress
          const progressKey = `tutr_kidz_progress_${profile.id}`;
          const progressRaw =
            (await progressStorageAdapter.getItem(progressKey)) ||
            (await progressStorageAdapter.getItem('tutr_kidz_progress'));

          if (progressRaw) {
            try {
              const progressState = JSON.parse(progressRaw) as ProgressState;
              if (progressState.topics) {
                for (const [topicKey, record] of Object.entries(progressState.topics)) {
                  const { error: topicErr } = await client.from('topic_progress').upsert(
                    {
                      child_id: targetChildId,
                      level: record.level,
                      topic: record.topic || topicKey,
                      attempts: record.attempts,
                      questions_answered: record.questionsAnswered,
                      correct_answers: record.correctAnswers,
                      incorrect_answers: record.incorrectAnswers,
                      best_score: record.bestScore,
                      best_total: record.bestTotal,
                      last_score: record.lastScore,
                      last_total: record.lastTotal,
                      last_played_at: record.lastPlayedAt || null,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'child_id,level,topic' }
                  );

                  if (!topicErr) {
                    topicsCount++;
                  }

                  // If attempts exist, create historical quiz attempt record if not already recorded
                  if (record.attempts > 0 && record.lastPlayedAt) {
                    const { count } = await client
                      .from('quiz_attempts')
                      .select('*', { count: 'exact', head: true })
                      .eq('child_id', targetChildId)
                      .eq('topic', record.topic || topicKey);

                    if (!count || count === 0) {
                      await client.from('quiz_attempts').insert({
                        child_id: targetChildId,
                        level: record.level,
                        topic: record.topic || topicKey,
                        score: record.lastScore,
                        total: record.lastTotal || 5,
                        completed_at: record.lastPlayedAt,
                      });
                      attemptsCount++;
                    }
                  }
                }
              }
            } catch {
              // ignore malformed child progress
            }
          }
        }
      }
    }

    // 4. Mark migration complete locally
    await familyStorageAdapter.setItem(MIGRATION_MARKER_KEY, 'true');

    return {
      success: true,
      childrenMigrated: childrenCount,
      topicsMigrated: topicsCount,
      attemptsMigrated: attemptsCount,
      settingsMigrated,
    };
  } catch (err) {
    return {
      success: false,
      childrenMigrated: 0,
      topicsMigrated: 0,
      attemptsMigrated: 0,
      settingsMigrated: false,
      error: err instanceof Error ? err.message : 'Unknown migration error',
    };
  }
}
