import { CurriculumLevel } from '../../types/curriculum';
import { getTopicsForLevel, getTopicConfig } from '../../data/curriculum';
import { getLevelById } from '../../constants/levels';
import { ProgressRecord, ProgressState } from '../progress/types';
import { getLevelProgress, getTopicAccuracy } from '../progress/progressUtils';
import { ChildRecord } from '../family/familyTypes';
import { DailyLearningRecommendation } from '../dailyLearning/dailyLearningTypes';
import { getDailyRecommendation } from '../dailyLearning/dailyLearningUtils';
import {
  LearningInsight,
  LevelInsight,
  TopicInsight,
  TopicStatus,
  MasteryLevel,
  AdaptivePracticeGuidance,
  LearningSummary,
} from './insightTypes';

const ALL_LEVELS: CurriculumLevel[] = [
  'toddler',
  'class-1',
  'class-2',
  'class-3',
  'class-4',
];

/**
 * Pure deterministic function to calculate topic mastery.
 * Does NOT mutate the progress record.
 * Handles boundary conditions (null, zero questions, etc.) safely without divide-by-zero.
 */
export function getTopicMastery(record?: ProgressRecord | null): MasteryLevel {
  if (!record || !record.questionsAnswered || record.questionsAnswered === 0 || record.attempts === 0) {
    return 'emerging';
  }

  const accuracy = Math.round((record.correctAnswers / record.questionsAnswered) * 100);

  // Substantial practice history and strong accuracy
  if ((record.questionsAnswered >= 15 || record.attempts >= 3) && accuracy >= 80) {
    return 'well-practiced';
  }

  // Consistent practice and solid accuracy
  if (record.questionsAnswered >= 5 && accuracy >= 70) {
    return 'comfortable';
  }

  // Practiced, but still building consistency
  return 'developing';
}

/**
 * Retrieve comprehensive topic insights for a specific level or all levels.
 */
export function getTopicInsights(
  progress: ProgressState,
  childId?: string,
  targetLevel?: CurriculumLevel
): TopicInsight[] {
  const insights: TopicInsight[] = [];
  const levels = targetLevel ? [targetLevel] : ALL_LEVELS;

  for (const level of levels) {
    const topics = getTopicsForLevel(level);
    for (const topic of topics) {
      // Check both level:topic and bare topic key
      const key = `${level}:${topic.id}`;
      const record = progress.topics?.[key] || progress.topics?.[topic.id];

      const attempts = record?.attempts || 0;
      const questionsAnswered = record?.questionsAnswered || 0;
      const accuracy = getTopicAccuracy(record);
      const bestScore = record?.bestScore || 0;
      const bestTotal = record?.bestTotal || 0;
      const lastScore = record?.lastScore || 0;
      const lastTotal = record?.lastTotal || 0;
      const lastPlayedAt = record?.lastPlayedAt;

      const status: TopicStatus = attempts >= 1 ? 'completed' : 'not-started';
      const mastery = getTopicMastery(record);

      insights.push({
        childId,
        topicId: topic.id,
        topic: topic.id,
        title: topic.title,
        level,
        attempts,
        questionsAnswered,
        accuracy,
        bestScore,
        bestTotal,
        lastScore,
        lastTotal,
        lastPlayedAt,
        mastery,
        status,
      });
    }
  }

  return insights;
}

/**
 * Retrieve aggregated level-by-level insights.
 */
export function getLevelInsights(progress: ProgressState): LevelInsight[] {
  return ALL_LEVELS.map((level) => {
    const levelConfig = getLevelById(level);
    const summary = getLevelProgress(progress, level);

    return {
      level,
      title: levelConfig?.title ?? level,
      totalTopics: summary.totalTopics,
      startedTopics: summary.startedTopics,
      completedTopics: summary.completedTopics,
      questionsAnswered: summary.questionsAnswered,
      accuracy: summary.accuracy,
    };
  });
}

/**
 * Retrieve topics demonstrating strong progress.
 */
export function getStrongestTopics(progress: ProgressState): TopicInsight[] {
  const topics = getTopicInsights(progress);
  const strong = topics.filter((t) => t.questionsAnswered >= 5 && t.accuracy >= 80);

  strong.sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.questionsAnswered - a.questionsAnswered;
  });

  return strong.slice(0, 3);
}

/**
 * Retrieve suggested practice topics.
 */
export function getPracticeTopics(progress: ProgressState): TopicInsight[] {
  const topics = getTopicInsights(progress);
  const practice = topics.filter((t) => t.questionsAnswered >= 5 && t.accuracy < 70);

  practice.sort((a, b) => {
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    return b.attempts - a.attempts;
  });

  return practice.slice(0, 3);
}

/**
 * Retrieve up to 5 most recently practiced topics.
 */
