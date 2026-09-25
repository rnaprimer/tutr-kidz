import { CurriculumLevel } from '../../types/curriculum';
import { ChildId } from '../family/familyTypes';

export type RecommendationReason =
  | 'continue'
  | 'practice'
  | 'new'
  | 'review'
  | 'none';

export interface DailyLearningRecommendation {
  childId: ChildId;
  childName: string;
  level: CurriculumLevel;
  topicId: string;
  title: string;
  description: string;
  reason: RecommendationReason;
  actionLabel: string;
  actionRoute: string;
  questionsAnsweredToday: number;
  dailyQuestionGoal: number;
  remainingQuestions: number;
  isGoalEnabled: boolean;
  isGoalReached: boolean;
}
