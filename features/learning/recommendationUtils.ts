import { getTodayQuestionsAnswered } from "../profile/profileUtils";
import { getSettings } from "../settings/settingsStorage";
import { getFamilyState } from "../family/familyStorage";
import { planStorageAdapter } from "../plans/planStorage";
import { getProgress } from "../progress/progressStorage";
/**
 * Tutr Kidz - Deterministic Recommendation Engine (Phase 22)
 *
 * Answers two simple questions without AI/LLM:
 * 1. For the child: "What should I explore next?"
 * 2. For the parent: "What has my child been exploring, and what might be useful to revisit?"
 *
 * Deterministic, offline-first, child-led, calm, non-gamified.
 */

import { CurriculumLevel } from "../../types/curriculum";
import { ProgressRecord, ProgressState } from "../progress/types";
import { getTopicsForLevel, getTopicConfig } from "../../data/curriculum";
import { getNextExplorationTopic } from "../curriculum/contentTypes";
import {
  LearningRecommendation,
  RecommendationParams,
  TopicFamiliarity,
  TopicFamiliaritySummary,
} from "./recommendationTypes";

/**
 * Calculates calendar days elapsed between referenceDate and lastPlayedAt.
 */
export function getDaysSincePractice(
  lastPlayedAt?: string | null,
  referenceDate?: Date
): number | null {
  if (!lastPlayedAt || typeof lastPlayedAt !== "string") return null;

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
 * Deterministic Topic Familiarity:
 * - not-explored: 0 attempts
 * - explored: 1+ attempts, < 15 questions, practiced within 5 days
 * - familiar: >= 15 questions answered, practiced within 5 days
 * - revisit-suggested: attempted previously, but >= 5 days since last practice
 */
export function getTopicFamiliarity(
  record?: ProgressRecord | null,
  referenceDate?: Date
): TopicFamiliarity {
  if (!record || record.attempts <= 0) {
    return "not-explored";
  }

  const days = getDaysSincePractice(record.lastPlayedAt, referenceDate);
  if (days !== null && days >= 5) {
    return "revisit-suggested";
  }

  if (record.questionsAnswered >= 15) {
    return "familiar";
  }

  return "explored";
}

/**
 * Compute familiarity summaries for all topics in a level.
 */
export function getTopicFamiliaritySummaries(
  level: CurriculumLevel,
  progress?: ProgressState | null,
  referenceDate?: Date
): TopicFamiliaritySummary[] {
  const topics = getTopicsForLevel(level);
  const result: TopicFamiliaritySummary[] = [];

  for (const t of topics) {
    const key = level + ":" + t.id;
    const record = progress?.topics?.[t.id] || progress?.topics?.[key];
    const familiarity = getTopicFamiliarity(record, referenceDate);
    const daysSince = record?.lastPlayedAt
      ? getDaysSincePractice(record.lastPlayedAt, referenceDate)
      : null;

    result.push({
      topicId: t.id,
      level,
      title: t.title,
      familiarity,
      attempts: record?.attempts ?? 0,
      questionsAnswered: record?.questionsAnswered ?? 0,
      lastPlayedAt: record?.lastPlayedAt,
      daysSinceLastPlayed: daysSince,
    });
  }

  return result;
}

/**
 * Retrieve topics recommended to revisit (familiar or explored with a gap).
 */
export function getTopicsToRevisit(
  level: CurriculumLevel,
  progress?: ProgressState | null,
  referenceDate?: Date
): TopicFamiliaritySummary[] {
  const summaries = getTopicFamiliaritySummaries(level, progress, referenceDate);
  return summaries.filter((s) => s.familiarity === "revisit-suggested");
}

/**
 * Retrieve topics currently being actively explored.
 */
export function getTopicsExploringNow(
  level: CurriculumLevel,
  progress?: ProgressState | null,
  referenceDate?: Date
): TopicFamiliaritySummary[] {
  const summaries = getTopicFamiliaritySummaries(level, progress, referenceDate);
  return summaries.filter(
    (s) => s.familiarity === "explored" || s.familiarity === "familiar"
  );
}

/**
 * Core Deterministic Recommendation Engine.
 * Produces at most ONE calm, age-appropriate next-action recommendation.
 */
export function getLearningRecommendation(
  params: RecommendationParams
): LearningRecommendation {
  const childId = params.childRecord.profile.id;
  const childName = params.childRecord.profile.name;
  const level = params.childRecord.profile.level;
  const isToddler = level === "toddler";

  const summaries = getTopicFamiliaritySummaries(level, params.progress, params.referenceDate);
  const levelTopics = getTopicsForLevel(level);
  const defaultTopic = levelTopics[0] || { id: "numbers", title: "Numbers" };

  // --- Toddler Path (Qualitative, Zero Scores/Rankings) ---
  if (isToddler) {
    const totalAnswered = params.progress?.overall?.totalQuestionsAnswered ?? 0;
    if (totalAnswered === 0) {
      return {
        childId,
        childName,
        level,
        topicId: "colours",
        title: "Ready to explore Colours?",
        description: "Simple visual exploration for curious young minds.",
        reason: "start-learning",
        actionLabel: "Explore",
        actionRoute: "/quiz/toddler?activity=colours",
        isToddler: true,
      };
    }

    // Look for unattempted toddler activity
    const unattempted = summaries.find((s) => s.familiarity === "not-explored");
    if (unattempted) {
      return {
        childId,
        childName,
        level,
        topicId: unattempted.topicId,
        title: "Explore " + unattempted.title + " next",
        description: "Discover new shapes, colours, and items together.",
        reason: "explore-new",
        actionLabel: "Explore",
        actionRoute: "/quiz/toddler?activity=" + unattempted.topicId,
        isToddler: true,
      };
    }

    // Re-explore most recently practiced
    const sortedByRecent = [...summaries].sort(
      (a, b) => (b.daysSinceLastPlayed ?? 999) - (a.daysSinceLastPlayed ?? 999)
    );
    const recent = sortedByRecent[0] || summaries[0];
    return {
      childId,
      childName,
      level,
      topicId: recent.topicId,
      title: "Continue exploring " + recent.title,
      description: recent.title + " has been explored recently.",
      reason: "continue-exploring",
      actionLabel: "Explore",
      actionRoute: "/quiz/toddler?activity=" + recent.topicId,
      isToddler: true,
    };
  }

  // --- Classes 1 to 4 Path ---

  // 1. Check Parent Plan Intention (if enabled with selected topics)
  if (params.plan && params.plan.enabled && params.plan.selectedTopics.length > 0) {
    const planTopicId = params.plan.selectedTopics.find((tId) => {
      const summary = summaries.find((s) => s.topicId === tId);
      return summary && summary.familiarity !== "familiar";
    });

    if (planTopicId) {
      const cfg = getTopicConfig(level, planTopicId);
      const title = cfg?.title || planTopicId;
      return {
        childId,
        childName,
        level,
        topicId: planTopicId,
        title: "Continue exploring " + title,
        description: "Aligned with your family's gentle learning intention.",
        reason: "parent-plan",
        actionLabel: "Explore",
        actionRoute: "/quiz/" + level + "?topic=" + planTopicId,
        isToddler: false,
      };
    }
  }

  // 2. Revisit Suggested (familiar or practiced before, but quiet for >= 5 days)
  const revisitTopic = summaries.find((s) => s.familiarity === "revisit-suggested");
  if (revisitTopic) {
    return {
      childId,
      childName,
      level,
      topicId: revisitTopic.topicId,
      title: "Revisit " + revisitTopic.title,
      description: "A gentle revisit helps keep ideas fresh and natural.",
      reason: "revisit",
      actionLabel: "Revisit",
      actionRoute: "/quiz/" + level + "?topic=" + revisitTopic.topicId,
      isToddler: false,
    };
  }

  // 3. Continue Partially Explored (< 15 questions)
  const exploringTopic = summaries.find((s) => s.familiarity === "explored");
  if (exploringTopic) {
    return {
      childId,
      childName,
      level,
      topicId: exploringTopic.topicId,
      title: "Continue exploring " + exploringTopic.title,
      description: "Explore a few more questions at your own natural pace.",
      reason: "continue-exploring",
      actionLabel: "Explore",
      actionRoute: "/quiz/" + level + "?topic=" + exploringTopic.topicId,
      isToddler: false,
    };
  }

  // 4. Natural Next Topic in Sequence (via pedagogical chain)
  const mostRecentPlayed = summaries
    .filter((s) => s.lastPlayedAt)
    .sort(
      (a, b) =>
        new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime()
    )[0];

  if (mostRecentPlayed) {
    const nextTId = getNextExplorationTopic(level, mostRecentPlayed.topicId);
    if (nextTId) {
      const nextCfg = getTopicConfig(level, nextTId);
      if (nextCfg) {
        return {
          childId,
          childName,
          level,
          topicId: nextTId,
          title: "Try " + nextCfg.title + " next",
          description: "A natural next step after exploring " + mostRecentPlayed.title + ".",
          reason: "next-in-sequence",
          actionLabel: "Try Next",
          actionRoute: "/quiz/" + level + "?topic=" + nextTId,
          isToddler: false,
        };
      }
    }
  }

  // 5. Unexplored Topic
  const unexplored = summaries.find((s) => s.familiarity === "not-explored");
  if (unexplored) {
    return {
      childId,
      childName,
      level,
      topicId: unexplored.topicId,
      title: "Ready to explore " + unexplored.title,
      description: "Discover new concepts at your own comfortable pace.",
      reason: "explore-new",
      actionLabel: "Explore",
      actionRoute: "/quiz/" + level + "?topic=" + unexplored.topicId,
      isToddler: false,
    };
  }

  // Fallback (All topics familiar)
  return {
    childId,
    childName,
    level,
    topicId: defaultTopic.id,
    title: "Continue exploring " + defaultTopic.title,
    description: "Keep learning and discovering whenever you're ready.",
    reason: "continue-exploring",
    actionLabel: "Explore",
    actionRoute: "/quiz/" + level + "?topic=" + defaultTopic.id,
    isToddler: false,
  };
}

/**
 * Asynchronously loads child progress and learning plan to derive the recommendation.
 * Purely derived state; no secondary store.
 */
export async function fetchLearningRecommendation(
  childId?: string | null,
  referenceDate?: Date
): Promise<LearningRecommendation | null> {
  const familyState = await getFamilyState();
  const targetId = childId || familyState.activeChildId;
  if (!targetId || !familyState.children[targetId]) {
    return null;
  }
  const childRecord = familyState.children[targetId];
  const [progress, plan, settings] = await Promise.all([
    getProgress(targetId),
    planStorageAdapter.getPlan(targetId),
    getSettings(),
  ]);
  const rec = getLearningRecommendation({
    childRecord,
    progress,
    plan,
    referenceDate,
  });

  if (rec) {
    const answeredToday = progress ? getTodayQuestionsAnswered(progress) : 0;
    const goal = childRecord.preferences?.dailyQuestionGoal ?? 5;
    const isGoalEnabled = settings?.dailyQuestionGoalEnabled ?? true;
    rec.questionsAnsweredToday = answeredToday;
    rec.dailyQuestionGoal = goal;
    rec.isGoalEnabled = isGoalEnabled;
    rec.remainingQuestions = Math.max(0, goal - answeredToday);
    rec.isGoalReached = isGoalEnabled && answeredToday >= goal;
  }

  return rec;
}
