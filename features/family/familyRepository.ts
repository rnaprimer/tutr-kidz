/**
 * Tutr Kidz - Family Repository (Phase 13)
 *
 * Provides hybrid cloud-backed family persistence using Supabase,
 * with automatic fallback and caching to local storage.
 */

import { getSupabaseClient } from '../../lib/supabase/client';
import { getCurrentParentUser } from '../../lib/supabase/auth';
import {
  ChildId,
  ChildProfile,
  ChildRecord,
  FamilyState,
  LearningPreferences,
} from './familyTypes';
import { CurriculumLevel } from '../../types/curriculum';
import {
  familyStorageAdapter,
  FAMILY_STORAGE_KEY,
  DEFAULT_FAMILY_STATE,
} from './familyStorageAdapter';
import { getCachedSettings } from '../settings/settingsRepository';
import { progressStorageAdapter } from '../progress/progressStorageAdapter';

let activeChildIdCache: ChildId | null = null;

function generateId(): ChildId {
  return `child_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Get active family id in Supabase for current authenticated user.
 */
async function getSupabaseFamilyId(): Promise<string | null> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();
  if (!client || !user) return null;

  try {
    const { data } = await client
      .from('families')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    return data?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Retrieve current FamilyState.
 * If authenticated with Supabase, fetches cloud data and updates local cache.
 * Otherwise, falls back to local storage.
 */
export async function getFamilyState(): Promise<FamilyState> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user) {
    try {
      const familyId = await getSupabaseFamilyId();
      if (familyId) {
        // Fetch children
        const { data: dbChildren, error: childErr } = await client
          .from('children')
          .select('id, name, level, created_at, updated_at')
          .eq('family_id', familyId);

        if (!childErr && dbChildren) {
          const childrenMap: Record<ChildId, ChildRecord> = {};

          for (const c of dbChildren) {
            // Fetch preferences
            const { data: prefData } = await client
              .from('child_preferences')
              .select('daily_question_goal, show_all_levels')
              .eq('child_id', c.id)
              .maybeSingle();

            const preferences: LearningPreferences = {
              dailyQuestionGoal: prefData?.daily_question_goal ?? 5,
              showAllLevels: prefData?.show_all_levels ?? true,
            };

            const profile: ChildProfile = {
              id: c.id,
              name: c.name,
              level: c.level as CurriculumLevel,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
            };

            childrenMap[c.id] = { profile, preferences };
          }

          // Resolve activeChildId
          const localRaw = await familyStorageAdapter.getItem(FAMILY_STORAGE_KEY);
          let localActiveId: ChildId | null = null;
          if (localRaw) {
            try {
              const parsed = JSON.parse(localRaw) as FamilyState;
              localActiveId = parsed.activeChildId;
            } catch {
              // ignore
            }
          }

          let resolvedActiveId: ChildId | null = activeChildIdCache || localActiveId;
          const childIds = Object.keys(childrenMap);

          if (!resolvedActiveId || !childrenMap[resolvedActiveId]) {
            resolvedActiveId = childIds.length > 0 ? childIds[0] : null;
          }

          activeChildIdCache = resolvedActiveId;

          const cloudState: FamilyState = {
            children: childrenMap,
            activeChildId: resolvedActiveId,
          };

          // Cache locally
          await familyStorageAdapter.setItem(FAMILY_STORAGE_KEY, JSON.stringify(cloudState));
          return cloudState;
        }
      }
    } catch {
      // network failure: fall through to local cache
    }
  }

  // Local fallback
  try {
    const raw = await familyStorageAdapter.getItem(FAMILY_STORAGE_KEY);
    if (!raw) return DEFAULT_FAMILY_STATE;
    const parsed = JSON.parse(raw) as FamilyState;
    if (parsed.activeChildId) {
      activeChildIdCache = parsed.activeChildId;
    }
    return parsed;
  } catch {
    return DEFAULT_FAMILY_STATE;
  }
}

/**
 * Save complete FamilyState.
 */
export async function saveFamilyState(state: FamilyState): Promise<void> {
  activeChildIdCache = state.activeChildId;
  await familyStorageAdapter.setItem(FAMILY_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Add a new learner child.
 */
export async function addChild(params: {
  name: string;
  level: CurriculumLevel;
  preferences?: Partial<LearningPreferences>;
}): Promise<ChildRecord> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();
  const settings = getCachedSettings();

  const newPreferences: LearningPreferences = {
    dailyQuestionGoal: params.preferences?.dailyQuestionGoal ?? settings.defaultDailyQuestionGoal,
    showAllLevels: params.preferences?.showAllLevels ?? settings.showAllLevelsByDefault,
  };

  if (client && user) {
    try {
      const familyId = await getSupabaseFamilyId();
      if (familyId) {
        const { data: dbChild, error } = await client
          .from('children')
          .insert({
            family_id: familyId,
            name: params.name.trim(),
            level: params.level,
          })
          .select('id, name, level, created_at, updated_at')
          .single();

        if (!error && dbChild) {
          await client.from('child_preferences').insert({
            child_id: dbChild.id,
            daily_question_goal: newPreferences.dailyQuestionGoal,
            show_all_levels: newPreferences.showAllLevels,
          });

          const profile: ChildProfile = {
            id: dbChild.id,
            name: dbChild.name,
            level: dbChild.level as CurriculumLevel,
            createdAt: dbChild.created_at,
            updatedAt: dbChild.updated_at,
          };

          const newRecord: ChildRecord = { profile, preferences: newPreferences };

          // Update local state & active child
          const localState = await getFamilyState();
          localState.children[profile.id] = newRecord;
          if (!localState.activeChildId) {
            localState.activeChildId = profile.id;
          }
          await saveFamilyState(localState);
          return newRecord;
        }
      }
    } catch {
      // fall back to local creation
    }
  }

  // Local fallback
  const now = new Date().toISOString();
  const id = generateId();
  const profile: ChildProfile = {
    id,
    name: params.name.trim(),
    level: params.level,
    createdAt: now,
    updatedAt: now,
  };

  const newRecord: ChildRecord = { profile, preferences: newPreferences };
  const current = await getFamilyState();
  current.children[id] = newRecord;
  if (!current.activeChildId) {
    current.activeChildId = id;
  }
  await saveFamilyState(current);
  return newRecord;
}

/**
 * Update an existing learner child.
 */
export async function updateChild(
  id: ChildId,
  updates: {
    name?: string;
    level?: CurriculumLevel;
    preferences?: Partial<LearningPreferences>;
  }
): Promise<ChildRecord> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user) {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) updateData.name = updates.name.trim();
      if (updates.level !== undefined) updateData.level = updates.level;

      await client.from('children').update(updateData).eq('id', id);

      if (updates.preferences) {
        await client
          .from('child_preferences')
          .update({
            daily_question_goal: updates.preferences.dailyQuestionGoal,
            show_all_levels: updates.preferences.showAllLevels,
            updated_at: new Date().toISOString(),
          })
          .eq('child_id', id);
      }
    } catch {
      // proceed to update local cache
    }
  }

  const current = await getFamilyState();
  const existing = current.children[id];
  if (!existing) {
    throw new Error(`Child with id "${id}" not found.`);
  }

  const now = new Date().toISOString();
  const updatedProfile: ChildProfile = {
    ...existing.profile,
    name: updates.name !== undefined ? updates.name.trim() : existing.profile.name,
    level: updates.level !== undefined ? updates.level : existing.profile.level,
    updatedAt: now,
  };

  const updatedPreferences: LearningPreferences = {
    ...existing.preferences,
    ...updates.preferences,
  };

  const updatedRecord: ChildRecord = {
    profile: updatedProfile,
    preferences: updatedPreferences,
  };

  current.children[id] = updatedRecord;
  await saveFamilyState(current);
  return updatedRecord;
}

/**
 * Remove a child profile and all associated data.
 */
export async function removeChild(id: ChildId): Promise<void> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user) {
    try {
      // Cascades in PostgreSQL delete preferences, topic_progress, and quiz_attempts
      await client.from('children').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  const current = await getFamilyState();
  delete current.children[id];

  // Clean local progress and plan cache
  await progressStorageAdapter.removeItem(`tutr_kidz_progress_${id}`);
  await familyStorageAdapter.removeItem(`tutr_kidz_plan_${id}`);

  if (current.activeChildId === id) {
    const remainingIds = Object.keys(current.children);
    current.activeChildId = remainingIds.length > 0 ? remainingIds[0] : null;
  }

  await saveFamilyState(current);
}

/**
 * Set active learner child.
 */
export async function setActiveChild(id: ChildId): Promise<void> {
  const current = await getFamilyState();
  if (current.children[id]) {
    current.activeChildId = id;
    await saveFamilyState(current);
  }
}

/**
 * Retrieve the active child record, or null if no child is active.
 */
export async function getActiveChild(): Promise<ChildRecord | null> {
  const state = await getFamilyState();
  if (!state.activeChildId) return null;
  return state.children[state.activeChildId] ?? null;
}

/**
 * Reset all family data.
 */
export async function resetFamily(): Promise<void> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user) {
    try {
      const familyId = await getSupabaseFamilyId();
      if (familyId) {
        await client.from('children').delete().eq('family_id', familyId);
      }
    } catch {
      // ignore
    }
  }

  const current = await getFamilyState();
  for (const childId of Object.keys(current.children)) {
    await progressStorageAdapter.removeItem(`tutr_kidz_progress_${childId}`);
    await familyStorageAdapter.removeItem(`tutr_kidz_plan_${childId}`);
  }
  await progressStorageAdapter.removeItem('tutr_kidz_progress');

  activeChildIdCache = null;
  await saveFamilyState(DEFAULT_FAMILY_STATE);
}
