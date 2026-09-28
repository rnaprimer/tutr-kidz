/**
 * Tutr Kidz - Parent Feedback Types (Phase 20)
 *
 * Lightweight, non-coercive feedback data structures.
 */

export type FeedbackCategory =
  | "Something isn't working"
  | 'Learning experience'
  | 'Parent experience'
  | 'Suggestion'
  | 'Other';

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  "Something isn't working",
  'Learning experience',
  'Parent experience',
  'Suggestion',
  'Other',
];

export interface FeedbackItem {
  id: string;
  category: FeedbackCategory;
  message?: string;
  createdAt: string;
  status: 'PENDING' | 'SYNCED';
  syncedAt?: string;
}
