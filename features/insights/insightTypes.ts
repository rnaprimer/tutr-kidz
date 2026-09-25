import { CurriculumLevel } from '../../types/curriculum';

export type TopicStatus = 'not-started' | 'in-progress' | 'completed';

export type MasteryLevel = 'emerging' | 'developing' | 'comfortable' | 'well-practiced';

export interface TopicInsight {
  childId?: string;
  topicId: string;
  topic?: string; // backwards compatibility alias for topicId
  title: string;
  level: CurriculumLevel;
  attempts: number;
  questionsAnswered: number;
  accuracy: number;
  bestScore: number;
  bestTotal: number;
  lastScore: number;
  lastTotal: number;
  lastPlayedAt?: string;
  mastery: MasteryLevel;
  status: TopicStatus;
}

export interface LevelInsight {
  level: CurriculumLevel;
  title: string;
  totalTopics: number;
  startedTopics: number;
  completedTopics: number;
  questionsAnswered: number;
  accuracy: number;
}

export type LearningInsightType =
  | 'recently_practiced'
  | 'building_confidence'
  | 'comfortable'
  | 'ready_to_explore'
  | 'return_to_practice'
  | 'practice'
  | 'progress'
  | 'strength'
  | 'activity';

export interface LearningInsight {
  type: LearningInsightType;
  category?: string;
  title: string;
  description: string;
  topicId?: string;
  topic?: string;
  topicTitle?: string;
  level?: CurriculumLevel;
  accuracy?: number;
}

export interface AdaptivePracticeGuidance {
  childId: string;
  topicId: string;
  title: string;
  level: CurriculumLevel;
  recommendationTitle: string;
  recommendationReason: string;
  adaptiveMessage: string;
  actionLabel: string;
  actionRoute: string;
  mastery: MasteryLevel;
}

export interface LearningSummary {
  childId: string;
  childName: string;
  level: CurriculumLevel;
  topicsExplored: number;
  totalTopicsInLevel: number;
  questionsAnswered: number;
  quizAttempts: number;
  recentlyPracticed: Array<{ topicId: string; title: string }>;
  buildingConfidence: Array<{ topicId: string; title: string }>;
  comfortable: Array<{ topicId: string; title: string }>;
  notYetExplored: Array<{ topicId: string; title: string }>;
  insights: LearningInsight[];
  adaptiveGuidance?: AdaptivePracticeGuidance | null;
}
