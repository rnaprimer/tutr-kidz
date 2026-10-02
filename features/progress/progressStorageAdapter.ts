/**
 * Tutr Kidz - Progress Storage Adapter (Phase 13, Phase 26A Native Update)
 *
 * Low-level storage adapter and defaults for learning progress.
 * Supports web localStorage and native AsyncStorage with memoryStorage fallback.
 */

import { ProgressState } from './types';
import { platformStorage, memoryStorage } from '../../lib/storage/platformStorage';

export const DEFAULT_STORAGE_KEY = 'tutr_kidz_progress';

export const DEFAULT_PROGRESS: ProgressState = {
  topics: {},
  overall: {
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    totalIncorrectAnswers: 0,
    quizzesCompleted: 0,
  },
};

// Persistent storage adapter:
// - Web: uses window.localStorage
// - Native: uses @react-native-async-storage/async-storage
// - Fallback: uses memoryStorage
export const progressStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return platformStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    return platformStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    return platformStorage.removeItem(key);
  },
};
