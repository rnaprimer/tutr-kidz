import { getFamilyState } from '../family/familyRepository';
import { getProgress } from '../progress/progressRepository';
import { getOverallAccuracy } from '../progress/progressUtils';
import { CurriculumLevel } from '../../types/curriculum';
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
import {
  LearningContinuity,
  TopicHistoryItem,
} from './continuityTypes';
import {
  getLearningContinuity,
  getTopicHistory,
} from './continuityUtils';

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
  continuity?: LearningContinuity;
  topicHistory?: TopicHistoryItem[];
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
 * Fetch learning continuity metrics for a specific child (Phase 18).
 */
export async function fetchChildLearningContinuity(
  childId?: string | null
): Promise<LearningContinuity> {
  const familyState = await getFamilyState();
  const targetId = childId || familyState.activeChildId;
  const childLevel: CurriculumLevel = targetId && familyState.children[targetId]
    ? familyState.children[targetId].profile.level
    : 'class-1';

  const progress = await getProgress(targetId);
  return getLearningContinuity(progress, childLevel);
}

/**
 * Fetch topic history for a specific child (Phase 18).
 */
export async function fetchChildTopicHistory(
  childId?: string | null,
  levelOverride?: CurriculumLevel
): Promise<TopicHistoryItem[]> {
  const familyState = await getFamilyState();
  const targetId = childId || familyState.activeChildId;
  const childLevel: CurriculumLevel = levelOverride || (targetId && familyState.children[targetId]
    ? familyState.children[targetId].profile.level
    : 'class-1');

  const progress = await getProgress(targetId);
  return getTopicHistory(progress, childLevel);
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
  const childLevel: CurriculumLevel = targetId && familyState.children[targetId]
    ? familyState.children[targetId].profile.level
    : 'class-1';

  if (targetId && familyState.children[targetId]) {
    learningSummary = getLearningSummary(familyState.children[targetId], progress);
  }

  const continuity = getLearningContinuity(progress, childLevel);
  const topicHistory = getTopicHistory(progress, childLevel);

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
    continuity,
    topicHistory,
  };
}
