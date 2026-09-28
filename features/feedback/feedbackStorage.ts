/**
 * Tutr Kidz - Feedback Storage Adapter (Phase 20)
 *
 * Local-first storage for parent feedback entries.
 */

import { familyStorageAdapter } from '../family/familyStorageAdapter';
import { FeedbackItem } from './feedbackTypes';

export const FEEDBACK_STORAGE_KEY = 'tutr_kidz_feedback';

export const feedbackStorageAdapter = {
  getFeedbackList: async (): Promise<FeedbackItem[]> => {
    try {
      const raw = await familyStorageAdapter.getItem(FEEDBACK_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as FeedbackItem[];
    } catch {
      return [];
    }
  },

  saveFeedbackItem: async (item: FeedbackItem): Promise<void> => {
    try {
      const list = await feedbackStorageAdapter.getFeedbackList();
      list.unshift(item);
      await familyStorageAdapter.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Safe fail
    }
  },

  markFeedbackSynced: async (id: string, syncedAt: string): Promise<void> => {
    try {
      const list = await feedbackStorageAdapter.getFeedbackList();
      const updated = list.map((item) =>
        item.id === id ? { ...item, status: 'SYNCED' as const, syncedAt } : item
      );
      await familyStorageAdapter.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Safe fail
    }
  },
};
