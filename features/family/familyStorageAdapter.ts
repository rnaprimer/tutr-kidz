/**
 * Tutr Kidz - Family Storage Adapter (Phase 13, Phase 26A Native Update)
 *
 * Low-level storage adapter and defaults for family profiles.
 * Supports web localStorage and native AsyncStorage with in-memory fallback.
 */

import { ChildId, FamilyState, LearningPreferences } from './familyTypes';
import { platformStorage } from '../../lib/storage/platformStorage';

export const FAMILY_STORAGE_KEY = 'tutr_kidz_family';

export const DEFAULT_LEARNING_PREFERENCES: LearningPreferences = {
  dailyQuestionGoal: 5,
  showAllLevels: true,
};

export const DEFAULT_FAMILY_STATE: FamilyState = {
  children: {},
  activeChildId: null,
};

export const familyStorageAdapter = {
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

export function generateChildId(): ChildId {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `child_${timestamp}_${random}`;
}
