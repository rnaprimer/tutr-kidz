/**
 * Tutr Kidz - Learning Continuity & Parent Intelligence Types (Phase 18)
 *
 * Types for deterministic, calm learning-continuity tracking,
 * recent learning windows, activity trends, and parent guidance.
 */

import { CurriculumLevel } from '../../types/curriculum';
import { MasteryLevel } from './insightTypes';

export type ContinuityState =
  | 'not-yet-explored'
  | 'just-started'
  | 'active'
  | 'recently-active'
  | 'needs-a-break';

export type LearningTrend =
  | 'increasing'
  | 'steady'
  | 'decreasing'
  | 'insufficient-data';

export type GuidanceReason =
  | 'just-started'
  | 'consistent'
  | 'quieter'
  | 'revisit'
  | 'exploring'
  | 'insufficient-data';

export interface RecentLearningWindow {
  todayQuestions: number;
  todaySessions: number;
  yesterdayQuestions: number;
  yesterdaySessions: number;
  last7DaysQuestions: number;
  last7DaysSessions: number;
  last7DaysTopicsExplored: number;
  last7DaysActiveDays: number;
  previous7DaysQuestions: number;
  previous7DaysSessions: number;
  previous7DaysTopicsExplored: number;
  previous7DaysActiveDays: number;
}

export interface ParentLearningGuidance {
  title: string;
  message: string;
  reason: GuidanceReason;
  suggestedTopicId?: string;
  suggestedTopicTitle?: string;
}

export interface LearningContinuity {
  state: ContinuityState;
  stateLabel: string;
  trend: LearningTrend;
  trendDescription: string;
  lastActiveDate: string | null;
  daysSinceLastPractice: number | null;
  recentWindow: RecentLearningWindow;
  guidance: ParentLearningGuidance;
}

export type TopicRecentState =
  | 'recently-explored'
  | 'familiar'
  | 'revisit-suggested'
  | 'not-yet-explored';

export interface TopicHistoryItem {
  topicId: string;
  title: string;
  level: CurriculumLevel;
  isToddler: boolean;
  questionsAnswered: number;
  attempts: number;
  accuracy?: number;
  bestScore?: number;
  bestTotal?: number;
  lastPlayedAt?: string;
  daysSincePractice: number | null;
  mastery: MasteryLevel;
  recentState: TopicRecentState;
  displaySummary: string;
}
