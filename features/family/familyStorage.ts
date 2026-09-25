/**
 * Tutr Kidz - Family Storage (Phase 13 Facade)
 *
 * Preserves backwards compatibility for existing domain calls while
 * delegating to the cloud-backed familyRepository with local storage fallback.
 */

export {
  familyStorageAdapter,
  FAMILY_STORAGE_KEY,
  DEFAULT_FAMILY_STATE,
  DEFAULT_LEARNING_PREFERENCES,
  generateChildId,
} from './familyStorageAdapter';

export {
  getFamilyState,
  saveFamilyState,
  addChild,
  updateChild,
  removeChild,
  setActiveChild,
  getActiveChild,
  resetFamily,
} from './familyRepository';
