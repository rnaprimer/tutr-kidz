import { CurriculumLevel } from '../../types/curriculum';
import { getTopicsForLevel } from '../../data/curriculum';
import { ProgressRecord, ProgressState } from './types';

/**
 * Calculate percentage accuracy (0 - 100) for a specific topic record.
 */
export function getTopicAccuracy(record?: ProgressRecord): number {
  if (!record || record.questionsAnswered === 0) {
    return 0;
  }
  return Math.round((record.correctAnswers / record.questionsAnswered) * 100);
}

/**
 * Calculate overall percentage accuracy (0 - 100) across all quizzes.
 */
export function getOverallAccuracy(progress: ProgressState): number {
  const { totalQuestionsAnswered, totalCorrectAnswers } = progress.overall;
  if (!totalQuestionsAnswered || totalQuestionsAnswered === 0) {
    return 0;
  }
  return Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100);
}

/**
 * Retrieve a map of topic progress records for a given curriculum level.
 */
export function getLevelTopicProgress(
  progress: ProgressState,
  level: CurriculumLevel
): Record<string, ProgressRecord> {
  const result: Record<string, ProgressRecord> = {};
  const prefix = `${level}:`;
  for (const [key, record] of Object.entries(progress.topics)) {
    if (key.startsWith(prefix) && record) {
      result[record.topic] = record;
    }
  }
  return result;
}

/**
 * Count how many topics/activities have been completed for a given level.
 * A topic is completed when at least one quiz session has been finished (attempts >= 1).
 */
export function getCompletedTopicCount(
  progress: ProgressState,
  level: CurriculumLevel
): number {
  const topics = getTopicsForLevel(level);
  let completed = 0;
  for (const topic of topics) {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    if (record && record.attempts >= 1) {
      completed += 1;
    }
  }
  return completed;
}

export interface LevelProgressSummary {
  totalTopics: number;
  startedTopics: number;
  completedTopics: number;
  totalAttempts: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
}

/**
 * Calculate aggregated progress metrics for a curriculum level.
 * Uses curriculum.ts as the single source of truth for topic counts.
 */
export function getLevelProgress(
  progress: ProgressState,
  level: CurriculumLevel
): LevelProgressSummary {
  const topics = getTopicsForLevel(level);
  let startedTopics = 0;
  let completedTopics = 0;
  let totalAttempts = 0;
  let questionsAnswered = 0;
  let correctAnswers = 0;

  for (const topic of topics) {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    if (record && record.attempts >= 1) {
      startedTopics += 1;
      completedTopics += 1;
      totalAttempts += record.attempts;
      questionsAnswered += record.questionsAnswered;
      correctAnswers += record.correctAnswers;
    }
  }

  const accuracy =
    questionsAnswered > 0
      ? Math.round((correctAnswers / questionsAnswered) * 100)
      : 0;

  return {
    totalTopics: topics.length,
    startedTopics,
    completedTopics,
    totalAttempts,
    questionsAnswered,
    correctAnswers,
    accuracy,
  };
}

/**
 * Retrieve up to `limit` most recently practiced topic records, sorted newest first.
 */
export function getRecentTopics(
  progress: ProgressState,
  limit: number = 5
): ProgressRecord[] {
  const records = Object.values(progress.topics).filter(
    (r): r is ProgressRecord => !!r && !!r.lastPlayedAt
  );

  records.sort((a, b) => {
    const timeA = new Date(a.lastPlayedAt).getTime() || 0;
    const timeB = new Date(b.lastPlayedAt).getTime() || 0;
    return timeB - timeA;
  });

  return records.slice(0, limit);
}
