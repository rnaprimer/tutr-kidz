import { CurriculumLevel } from '../../types/curriculum';

export interface ProgressRecord {
  level: CurriculumLevel;
  topic: string;
  attempts: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  bestScore: number;
  bestTotal: number;
  lastScore: number;
  lastTotal: number;
  lastPlayedAt: string;
}

export interface OverallProgress {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  quizzesCompleted: number;
  lastPlayedAt?: string;
}

export interface ProgressState {
  topics: Record<string, ProgressRecord>;
  overall: OverallProgress;
}

export interface RecordQuizParams {
  level: CurriculumLevel;
  topic: string;
  score: number;
  total: number;
}
