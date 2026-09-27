/**
 * Tutr Kidz - Plan & Chronological History Utilities (Phase 19)
 *
 * Deterministic utilities for plan-aware guidance and chronological
 * learning history (Recently vs Earlier).
 */

import { ProgressState } from '../progress/types';
import { CurriculumLevel } from '../../types/curriculum';
import { getTopicsForLevel, getTopicConfig } from '../../data/curriculum';
import { getDaysSinceLastPractice } from '../insights/continuityUtils';
import { ParentLearningGuidance } from '../insights/continuityTypes';
import { ChronologicalHistory, LearningHistoryEntry, LearningPlan } from './planTypes';

/**
 * Categorizes a child's learning history into "Recently" (< 7 days) and "Earlier" (>= 7 days).
 * Completely offline-capable, deterministic, and preserves toddler qualitative separation.
 */
export function getChronologicalLearningHistory(
  progress?: ProgressState | null,
  level: CurriculumLevel = 'class-1',
  referenceDate?: Date
): ChronologicalHistory {
  const result: ChronologicalHistory = {
    recently: [],
    earlier: [],
    totalEntries: 0,
  };

  if (!progress || !progress.topics) return result;

  const entries: LearningHistoryEntry[] = [];
  const ref = referenceDate || new Date();

  for (const key of Object.keys(progress.topics)) {
    const record = progress.topics[key];
    if (!record || !record.lastPlayedAt || (record.attempts || 0) < 1) continue;

    const days = getDaysSinceLastPractice(record.lastPlayedAt, ref);
    if (days === null) continue;

    const topicId = record.topic || key.replace(/^[a-z0-9-]+:/, '');
    const isToddler = record.level === 'toddler' || level === 'toddler';
    const topicConf = getTopicConfig(record.level || level, topicId);
    const topicTitle = topicConf?.title || topicId.charAt(0).toUpperCase() + topicId.slice(1);

    const questionsAnswered = Math.max(0, record.questionsAnswered || 0);
    const correctAnswers = Math.max(0, record.correctAnswers || 0);
    const accuracy = !isToddler && questionsAnswered > 0
      ? Math.round((correctAnswers / questionsAnswered) * 100)
      : undefined;

    let dateFormatted = 'Recently';
    if (days === 0) dateFormatted = 'Today';
    else if (days === 1) dateFormatted = 'Yesterday';
    else if (days < 7) dateFormatted = `${days} days ago`;
    else {
      const d = new Date(record.lastPlayedAt);
      dateFormatted = !isNaN(d.getTime())
        ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
        : 'Earlier';
    }

    const timeframe: 'recently' | 'earlier' = days < 7 ? 'recently' : 'earlier';
    const activityType = isToddler ? 'Toddler activity' : 'Quiz';

    entries.push({
      topicId,
      topicTitle,
      level: record.level || level,
      isToddler,
      lastPlayedAt: record.lastPlayedAt,
      dateFormatted,
      questionsAnswered,
      accuracy,
      activityType,
      timeframe,
    });
  }

  // Sort descending by lastPlayedAt
  entries.sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime());

  for (const entry of entries) {
    if (entry.timeframe === 'recently') {
      result.recently.push(entry);
    } else {
      result.earlier.push(entry);
    }
  }

  result.totalEntries = entries.length;
  return result;
}

/**
 * Enhances base parent guidance with the parent's optional learning intention
 * and selected topics without pressure or deficit language.
 */
export function getPlanAwareGuidance(
  baseGuidance: ParentLearningGuidance,
  plan?: LearningPlan | null,
  progress?: ProgressState | null,
  level: CurriculumLevel = 'class-1'
): ParentLearningGuidance {
  if (!plan || !plan.enabled) {
    return baseGuidance;
  }

  const intention = plan.intention;
  const topics = getTopicsForLevel(level);

  if (intention === 'Explore new topics') {
    // Find first unattempted topic
    const unattempted = topics.find((t) => {
      const rec = progress?.topics?.[t.id] || progress?.topics?.[`${level}:${t.id}`];
      return !rec || rec.attempts === 0;
    });

    if (unattempted) {
      return {
        title: 'Explore When Ready',
        message: `${unattempted.title} has not been explored yet. You can explore it whenever your learner is ready.`,
        reason: 'exploring',
        suggestedTopicId: unattempted.id,
        suggestedTopicTitle: unattempted.title,
      };
    }
  }

  if (intention === 'Practice when ready') {
    // Find a practiced topic that is not yet well-practiced
    const practiced = topics.find((t) => {
      const rec = progress?.topics?.[t.id] || progress?.topics?.[`${level}:${t.id}`];
      return rec && rec.attempts >= 1 && rec.questionsAnswered < 15;
    });

    if (practiced) {
      return {
        title: 'Gentle Familiarity',
        message: `${practiced.title} has been practiced before. A few more questions could help build familiarity.`,
        reason: 'consistent',
        suggestedTopicId: practiced.id,
        suggestedTopicTitle: practiced.title,
      };
    }
  }

  if (intention === 'Focus on mathematics') {
    return {
      title: 'Core Mathematics',
      message: 'Taking time with core math ideas builds steady, lifelong confidence.',
      reason: 'consistent',
    };
  }

  if (intention === 'Explore a little each day') {
    return {
      title: 'Gentle Daily Rhythm',
      message: 'A few minutes of gentle exploration keeps learning fresh and enjoyable.',
      reason: 'consistent',
    };
  }

  return baseGuidance;
}
