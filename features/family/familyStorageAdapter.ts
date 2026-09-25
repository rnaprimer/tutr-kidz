/**
 * Tutr Kidz - Family Storage Adapter (Phase 13)
 *
 * Low-level storage adapter and defaults for family profiles.
 */

import { ChildId, FamilyState, LearningPreferences } from './familyTypes';

export const FAMILY_STORAGE_KEY = 'tutr_kidz_family';

export const DEFAULT_LEARNING_PREFERENCES: LearningPreferences = {
  dailyQuestionGoal: 5,
  showAllLevels: true,
};

export const DEFAULT_FAMILY_STATE: FamilyState = {
  children: {},
  activeChildId: null,
};

let familyMemoryStorage: Record<string, string> = {};

export const familyStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback
    }
    return familyMemoryStorage[key] ?? null;
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
    familyMemoryStorage[key] = value;
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
    delete familyMemoryStorage[key];
  },
};

export function generateChildId(): ChildId {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `child_${timestamp}_${random}`;
}
