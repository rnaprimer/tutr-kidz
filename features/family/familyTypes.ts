import { CurriculumLevel } from '../../types/curriculum';

export type ChildId = string;

export interface ChildProfile {
  id: ChildId;
  name: string;
  level: CurriculumLevel;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPreferences {
  dailyQuestionGoal: 5 | 10 | 15 | 20;
  showAllLevels: boolean;
}

export interface ChildRecord {
  profile: ChildProfile;
  preferences: LearningPreferences;
}

export interface FamilyState {
  children: Record<ChildId, ChildRecord>;
  activeChildId: ChildId | null;
}
