/**
 * Tutr Kidz - Platform Storage Abstraction (Phase 26A)
 *
 * Universal persistent storage adapter:
 * - Web (browser): Preserves existing window.localStorage
 * - Native (iOS / Android): Uses @react-native-async-storage/async-storage
 * - Test / Node / SSR: Gracefully falls back to memoryStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// In-memory fallback if persistent storage is unavailable
export const memoryStorage: Record<string, string> = {};

export const platformStorage: StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    // 1. Web: preserve existing browser window.localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // Fallback below
      }
    }

    // 2. Native (iOS / Android) via AsyncStorage
    try {
      const val = await AsyncStorage.getItem(key);
      return val ?? memoryStorage[key] ?? null;
    } catch {
      return memoryStorage[key] ?? null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    // 1. Web: preserve existing browser window.localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // Fallback below
      }
    }

    // 2. Native (iOS / Android) via AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStorage[key] = value;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    // 1. Web: preserve existing browser window.localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // Fallback below
      }
    }

    // 2. Native (iOS / Android) via AsyncStorage
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      delete memoryStorage[key];
    }
  },
};
