/**
 * Tutr Kidz - Progress Storage (Phase 13 Facade)
 *
 * Preserves backwards compatibility for existing domain calls while
 * delegating to the cloud-backed progressRepository with local storage fallback.
 */

export {
  progressStorageAdapter,
  DEFAULT_STORAGE_KEY,
  DEFAULT_PROGRESS,
} from './progressStorageAdapter';

export {
  resolveProgressKey,
  getProgress,
  saveProgress,
  recordQuizResult,
  resetProgress,
} from './progressRepository';
