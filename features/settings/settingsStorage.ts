/**
 * Tutr Kidz - Settings Storage (Phase 13 Facade)
 *
 * Preserves backwards compatibility for existing domain calls while
 * delegating to the cloud-backed settingsRepository with local storage fallback.
 */

export {
  SETTINGS_STORAGE_KEY,
  DEFAULT_PARENT_SETTINGS,
  DEFAULT_APP_SETTINGS_STATE,
} from './settingsStorageAdapter';

export {
  getCachedSettings,
  getSettings,
  saveSettings,
  updateSettings,
  resetSettings,
} from './settingsRepository';
