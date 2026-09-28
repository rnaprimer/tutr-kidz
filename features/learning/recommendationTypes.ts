/**
 * Tutr Kidz - Learning Recommendation Types (Phase 22)
 *
 * Deterministic types for learning recommendations and topic familiarity.
 * Strictly non-gamified: zero scores, rankings, or performance pressure.
 */

import { CurriculumLevel } from "../../types/curriculum";

export type TopicFamiliarity =
  | "not-explored"
  | "explored"
  | "familiar"
  | "revisit-suggested";

export interface TopicFamiliaritySummary {
  topicId: string;
  level: CurriculumLevel;
  title: string;
  familiarity: TopicFamiliarity;
  attempts: number;
  questionsAnswered: number;
  lastPlayedAt?: string;
  daysSinceLastPlayed?: number | null;
}

export type LearningRecommendationReason =
  | "start-learning"
  | "parent-plan"
  | "continue-exploring"
  | "revisit"
  | "next-in-sequence"
  | "explore-new";

export interface LearningRecommendation {
  childId: string;
  childName: string;
  level: CurriculumLevel;
  topicId: string;
  title: string;
  description: string;
  reason: LearningRecommendationReason;
  actionLabel: string;
  actionRoute: string;
  isToddler: boolean;
  questionsAnsweredToday?: number;
  dailyQuestionGoal?: number;
  isGoalEnabled?: boolean;
  remainingQuestions?: number;
  isGoalReached?: boolean;
}

export interface RecommendationParams {
  childRecord: {
    profile: {
      id: string;
      name: string;
      level: CurriculumLevel;
    };
    preferences?: {
      dailyQuestionGoal?: number;
      showAllLevels?: boolean;
    };
  };
  progress?: import("../progress/types").ProgressState | null;
  plan?: import("../plans/planTypes").LearningPlan | null;
  referenceDate?: Date;
}
