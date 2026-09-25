import { CurriculumLevel, SubjectId, Difficulty, TopicId } from './curriculum';

export type QuizShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'rectangle';

export type QuizVisual =
  | {
      type: 'color';
      value: string; // e.g. '#EF4444', '#3B82F6', etc.
    }
  | {
      type: 'shape';
      value: QuizShapeType;
      color?: string;
    }
  | {
      type: 'emoji';
      value: string;
    }
  | {
      type: 'objects';
      item: string; // e.g. '🍎', '⭐', '🔵'
      count: number; // e.g. 3
    };

export interface QuizOption {
  id: string;
  label: string;
  accessibilityLabel?: string;
  visual?: QuizVisual;
}

export interface QuizQuestion {
  id: string;
  level: CurriculumLevel;
  subject: SubjectId;
  topic: TopicId | string;
  difficulty: Difficulty;
  type: 'multiple_choice';
  category?: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  visual?: QuizVisual;
  explanation?: string;
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
}

export interface QuizState {
  currentIndex: number;
  selectedOptionId: string | null;
  isAnswered: boolean;
  isCorrect: boolean | null;
  score: number;
  isCompleted: boolean;
}

export type OptionVisualState = 'default' | 'correct' | 'incorrect' | 'neutral-locked';

export type ToddlerActivityId = 'colours' | 'shapes' | 'numbers' | 'matching';
