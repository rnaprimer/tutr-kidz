import { getFamilyState } from '../family/familyRepository';
import { getProgress } from '../progress/progressRepository';
import { getOverallAccuracy } from '../progress/progressUtils';
import {
  LearningInsight,
  LevelInsight,
  TopicInsight,
  LearningSummary,
} from './insightTypes';
import {
  getLearningInsights,
  getLevelInsights,
  getPracticeTopics,
  getRecentActivity,
  getStrongestTopics,
  getTopicInsights,
  getLearningSummary,
} from './insightUtils';

export interface ParentDashboardData {
  hasData: boolean;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  overallAccuracy: number;
  levelInsights: LevelInsight[];
  strongestTopics: TopicInsight[];
  practiceTopics: TopicInsight[];
  recentActivity: TopicInsight[];
  learningInsights: LearningInsight[];
  learningSummary?: LearningSummary | null;
}

/**
 * Fetch detailed learning summary for a child (or active child if unspecified).
 * Works offline from locally cached progress and family state.
 */
export async function fetchChildLearningSummary(
  childId?: string | null
): Promise<LearningSummary | null> {
  const familyState = await getFamilyState();
  const targetId = childId || familyState.activeChildId;

  if (!targetId || !familyState.children[targetId]) {
    return null;
  }

  const childRecord = familyState.children[targetId];
  const progress = await getProgress(targetId);

  return getLearningSummary(childRecord, progress);
}

/**
 * Fetch all topic insights for a specific child's level.
 */
export async function fetchChildTopicInsights(
  childId?: string | null
): Promise<TopicInsight[]> {
  const familyState = await getFamilyState();
  const targetId = childId || familyState.activeChildId;

  if (!targetId || !familyState.children[targetId]) {
    return [];
  }

  const childRecord = familyState.children[targetId];
  const progress = await getProgress(targetId);

  return getTopicInsights(progress, targetId, childRecord.profile.level);
}

/**
 * Load dashboard data for a child.
 * Single source of truth is the existing progress repository.
 */
export async function fetchParentDashboardData(
  childId?: string | null
): Promise<ParentDashboardData> {
  const familyState = await getFamilyState();
  const targetId = childId || familyState.activeChildId;

  const progress = await getProgress(targetId);
  const totalQuestions = progress.overall.totalQuestionsAnswered;
  const hasData = totalQuestions > 0;
  const overallAccuracy = getOverallAccuracy(progress);
  const levelInsights = getLevelInsights(progress);
  const strongestTopics = getStrongestTopics(progress);
  const practiceTopics = getPracticeTopics(progress);
  const recentActivity = getRecentActivity(progress);
  const learningInsights = getLearningInsights(progress);

  let learningSummary: LearningSummary | null = null;
  if (targetId && familyState.children[targetId]) {
    learningSummary = getLearningSummary(familyState.children[targetId], progress);
  }

  return {
    hasData,
    totalQuestionsAnswered: totalQuestions,
    totalCorrectAnswers: progress.overall.totalCorrectAnswers,
    overallAccuracy,
    levelInsights,
    strongestTopics,
    practiceTopics,
    recentActivity,
    learningInsights,
    learningSummary,
  };
}
