import { ChildId, ChildRecord } from '../family/familyTypes';
import { getFamilyState } from '../family/familyStorage';
import { getProgress } from '../progress/progressStorage';
import { ProgressState } from '../progress/types';
import {
  getLevelInsights,
  getPracticeTopics,
  getRecentActivity,
  getStrongestTopics,
} from '../insights/insightUtils';
import { LevelInsight, TopicInsight } from '../insights/insightTypes';
import {
  FamilyChildSummary,
  FamilyDashboardData,
} from './familyInsightTypes';
import {
  getActiveChildren,
  getChildInsight,
  getChildSummaries,
  getFamilyRecentActivity,
  getFamilySummary,
} from './familyInsightUtils';

/**
 * Load complete family-level learning insights.
 * Source of truth is Phase 9 family storage and child-specific progress storage.
 */
export async function fetchFamilyDashboardData(): Promise<FamilyDashboardData> {
  const familyState = await getFamilyState();
  const children = Object.values(familyState.children);
  const progressMap: Record<ChildId, ProgressState> = {};

  await Promise.all(
    children.map(async (child) => {
      const progress = await getProgress(child.profile.id);
      progressMap[child.profile.id] = progress;
    })
  );

  const childSummaries = getChildSummaries(familyState, progressMap);
  const summary = getFamilySummary(childSummaries);
  const recentActivity = getFamilyRecentActivity(familyState, progressMap);
  const activeChildren = getActiveChildren(childSummaries);

  return {
    summary,
    childSummaries,
    recentActivity,
    activeChildren,
    hasChildren: children.length > 0,
  };
}

export interface ChildDetailData {
  childRecord: ChildRecord;
  progress: ProgressState;
  summary: FamilyChildSummary;
  levelInsights: LevelInsight[];
  strongestTopics: TopicInsight[];
  practiceTopics: TopicInsight[];
  recentActivity: TopicInsight[];
}

/**
 * Load detailed insight data for a specific learner.
 * Does NOT modify or rely on activeChildId.
 */
export async function fetchChildDetailData(
  childId: ChildId
): Promise<ChildDetailData | null> {
  const familyState = await getFamilyState();
  const childRecord = familyState.children[childId];
  if (!childRecord) {
    return null;
  }

  const progress = await getProgress(childId);
  const summary = getChildInsight(childRecord, progress);
  const levelInsights = getLevelInsights(progress);
  const strongestTopics = getStrongestTopics(progress);
  const practiceTopics = getPracticeTopics(progress);
  const recentActivity = getRecentActivity(progress);

  return {
    childRecord,
    progress,
    summary,
    levelInsights,
    strongestTopics,
    practiceTopics,
    recentActivity,
  };
}
