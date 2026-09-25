/**
 * Tutr Kidz - Progress Storage Adapter (Phase 13)
 *
 * Low-level storage adapter and defaults for learning progress.
 */

import { ProgressState } from './types';

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

let memoryStorage: Record<string, string> = {};

export const progressStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback
    }
    return memoryStorage[key] ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback
    }
    memoryStorage[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback
    }
    delete memoryStorage[key];
  },
};
