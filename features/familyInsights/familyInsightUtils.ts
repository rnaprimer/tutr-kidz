import { ChildId, ChildRecord, FamilyState } from '../family/familyTypes';
import { ProgressState } from '../progress/types';
import { getOverallAccuracy } from '../progress/progressUtils';
import {
  getPracticeTopics,
  getRecentActivity,
  getStrongestTopics,
} from '../insights/insightUtils';
import {
  FamilyActivity,
  FamilyChildSummary,
  FamilySummary,
} from './familyInsightTypes';

/**
 * Get total questions answered for a child from their ProgressState.
 */
export function getChildQuestionCount(progress: ProgressState): number {
  return progress?.overall?.totalQuestionsAnswered || 0;
}

/**
 * Get overall accuracy for a child from their ProgressState.
 */
export function getChildAccuracy(progress: ProgressState): number {
  return getOverallAccuracy(progress);
}

/**
 * Get the latest activity timestamp for a child.
 */
export function getChildLastActivity(progress: ProgressState): string | undefined {
  if (progress?.overall?.lastPlayedAt) {
    return progress.overall.lastPlayedAt;
  }

  let latest: string | undefined = undefined;
  let latestTime = 0;

  for (const record of Object.values(progress?.topics || {})) {
    if (record?.lastPlayedAt) {
      const time = new Date(record.lastPlayedAt).getTime() || 0;
      if (time > latestTime) {
        latestTime = time;
        latest = record.lastPlayedAt;
      }
    }
  }

  return latest;
}

/**
 * Compute independent child summary metrics from their record and progress.
 */
export function getChildInsight(
  childRecord: ChildRecord,
  progress: ProgressState
): FamilyChildSummary {
  const questionsAnswered = getChildQuestionCount(progress);
  const quizzesCompleted = progress?.overall?.quizzesCompleted || 0;
  const accuracy = getChildAccuracy(progress);
  const lastPlayedAt = getChildLastActivity(progress);

  const topicsStarted = Object.values(progress?.topics || {}).filter(
    (topic) => (topic?.attempts || 0) > 0
  ).length;

  const strongestTopics = getStrongestTopics(progress);
  const practiceTopics = getPracticeTopics(progress);
  const recentActivity = getRecentActivity(progress);

  return {
    childId: childRecord.profile.id,
    name: childRecord.profile.name,
    level: childRecord.profile.level,
    questionsAnswered,
    quizzesCompleted,
    accuracy,
    topicsStarted,
    lastPlayedAt,
    strongestTopics,
    practiceTopics,
    recentActivity,
  };
}

/**
 * Generate summaries for all children in the family.
 */
export function getChildSummaries(
  familyState: FamilyState,
  progressMap: Record<ChildId, ProgressState>
): FamilyChildSummary[] {
  const summaries: FamilyChildSummary[] = [];

  for (const childRecord of Object.values(familyState?.children || {})) {
    const progress = progressMap[childRecord.profile.id] || {
      topics: {},
      overall: {
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        totalIncorrectAnswers: 0,
        quizzesCompleted: 0,
      },
    };

    summaries.push(getChildInsight(childRecord, progress));
  }

  return summaries;
}

/**
 * Filter for active learners (children who have recorded learning activity).
 */
export function getActiveChildren(
  childSummaries: FamilyChildSummary[]
): FamilyChildSummary[] {
  return childSummaries.filter((child) => child.questionsAnswered > 0);
}

/**
 * Aggregate high-level family summary metrics without ranking or comparisons.
 */
export function getFamilySummary(
  childSummaries: FamilyChildSummary[]
): FamilySummary {
  const childCount = childSummaries.length;
  const totalQuestionsAnswered = childSummaries.reduce(
    (sum, c) => sum + c.questionsAnswered,
    0
  );
  const totalQuizzesCompleted = childSummaries.reduce(
    (sum, c) => sum + c.quizzesCompleted,
    0
  );
  const activeChildrenCount = childSummaries.filter(
    (c) => c.questionsAnswered > 0
  ).length;

  let lastActivityAt: string | undefined = undefined;
  let latestTime = 0;

  for (const child of childSummaries) {
    if (child.lastPlayedAt) {
      const time = new Date(child.lastPlayedAt).getTime() || 0;
      if (time > latestTime) {
        latestTime = time;
        lastActivityAt = child.lastPlayedAt;
      }
    }
  }

  return {
    childCount,
    totalQuestionsAnswered,
    totalQuizzesCompleted,
    activeChildrenCount,
    lastActivityAt,
  };
}

/**
 * Collect recent learning activity across the family, clearly associating each with its child.
 * Sorted by lastPlayedAt DESC, limited to 10 activities.
 */
export function getFamilyRecentActivity(
  familyState: FamilyState,
  progressMap: Record<ChildId, ProgressState>
): FamilyActivity[] {
  const activities: FamilyActivity[] = [];

  for (const childRecord of Object.values(familyState?.children || {})) {
    const progress = progressMap[childRecord.profile.id];
    if (!progress?.topics) continue;

    for (const record of Object.values(progress.topics)) {
      if (!record || (record.attempts || 0) < 1 || !record.lastPlayedAt) continue;

      activities.push({
        childId: childRecord.profile.id,
        childName: childRecord.profile.name,
        level: record.level,
        topic: record.topic,
        score: record.lastScore,
        total: record.lastTotal,
        lastPlayedAt: record.lastPlayedAt,
      });
    }
  }

  activities.sort((a, b) => {
    const timeA = new Date(a.lastPlayedAt).getTime() || 0;
    const timeB = new Date(b.lastPlayedAt).getTime() || 0;
    return timeB - timeA;
  });

  return activities.slice(0, 10);
}

/**
 * Aggregate practice recommendations across the family.
 */
export function getFamilyPracticeTopics(
  childSummaries: FamilyChildSummary[]
): Array<{ childName: string; childId: ChildId; topic: string; level: string; accuracy: number }> {
  const practiceList: Array<{
    childName: string;
    childId: ChildId;
    topic: string;
    level: string;
    accuracy: number;
  }> = [];

  for (const child of childSummaries) {
    for (const t of child.practiceTopics) {
      practiceList.push({
        childName: child.name,
        childId: child.childId,
        topic: t.title,
        level: t.level,
        accuracy: t.accuracy,
      });
    }
  }

  return practiceList;
}