export function getRecentActivity(progress: ProgressState): TopicInsight[] {
  const topics = getTopicInsights(progress);
  const played = topics.filter(
    (t): t is TopicInsight & { lastPlayedAt: string } => t.attempts >= 1 && !!t.lastPlayedAt
  );

  played.sort((a, b) => {
    const timeA = new Date(a.lastPlayedAt).getTime() || 0;
    const timeB = new Date(b.lastPlayedAt).getTime() || 0;
    return timeB - timeA;
  });

  return played.slice(0, 5);
}

/**
 * Generate prioritized learning insights.
 * Supports both Phase 7/10 signature: getLearningInsights(progress)
 * and Phase 15 signature: getLearningInsights(childId, progress, quizAttempts, level)
 */
export function getLearningInsights(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any
): LearningInsight[] {
  let progress: ProgressState;
  let level: CurriculumLevel | undefined;

  if (arg1 && typeof arg1 === 'object' && 'topics' in arg1) {
    // Old signature: getLearningInsights(progress)
    progress = arg1 as ProgressState;
    level = arg2 as CurriculumLevel | undefined;
  } else {
    // New signature: getLearningInsights(childId, progress, quizAttempts, level)
    progress = arg2 as ProgressState;
    level = arg4 as CurriculumLevel | undefined;
  }

  if (!progress || !progress.topics) {
    return [];
  }

  const insights: LearningInsight[] = [];
  const isToddler = level === 'toddler';
  const topicInsights = getTopicInsights(progress, undefined, level);

  // 1. Recently Practiced
  const recentTopics = topicInsights
    .filter((t) => t.attempts >= 1 && t.lastPlayedAt)
    .sort((a, b) => {
      const timeA = new Date(a.lastPlayedAt!).getTime() || 0;
      const timeB = new Date(b.lastPlayedAt!).getTime() || 0;
      return timeB - timeA;
    });

  if (recentTopics.length > 0) {
    const topRecent = recentTopics[0];
    insights.push({
      type: 'recently_practiced',
      category: 'Recent Activity',
      title: 'Recently Practiced',
      description: isToddler
        ? `${topRecent.title} has been explored recently.`
        : `You've been practicing ${topRecent.title} recently.`,
      topicId: topRecent.topicId,
      topic: topRecent.topicId,
      topicTitle: topRecent.title,
      level: topRecent.level,
      accuracy: topRecent.accuracy,
    });
  }

  // 2. Building Confidence (developing)
  const confidenceTopics = topicInsights.filter((t) => t.mastery === 'developing');
  if (confidenceTopics.length > 0 && !isToddler) {
    const target = confidenceTopics[0];
    insights.push({
      type: 'building_confidence',
      category: 'Practice Opportunity',
      title: 'Building Confidence',
      description: `${target.title} is getting more practice. A few more questions may help build confidence.`,
      topicId: target.topicId,
      topic: target.topicId,
      topicTitle: target.title,
      level: target.level,
      accuracy: target.accuracy,
    });
  }

  // 3. Comfortable or Well-Practiced
  const comfortableTopics = topicInsights.filter(
    (t) => t.mastery === 'comfortable' || t.mastery === 'well-practiced'
  );
  if (comfortableTopics.length > 0) {
    const target = comfortableTopics[0];
    insights.push({
      type: 'comfortable',
      category: 'Comfortable Learning',
      title: 'Comfortable',
      description: isToddler
        ? `${target.title} looks familiar and comfortable.`
        : `${target.title} looks comfortable based on recent practice.`,
      topicId: target.topicId,
      topic: target.topicId,
      topicTitle: target.title,
      level: target.level,
      accuracy: target.accuracy,
    });
  }

  // 4. Ready to Explore (unstarted)
  const unstartedTopics = topicInsights.filter((t) => t.attempts === 0);
  if (unstartedTopics.length > 0) {
    const target = unstartedTopics[0];
    insights.push({
      type: 'ready_to_explore',
      category: 'New Discovery',
      title: 'Ready to Explore',
      description: isToddler
        ? `${target.title} is ready to explore.`
        : `You haven't explored ${target.title} yet.`,
      topicId: target.topicId,
      topic: target.topicId,
      topicTitle: target.title,
      level: target.level,
    });
  }

  // 5. Return to Practice (practiced long ago)
  const oldPracticed = topicInsights.filter((t) => {
    if (t.attempts < 1 || !t.lastPlayedAt) return false;
    const diffDays = (Date.now() - new Date(t.lastPlayedAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  });
  if (oldPracticed.length > 0 && !isToddler) {
    const target = oldPracticed[0];
    insights.push({
      type: 'return_to_practice',
      category: 'Revisit',
      title: 'Return to Practice',
      description: `${target.title} hasn't been practiced recently. You can revisit it whenever you're ready.`,
      topicId: target.topicId,
      topic: target.topicId,
      topicTitle: target.title,
      level: target.level,
    });
  }

  // Backwards compatibility for Phase 7/10:
  // If caller used getLearningInsights(progress) and there are practice topics
  const legacyPractice = getPracticeTopics(progress);
  for (const p of legacyPractice) {
    if (!insights.some((i) => i.topicId === p.topicId && i.type === 'practice')) {
      insights.push({
        type: 'practice',
        title: 'Suggested Practice',
        description: `Practice a few more questions in ${p.title} to build confidence.`,
        level: p.level,
        topic: p.topic,
        topicId: p.topicId,
        topicTitle: p.title,
        accuracy: p.accuracy,
      });
    }
  }

  return insights;
}

/**
 * Contextual adaptive practice guidance based on the Phase 12 recommendation.
 */
export function getAdaptivePracticeGuidance(params: {
  childRecord: ChildRecord;
  progress: ProgressState;
  dailyRecommendation?: DailyLearningRecommendation | null;
}): AdaptivePracticeGuidance {
  const { childRecord, progress } = params;
  const childId = childRecord.profile.id;
  const level = childRecord.profile.level;

  const recommendation =
    params.dailyRecommendation ??
    getDailyRecommendation({
      childRecord,
      progress,
    });

  const topicConfig = getTopicConfig(level, recommendation.topicId);
  const topicTitle = topicConfig?.title || recommendation.title.replace(/^(Practice|Continue|Try|Review)\s+/, '');

  // Look up topic progress
  const key = `${level}:${recommendation.topicId}`;
  const record = progress.topics?.[key] || progress.topics?.[recommendation.topicId];
  const mastery = getTopicMastery(record);

  let adaptiveMessage = '';
  switch (recommendation.reason) {
    case 'practice':
      adaptiveMessage = `${topicTitle} has been practiced before. A few more questions could help build confidence.`;
      break;
    case 'continue':
      adaptiveMessage = `You've been practicing ${topicTitle} recently. Continuing helps solidify understanding.`;
      break;
    case 'new':
      adaptiveMessage = `${topicTitle} hasn't been explored yet. Choose it whenever you're ready.`;
      break;
    case 'review':
      adaptiveMessage = `${topicTitle} looks comfortable. A gentle review can keep ideas fresh.`;
      break;
    case 'none':
    default:
      adaptiveMessage = level === 'toddler'
        ? 'Choose an activity below to explore with colours, shapes, and numbers.'
        : 'Choose any topic below to begin learning.';
      break;
  }

  return {
    childId,
    topicId: recommendation.topicId,
    title: topicTitle,
    level,
    recommendationTitle: recommendation.title,
    recommendationReason: recommendation.reason,
    adaptiveMessage,
    actionLabel: recommendation.actionLabel,
    actionRoute: recommendation.actionRoute,
    mastery,
  };
}

/**
 * Computes a calm, high-level learning summary for a child.
 */
export function getLearningSummary(
  childRecord: ChildRecord,
  progress: ProgressState
): LearningSummary {
  const childId = childRecord.profile.id;
  const childName = childRecord.profile.name;
  const level = childRecord.profile.level;

  const topicInsights = getTopicInsights(progress, childId, level);
  const totalTopicsInLevel = topicInsights.length;
  const topicsExplored = topicInsights.filter((t) => t.attempts >= 1).length;

  const questionsAnswered = progress.overall?.totalQuestionsAnswered || 0;
  const quizAttempts = progress.overall?.quizzesCompleted || 0;

  // Recently Practiced
  const recentlyPracticed = topicInsights
    .filter((t) => t.attempts >= 1 && t.lastPlayedAt)
    .sort((a, b) => {
      const timeA = new Date(a.lastPlayedAt!).getTime() || 0;
      const timeB = new Date(b.lastPlayedAt!).getTime() || 0;
      return timeB - timeA;
    })
    .map((t) => ({ topicId: t.topicId, title: t.title }));

  // Building Confidence (developing)
  const buildingConfidence = topicInsights
    .filter((t) => t.mastery === 'developing')
    .map((t) => ({ topicId: t.topicId, title: t.title }));

  // Comfortable (comfortable or well-practiced)
  const comfortable = topicInsights
    .filter((t) => t.mastery === 'comfortable' || t.mastery === 'well-practiced')
    .map((t) => ({ topicId: t.topicId, title: t.title }));

  // Not Yet Explored (emerging and attempts === 0)
  const notYetExplored = topicInsights
    .filter((t) => t.attempts === 0)
    .map((t) => ({ topicId: t.topicId, title: t.title }));

  const insights = getLearningInsights(childId, progress, null, level);
  const adaptiveGuidance = getAdaptivePracticeGuidance({ childRecord, progress });

  return {
    childId,
    childName,
    level,
    topicsExplored,
    totalTopicsInLevel,
    questionsAnswered,
    quizAttempts,
    recentlyPracticed,
    buildingConfidence,
    comfortable,
    notYetExplored,
    insights,
    adaptiveGuidance,
  };
}
