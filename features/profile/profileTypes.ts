import { CurriculumLevel } from '../../types/curriculum';

export interface ChildProfile {
  name: string;
  level: CurriculumLevel;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPreferences {
  dailyQuestionGoal: 5 | 10 | 15 | 20;
  showAllLevels: boolean;
}

export interface ProfileState {
  child: ChildProfile | null;
  preferences: LearningPreferences;
}
