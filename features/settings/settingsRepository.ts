/**
 * Tutr Kidz - Settings Repository (Phase 13)
 *
 * Provides cloud-backed app settings via Supabase `family_settings`,
 * with synchronous caching and local storage fallback.
 */

import { getSupabaseClient } from '../../lib/supabase/client';
import { getCurrentParentUser } from '../../lib/supabase/auth';
import { ParentSettings, AppSettingsState } from './settingsTypes';
import {
  DEFAULT_PARENT_SETTINGS,
  DEFAULT_APP_SETTINGS_STATE,
  SETTINGS_STORAGE_KEY,
} from './settingsStorageAdapter';
import { familyStorageAdapter } from '../family/familyStorageAdapter';

let inMemorySettings: ParentSettings = { ...DEFAULT_PARENT_SETTINGS };
let hasInitialized = false;

/**
 * Synchronous read of currently cached parent settings.
 */
export function getCachedSettings(): ParentSettings {
  return inMemorySettings;
}

/**
 * Get family id for current user.
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
 * Get settings from Supabase if authenticated, falling back to local storage.
 */
export async function getSettings(): Promise<ParentSettings> {
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user) {
    try {
      const familyId = await getSupabaseFamilyId();
      if (familyId) {
        const { data: dbSettings, error } = await client
          .from('family_settings')
          .select('*')
          .eq('family_id', familyId)
          .maybeSingle();

        if (!error && dbSettings) {
          const settings: ParentSettings = {
            dailyQuestionGoalEnabled: dbSettings.daily_question_goal_enabled,
            defaultDailyQuestionGoal: dbSettings.default_daily_question_goal,
            showAllLevelsByDefault: dbSettings.show_all_levels_by_default,
            sessionQuestionCount: dbSettings.session_question_count,
            reduceMotion: dbSettings.reduce_motion,
            parentLockEnabled: dbSettings.parent_lock_enabled,
            requireParentConfirmationForReset: dbSettings.require_parent_confirmation_for_reset,
          };

          inMemorySettings = { ...settings };
          hasInitialized = true;

          // Cache locally
          const state: AppSettingsState = {
            settings,
            updatedAt: dbSettings.updated_at,
          };
          await familyStorageAdapter.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
          return settings;
        }
      }
    } catch {
      // network failure: fall back to local storage
    }
  }

  // Local fallback
  try {
    const raw = await familyStorageAdapter.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      inMemorySettings = { ...DEFAULT_PARENT_SETTINGS };
      return inMemorySettings;
    }

    const parsed = JSON.parse(raw);
    const settings = parsed.settings ? parsed.settings : parsed;
    inMemorySettings = { ...DEFAULT_PARENT_SETTINGS, ...settings };
    hasInitialized = true;
    return inMemorySettings;
  } catch {
    inMemorySettings = { ...DEFAULT_PARENT_SETTINGS };
    return inMemorySettings;
  }
}

/**
 * Save settings.
 */
export async function saveSettings(settings: ParentSettings): Promise<void> {
  inMemorySettings = { ...settings };
  const state: AppSettingsState = {
    settings,
    updatedAt: new Date().toISOString(),
  };
  await familyStorageAdapter.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));

  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user) {
    try {
      const familyId = await getSupabaseFamilyId();
      if (familyId) {
        await client.from('family_settings').upsert(
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
      }
    } catch {
      // ignore network failure
    }
  }
}

/**
 * Update partial parent settings.
 */
export async function updateSettings(
  updates: Partial<ParentSettings>
): Promise<ParentSettings> {
  const current = await getSettings();
  const updated: ParentSettings = {
    ...current,
    ...updates,
  };
  await saveSettings(updated);
  return updated;
}

/**
 * Reset settings to defaults.
 */
export async function resetSettings(): Promise<ParentSettings> {
  const defaults = { ...DEFAULT_PARENT_SETTINGS };
  await saveSettings(defaults);
  return defaults;
}
