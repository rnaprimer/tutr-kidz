import type { LearningPlan } from '../plans/planTypes';
/**
 * Tutr Kidz - Learning Continuity & Parent Intelligence Utilities (Phase 18)
 *
 * Pure, deterministic functions operating on existing progress records.
 * Provides calm, non-punitive insights for parents without introducing
 * streaks, badges, or performance pressure.
 */

import { CurriculumLevel } from '../../types/curriculum';
import { ProgressState, ProgressRecord } from '../progress/types';
import { getTopicsForLevel } from '../../data/curriculum';
import { getTopicMastery } from './insightUtils';
import {
  ContinuityState,
  LearningContinuity,
  LearningTrend,
  ParentLearningGuidance,
  RecentLearningWindow,
  TopicHistoryItem,
  TopicRecentState,
} from './continuityTypes';

/**
 * Deterministically finds the latest active date across progress records.
 * Safely handles null, undefined, and empty records.
 */
export function getLastActiveDate(progress?: ProgressState | null): string | null {
  if (!progress) return null;

  let latestDate: string | null = null;
  let latestTime = 0;

  if (progress.overall?.lastPlayedAt) {
    const time = new Date(progress.overall.lastPlayedAt).getTime();
    if (!isNaN(time) && time > latestTime) {
      latestTime = time;
      latestDate = progress.overall.lastPlayedAt;
    }
  }

  if (progress.topics && typeof progress.topics === 'object') {
    for (const key of Object.keys(progress.topics)) {
      const topic = progress.topics[key];
      if (topic?.lastPlayedAt) {
        const time = new Date(topic.lastPlayedAt).getTime();
        if (!isNaN(time) && time > latestTime) {
          latestTime = time;
          latestDate = topic.lastPlayedAt;
        }
      }
    }
  }

  return latestDate;
}

/**
 * Calculates calendar days elapsed since a given ISO date.
 * Clamps future dates to 0. Returns null on invalid or missing date.
 */
