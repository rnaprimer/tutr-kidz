import { CurriculumLevel } from '../../types/curriculum';
import { getTopicsForLevel } from '../../data/curriculum';
import { ChildRecord } from '../family/familyTypes';
import { ProgressState } from '../progress/types';
import { getTopicAccuracy } from '../progress/progressUtils';
import { getTodayQuestionsAnswered } from '../profile/profileUtils';
import {
  DailyLearningRecommendation,
  RecommendationReason,
} from './dailyLearningTypes';

export interface RecommendationParams {
  childRecord: ChildRecord;
  progress: ProgressState;
  isGoalEnabled?: boolean;
}

/**
 * Calculate remaining questions towards the daily goal.
 */
export function calculateRemainingQuestions(
  answeredToday: number,
  goal: number
): number {
  return Math.max(0, goal - answeredToday);
}

/**
 * Derives a gentle, calm daily learning recommendation for the active learner.
 * Pure function: never mutates state or makes network/storage calls.
 */
export function getDailyRecommendation({
  childRecord,
  progress,
  isGoalEnabled = true,
}: RecommendationParams): DailyLearningRecommendation {
  const childId = childRecord.profile.id;
  const childName = childRecord.profile.name;
  const level = childRecord.profile.level;
  const goal = childRecord.preferences?.dailyQuestionGoal ?? 5;
  const questionsAnsweredToday = getTodayQuestionsAnswered(progress);
  const remainingQuestions = isGoalEnabled
    ? calculateRemainingQuestions(questionsAnsweredToday, goal)
    : 0;
  const isGoalReached = isGoalEnabled && questionsAnsweredToday >= goal;

  const actionRoute =
    level === 'toddler' ? '/toddler' : `/level/${level}/topics`;

  const levelTopics = getTopicsForLevel(level);

  // 1. EMPTY STATE: Brand new learner with zero questions answered
  if (
    !progress.overall ||
    progress.overall.totalQuestionsAnswered === 0 ||
    Object.keys(progress.topics || {}).length === 0
  ) {
    const firstTopic = levelTopics[0];
    return {
      childId,
      childName,
      level,
      topicId: firstTopic?.id || '',
      title: 'Start with something simple.',
      description: 'Choose a topic below to begin learning.',
      reason: 'none',
      actionLabel: 'Choose Topic',
      actionRoute,
      questionsAnsweredToday,
      dailyQuestionGoal: goal,
      remainingQuestions,
      isGoalEnabled,
      isGoalReached,
    };
  }

  // 2. PRIORITY 2: Suggested practice for topics with accuracy < 70% and >= 5 questions
  const practiceCandidates: Array<{
    topicId: string;
    title: string;
    accuracy: number;
    attempts: number;
  }> = [];

  for (const topic of levelTopics) {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    if (record && record.questionsAnswered >= 5) {
      const accuracy = getTopicAccuracy(record);
      if (accuracy < 70) {
        practiceCandidates.push({
          topicId: topic.id,
          title: topic.title,
          accuracy,
          attempts: record.attempts,
        });
      }
    }
  }

  if (practiceCandidates.length > 0) {
    practiceCandidates.sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.attempts - a.attempts;
    });

    const chosen = practiceCandidates[0];
    return {
      childId,
      childName,
      level,
      topicId: chosen.topicId,
      title: `Practice ${chosen.title}`,
      description: 'Practice a few more questions to build confidence.',
      reason: 'practice',
      actionLabel: 'Practice',
      actionRoute,
      questionsAnsweredToday,
      dailyQuestionGoal: goal,
      remainingQuestions,
      isGoalEnabled,
      isGoalReached,
    };
  }

  // 3. PRIORITY 1: Continue recent practice
  const recentCandidates: Array<{
    topicId: string;
    title: string;
    lastPlayedAt: string;
    timestamp: number;
  }> = [];

  for (const topic of levelTopics) {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    if (record && record.attempts >= 1 && record.lastPlayedAt) {
      recentCandidates.push({
        topicId: topic.id,
        title: topic.title,
        lastPlayedAt: record.lastPlayedAt,
        timestamp: new Date(record.lastPlayedAt).getTime() || 0,
      });
    }
  }

  // Also check if child practiced another level recently
  if (recentCandidates.length === 0) {
    for (const [key, record] of Object.entries(progress.topics || {})) {
      if (record && record.attempts >= 1 && record.lastPlayedAt) {
        const [recLevel, recTopic] = key.split(':');
        if (recLevel === level) {
          const cfg = levelTopics.find((t) => t.id === recTopic);
          recentCandidates.push({
            topicId: recTopic,
            title: cfg?.title || recTopic,
            lastPlayedAt: record.lastPlayedAt,
            timestamp: new Date(record.lastPlayedAt).getTime() || 0,
          });
        }
      }
    }
  }

  if (recentCandidates.length > 0) {
    recentCandidates.sort((a, b) => b.timestamp - a.timestamp);
    const chosen = recentCandidates[0];
    return {
      childId,
      childName,
      level,
      topicId: chosen.topicId,
      title: `Continue ${chosen.title}`,
      description: `Keep practicing ${chosen.title} from your recent learning.`,
      reason: 'continue',
      actionLabel: 'Continue',
      actionRoute,
      questionsAnsweredToday,
      dailyQuestionGoal: goal,
      remainingQuestions,
      isGoalEnabled,
      isGoalReached,
    };
  }

  // 4. PRIORITY 3: New topic (unstarted in child's current level)
  const unstarted = levelTopics.filter((topic) => {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    return !record || record.attempts === 0;
  });

  if (unstarted.length > 0) {
    const chosen = unstarted[0];
    return {
      childId,
      childName,
      level,
      topicId: chosen.id,
      title: `Try ${chosen.title}`,
      description: 'Explore something new today.',
      reason: 'new',
      actionLabel: 'Start',
      actionRoute,
      questionsAnsweredToday,
      dailyQuestionGoal: goal,
      remainingQuestions,
      isGoalEnabled,
      isGoalReached,
    };
  }

  // 5. PRIORITY 4: Review (revisit previously practiced topic)
  const reviewCandidates: Array<{
    topicId: string;
    title: string;
    timestamp: number;
  }> = [];

  for (const topic of levelTopics) {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    reviewCandidates.push({
      topicId: topic.id,
      title: topic.title,
      timestamp: record?.lastPlayedAt
        ? new Date(record.lastPlayedAt).getTime()
        : 0,
    });
  }

  reviewCandidates.sort((a, b) => a.timestamp - b.timestamp);
  const chosen = reviewCandidates[0] || levelTopics[0];

  return {
    childId,
    childName,
    level,
    topicId: chosen.topicId || (chosen as any).id,
    title: `Review ${chosen.title}`,
    description: "Revisit something you've practiced before.",
    reason: 'review',
    actionLabel: 'Review',
    actionRoute,
    questionsAnsweredToday,
    dailyQuestionGoal: goal,
    remainingQuestions,
    isGoalEnabled,
    isGoalReached,
  };
}
