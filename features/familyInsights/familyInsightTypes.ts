import { CurriculumLevel } from '../../types/curriculum';
import { ChildId } from '../family/familyTypes';
import { TopicInsight } from '../insights/insightTypes';

export interface FamilyChildSummary {
  childId: ChildId;
  name: string;
  level: CurriculumLevel;
  questionsAnswered: number;
  quizzesCompleted: number;
  accuracy: number;
  topicsStarted: number;
  lastPlayedAt?: string;
  strongestTopics: TopicInsight[];
  practiceTopics: TopicInsight[];
  recentActivity: TopicInsight[];
}

export interface FamilySummary {
  childCount: number;
  totalQuestionsAnswered: number;
  totalQuizzesCompleted: number;
  activeChildrenCount: number;
  lastActivityAt?: string;
}

export interface FamilyActivity {
  childId: ChildId;
  childName: string;
  level: CurriculumLevel;
  topic: string;
  score: number;
  total: number;
  lastPlayedAt: string;
}

export interface FamilyDashboardData {
  summary: FamilySummary;
  childSummaries: FamilyChildSummary[];
  recentActivity: FamilyActivity[];
  activeChildren: FamilyChildSummary[];
  hasChildren: boolean;
}
