/**
 * Tutr Kidz - Gentle Learning Plans & Family Intentions (Phase 19)
 *
 * Types for parent-owned learning intentions, gentle topic guidance,
 * and chronological learning history.
 *
 * Adheres strictly to non-gamified, non-coercive family design:
 * - No targets, streaks, scores, or deadlines
 * - No punitive notifications or performance requirements
 * - Scoped strictly to the child profile and family
 */

export type LearningIntention =
  | 'Keep learning naturally'
  | 'Explore a little each day'
  | 'Practice when ready'
  | 'Focus on mathematics'
  | 'Explore new topics';

export const LEARNING_INTENTIONS: LearningIntention[] = [
  'Keep learning naturally',
  'Explore a little each day',
  'Practice when ready',
  'Focus on mathematics',
  'Explore new topics',
];

export interface LearningPlan {
  childId: string;
  intention: LearningIntention | string;
  selectedTopics: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningHistoryEntry {
  topicId: string;
  topicTitle: string;
  level: string;
  isToddler: boolean;
  lastPlayedAt: string;
  dateFormatted: string;
  questionsAnswered: number;
  accuracy?: number;
  activityType: string;
  timeframe: 'recently' | 'earlier';
}

export interface ChronologicalHistory {
  recently: LearningHistoryEntry[];
  earlier: LearningHistoryEntry[];
  totalEntries: number;
}
