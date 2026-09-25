/**
 * Tutr Kidz - Settings Storage Adapter (Phase 13)
 *
 * Low-level storage adapter and defaults for app settings.
 */

import { ParentSettings, AppSettingsState } from './settingsTypes';

export const SETTINGS_STORAGE_KEY = 'tutr_kidz_settings';

export const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  dailyQuestionGoalEnabled: true,
  defaultDailyQuestionGoal: 5,
  showAllLevelsByDefault: true,
  sessionQuestionCount: 5,
  reduceMotion: false,
  parentLockEnabled: false,
  requireParentConfirmationForReset: true,
};

export const DEFAULT_APP_SETTINGS_STATE: AppSettingsState = {
  settings: DEFAULT_PARENT_SETTINGS,
  updatedAt: new Date(0).toISOString(),
};