export function getDaysSinceLastPractice(
  lastPlayedAt?: string | null,
  referenceDate?: Date
): number | null {
  if (!lastPlayedAt || typeof lastPlayedAt !== 'string') return null;

  const played = new Date(lastPlayedAt);
  if (isNaN(played.getTime())) return null;

  const ref = referenceDate ? new Date(referenceDate) : new Date();
  if (isNaN(ref.getTime())) return null;

  const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const playedMidnight = new Date(played.getFullYear(), played.getMonth(), played.getDate()).getTime();

  const diffMs = refMidnight - playedMidnight;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Deterministically calculates activity in recent time windows:
 * - today (0 days ago)
 * - yesterday (1 day ago)
 * - last 7 days (0..6 days ago)
 * - previous 7 days (7..13 days ago)
 */
export function getRecentLearningWindow(
  progress?: ProgressState | null,
  referenceDate?: Date
): RecentLearningWindow {
  const result: RecentLearningWindow = {
    todayQuestions: 0,
    todaySessions: 0,
    yesterdayQuestions: 0,
    yesterdaySessions: 0,
    last7DaysQuestions: 0,
    last7DaysSessions: 0,
    last7DaysTopicsExplored: 0,
    last7DaysActiveDays: 0,
    previous7DaysQuestions: 0,
    previous7DaysSessions: 0,
    previous7DaysTopicsExplored: 0,
    previous7DaysActiveDays: 0,
  };

  if (!progress || !progress.topics) return result;

  const last7DaysSet = new Set<string>();
  const previous7DaysSet = new Set<string>();
  const last7TopicsSet = new Set<string>();
  const prev7TopicsSet = new Set<string>();

  for (const topicKey of Object.keys(progress.topics)) {
    const record = progress.topics[topicKey];
    if (!record || !record.lastPlayedAt) continue;

    const days = getDaysSinceLastPractice(record.lastPlayedAt, referenceDate);
    if (days === null) continue;

    const questions = Math.max(0, record.questionsAnswered || 0);
    const attempts = Math.max(0, record.attempts || 0);

    // Format date string YYYY-MM-DD for unique active days
    const playedDate = new Date(record.lastPlayedAt);
    const dateStr = !isNaN(playedDate.getTime())
      ? `${playedDate.getFullYear()}-${playedDate.getMonth() + 1}-${playedDate.getDate()}`
      : String(days);

    if (days === 0) {
      result.todayQuestions += questions;
      result.todaySessions += attempts;
    } else if (days === 1) {
      result.yesterdayQuestions += questions;
      result.yesterdaySessions += attempts;
    }

    if (days >= 0 && days < 7) {
      result.last7DaysQuestions += questions;
      result.last7DaysSessions += attempts;
      last7DaysSet.add(dateStr);
      last7TopicsSet.add(topicKey);
    } else if (days >= 7 && days < 14) {
      result.previous7DaysQuestions += questions;
      result.previous7DaysSessions += attempts;
      previous7DaysSet.add(dateStr);
      prev7TopicsSet.add(topicKey);
    }
  }

  result.last7DaysActiveDays = last7DaysSet.size;
  result.last7DaysTopicsExplored = last7TopicsSet.size;
  result.previous7DaysActiveDays = previous7DaysSet.size;
  result.previous7DaysTopicsExplored = prev7TopicsSet.size;

  return result;
}

/**
 * Calculates learning trend comparing recent 7 days to previous 7 days.
 * Neutral, calm, deterministic evaluation.
 */
export function getLearningTrend(
  recent7DaysQuestions: number,
  previous7DaysQuestions: number
): LearningTrend {
  if (recent7DaysQuestions <= 0 && previous7DaysQuestions <= 0) {
    return 'insufficient-data';
  }

  if (previous7DaysQuestions <= 0) {
    return recent7DaysQuestions >= 1 ? 'increasing' : 'insufficient-data';
  }

  if (recent7DaysQuestions > previous7DaysQuestions * 1.25) {
    return 'increasing';
  }

  if (recent7DaysQuestions < previous7DaysQuestions * 0.75) {
    return 'decreasing';
  }

  return 'steady';
}

/**
 * Returns calm, human-friendly wording for learning trends.
 */
export function getTrendDescription(trend: LearningTrend): string {
  switch (trend) {
    case 'increasing':
      return 'Learning activity has been increasing recently.';
    case 'steady':
      return 'Learning activity has been fairly consistent.';
    case 'decreasing':
      return 'Learning activity has been a little quieter recently.';
    case 'insufficient-data':
    default:
      return 'There is not enough recent activity to identify a pattern yet.';
  }
}

/**
 * Returns practice frequency description.
 */
export function getPracticeFrequency(
  activeDaysInWeek: number
): string {
  if (activeDaysInWeek >= 5) {
    return 'Very regular exploration';
  }
  if (activeDaysInWeek >= 3) {
    return 'Several days of practice';
  }
  if (activeDaysInWeek >= 1) {
    return 'Occasional practice';
  }
  return 'Not yet active this week';
}

/**
 * Computes full deterministic learning continuity for a learner.
 */
export function getLearningContinuity(
  progress?: ProgressState | null,
  level: CurriculumLevel = 'class-1',
  referenceDate?: Date,
  plan?: LearningPlan | null
): LearningContinuity {
  const lastActiveDate = getLastActiveDate(progress);
  const daysSinceLastPractice = getDaysSinceLastPractice(lastActiveDate, referenceDate);
  const recentWindow = getRecentLearningWindow(progress, referenceDate);
  const trend = getLearningTrend(recentWindow.last7DaysQuestions, recentWindow.previous7DaysQuestions);
  const trendDescription = getTrendDescription(trend);

  const totalQuestions = progress?.overall?.totalQuestionsAnswered ?? 0;
  const hasTopics = progress?.topics && Object.keys(progress.topics).length > 0;

  let state: ContinuityState = 'not-yet-explored';
  let stateLabel = 'Not Yet Explored';

  if (!progress || (totalQuestions === 0 && !hasTopics)) {
    state = 'not-yet-explored';
    stateLabel = 'Not Yet Explored';
  } else if (totalQuestions <= 5) {
    state = 'just-started';
    stateLabel = 'Just Started';
  } else if (daysSinceLastPractice === 0) {
    state = 'active';
    stateLabel = 'Active Today';
  } else if (daysSinceLastPractice !== null && daysSinceLastPractice <= 3) {
    state = 'recently-active';
    stateLabel = 'Recently Active';
  } else {
    state = 'needs-a-break';
    stateLabel = 'Ready to Revisit';
  }

  const guidance = getParentLearningGuidance(progress, level, referenceDate, plan);

  return {
    state,
    stateLabel,
    trend,
    trendDescription,
    lastActiveDate,
    daysSinceLastPractice,
    recentWindow,
    guidance,
  };
}

/**
 * Deterministically generates calm, non-punitive parent guidance based solely
 * on observable progress records.
 */
export function getParentLearningGuidance(
  progress?: ProgressState | null,
  level: CurriculumLevel = 'class-1',
  referenceDate?: Date,
  plan?: LearningPlan | null
): ParentLearningGuidance {
  const totalQuestions = progress?.overall?.totalQuestionsAnswered ?? 0;

  if (!progress || totalQuestions === 0) {
    return {
      title: 'Ready to Explore',
      message: 'Keep exploring topics naturally as your child is ready.',
      reason: 'insufficient-data',
    };
  }

  if (totalQuestions <= 5) {
    return {
      title: 'A Great Beginning',
      message: 'Your child has started exploring this area.',
      reason: 'just-started',
    };
  }

  // Check if any previously attempted topic hasn't been visited in > 7 days
  if (progress.topics) {
    const topics = getTopicsForLevel(level);
    for (const t of topics) {
      const record = progress.topics[t.id] || progress.topics[`${level}:${t.id}`];
      if (record && record.attempts >= 1 && record.lastPlayedAt) {
        const days = getDaysSinceLastPractice(record.lastPlayedAt, referenceDate);
        if (days !== null && days >= 7) {
          return {
            title: 'Gentle Revisit',
            message: 'A gentle revisit may help keep this idea familiar.',
            reason: 'revisit',
            suggestedTopicId: t.id,
            suggestedTopicTitle: t.title,
          };
        }
      }
    }
  }

  const window = getRecentLearningWindow(progress, referenceDate);
  const trend = getLearningTrend(window.last7DaysQuestions, window.previous7DaysQuestions);

  if (trend === 'increasing' || trend === 'steady') {
    return {
      title: 'Consistent Learning',
      message: 'Learning has been fairly consistent recently.',
      reason: 'consistent',
    };
  }

  if (trend === 'decreasing') {
    return {
      title: 'Gentle Pace',
      message: 'Learning activity has been a little quieter recently.',
      reason: 'quieter',
    };
  }

  const baseResult: ParentLearningGuidance = {
    title: 'Natural Pace',
    message: 'Keep exploring topics naturally as your child is ready.',
    reason: 'exploring',
  };

  if (plan && plan.enabled) {
    if (plan.intention === 'Explore new topics') {
      const topics = getTopicsForLevel(level);
      const unattempted = topics.find((t) => {
        const rec = progress?.topics?.[t.id] || progress?.topics?.[level + ':' + t.id];
        return !rec || rec.attempts === 0;
      });
      if (unattempted) {
        return {
          title: 'Explore When Ready',
          message: unattempted.title + ' has not been explored yet. You can explore it whenever your learner is ready.',
          reason: 'exploring',
          suggestedTopicId: unattempted.id,
          suggestedTopicTitle: unattempted.title,
        };
      }
    } else if (plan.intention === 'Practice when ready') {
      const topics = getTopicsForLevel(level);
      const practiced = topics.find((t) => {
        const rec = progress?.topics?.[t.id] || progress?.topics?.[level + ':' + t.id];
        return rec && rec.attempts >= 1 && rec.questionsAnswered < 15;
      });
      if (practiced) {
        return {
          title: 'Gentle Familiarity',
          message: practiced.title + ' has been practiced before. A few more questions could help build familiarity.',
          reason: 'consistent',
          suggestedTopicId: practiced.id,
          suggestedTopicTitle: practiced.title,
        };
      }
    } else if (plan.intention === 'Focus on mathematics') {
      return {
        title: 'Core Mathematics',
        message: 'Taking time with core math ideas builds steady, lifelong confidence.',
        reason: 'consistent',
      };
    } else if (plan.intention === 'Explore a little each day') {
      return {
        title: 'Gentle Daily Rhythm',
        message: 'A few minutes of gentle exploration keeps learning fresh and enjoyable.',
        reason: 'consistent',
      };
    }
  }

  return baseResult;
}

/**
 * Formats topic history for a specific curriculum level.
 * Strictly separates Toddler exploration from Class 1-4 mathematics.
 */
export function getTopicHistory(
  progress?: ProgressState | null,
  level: CurriculumLevel = 'class-1',
  referenceDate?: Date
): TopicHistoryItem[] {
  const topics = getTopicsForLevel(level);
  const isToddler = level === 'toddler';

  return topics.map((t) => {
    const record: ProgressRecord | undefined = progress?.topics
      ? progress.topics[t.id] || progress.topics[`${level}:${t.id}`]
      : undefined;

    const attempts = record?.attempts || 0;
    const questionsAnswered = record?.questionsAnswered || 0;
    const correctAnswers = record?.correctAnswers || 0;
    const lastPlayedAt = record?.lastPlayedAt;
    const daysSincePractice = getDaysSinceLastPractice(lastPlayedAt, referenceDate);

    const accuracy = !isToddler && questionsAnswered > 0
      ? Math.round((correctAnswers / questionsAnswered) * 100)
      : undefined;

    const mastery = getTopicMastery(record);

    let recentState: TopicRecentState = 'not-yet-explored';
    let displaySummary = '';

    if (isToddler) {
      if (attempts >= 1) {
        recentState = 'recently-explored';
        displaySummary = `${t.title} has been explored recently.`;
      } else {
        recentState = 'not-yet-explored';
        displaySummary = 'Ready to explore when your toddler is curious.';
      }
    } else {
      if (attempts === 0) {
        recentState = 'not-yet-explored';
        displaySummary = 'Not yet explored';
      } else if (daysSincePractice !== null && daysSincePractice >= 10) {
        recentState = 'revisit-suggested';
        displaySummary = 'A gentle revisit may help keep this familiar';
      } else if (mastery === 'comfortable' || mastery === 'well-practiced') {
        recentState = 'familiar';
        displaySummary = 'Feels familiar and comfortable';
      } else {
        recentState = 'recently-explored';
        displaySummary = 'Recently practiced';
      }
    }

    return {
      topicId: t.id,
      title: t.title,
      level,
      isToddler,
      questionsAnswered,
      attempts,
      accuracy,
      bestScore: record?.bestScore,
      bestTotal: record?.bestTotal,
      lastPlayedAt,
      daysSincePractice,
      mastery,
      recentState,
      displaySummary,
    };
  });
}
