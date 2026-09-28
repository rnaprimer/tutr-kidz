/**
 * Tutr Kidz - Parent Feedback Repository (Phase 20)
 *
 * Single-source-of-truth access for submitting and viewing feedback.
 * Works 100% offline first, queuing entries to the central sync queue.
 */

import { FeedbackCategory, FeedbackItem } from './feedbackTypes';
import { feedbackStorageAdapter } from './feedbackStorage';
import { enqueueSyncItem } from '../sync/syncQueue';
import { trackEvent } from '../../lib/analytics';
import { trackError } from '../../lib/observability';

export async function submitFeedback(
  category: FeedbackCategory,
  message?: string
): Promise<FeedbackItem> {
  const item: FeedbackItem = {
    id: `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category,
    message: message?.trim() ? message.trim().slice(0, 1000) : undefined,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
  };

  // 1. Write locally first
  await feedbackStorageAdapter.saveFeedbackItem(item);

  // 2. Queue for cloud sync via existing sync queue
  try {
    await enqueueSyncItem({
      entityType: 'feedback',
      entityId: item.id,
      operation: 'CREATE',
      payload: {
        id: item.id,
        category: item.category,
        message: item.message,
        created_at: item.createdAt,
      },
    });
  } catch (err) {
    trackError(err instanceof Error ? err : 'Feedback enqueue failed');
  }

  // 3. Track product-level event (sanitized: only category, never raw message text)
  trackEvent('feedback_submitted', {
    category: item.category,
    hasMessage: !!item.message,
  });

  return item;
}

export async function getFeedbackHistory(): Promise<FeedbackItem[]> {
  return await feedbackStorageAdapter.getFeedbackList();
}
