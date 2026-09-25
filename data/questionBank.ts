import { CurriculumLevel, Difficulty, SubjectId } from '../types/curriculum';
import { QuizQuestion, ToddlerActivityId } from '../types/quiz';

// Toddler Questions
import { COLOUR_QUESTIONS } from './toddler/colours';
import { SHAPE_QUESTIONS } from './toddler/shapes';
import { NUMBER_QUESTIONS } from './toddler/numbers';
import { MATCHING_QUESTIONS } from './toddler/matching';

// Class 1 Questions
import { CLASS1_NUMBER_QUESTIONS } from './class1/numbers';
import { CLASS1_ADDITION_QUESTIONS } from './class1/addition';
import { CLASS1_SUBTRACTION_QUESTIONS } from './class1/subtraction';
import { CLASS1_SHAPE_QUESTIONS } from './class1/shapes';
import { CLASS1_MEASUREMENT_QUESTIONS } from './class1/measurement';

// Class 2 Questions
import { CLASS2_NUMBER_QUESTIONS } from './class2/numbers';
import { CLASS2_ADDITION_QUESTIONS } from './class2/addition';
import { CLASS2_SUBTRACTION_QUESTIONS } from './class2/subtraction';
import { CLASS2_MULTIPLICATION_QUESTIONS } from './class2/multiplication';
import { CLASS2_DIVISION_QUESTIONS } from './class2/division';
import { CLASS2_TIME_QUESTIONS } from './class2/time';
import { CLASS2_SHAPES_QUESTIONS } from './class2/shapes';

// Class 3 Questions
import { CLASS3_NUMBERS_QUESTIONS } from './class3/numbers';
import { CLASS3_ADDITION_QUESTIONS } from './class3/addition';
import { CLASS3_SUBTRACTION_QUESTIONS } from './class3/subtraction';
import { CLASS3_MULTIPLICATION_QUESTIONS } from './class3/multiplication';
import { CLASS3_DIVISION_QUESTIONS } from './class3/division';
import { CLASS3_FRACTIONS_QUESTIONS } from './class3/fractions';
import { CLASS3_GEOMETRY_QUESTIONS } from './class3/geometry';
import { CLASS3_MEASUREMENT_QUESTIONS } from './class3/measurement';

// Class 4 Questions
import { CLASS4_NUMBERS_QUESTIONS } from './class4/numbers';
import { CLASS4_ADDITION_QUESTIONS } from './class4/addition';
import { CLASS4_SUBTRACTION_QUESTIONS } from './class4/subtraction';
import { CLASS4_MULTIPLICATION_QUESTIONS } from './class4/multiplication';
import { CLASS4_DIVISION_QUESTIONS } from './class4/division';
import { CLASS4_FRACTIONS_QUESTIONS } from './class4/fractions';
import { CLASS4_GEOMETRY_QUESTIONS } from './class4/geometry';
import { CLASS4_MEASUREMENT_QUESTIONS } from './class4/measurement';

/**
 * Central registry of all questions across the curriculum.
 */
export const ALL_QUESTIONS: QuizQuestion[] = [
  // Toddler (20)
  ...COLOUR_QUESTIONS,
  ...SHAPE_QUESTIONS,
  ...NUMBER_QUESTIONS,
  ...MATCHING_QUESTIONS,

  // Class 1 (35)
  ...CLASS1_NUMBER_QUESTIONS,
  ...CLASS1_ADDITION_QUESTIONS,
  ...CLASS1_SUBTRACTION_QUESTIONS,
  ...CLASS1_SHAPE_QUESTIONS,
  ...CLASS1_MEASUREMENT_QUESTIONS,

  // Class 2 (40)
  ...CLASS2_NUMBER_QUESTIONS,
  ...CLASS2_ADDITION_QUESTIONS,
  ...CLASS2_SUBTRACTION_QUESTIONS,
  ...CLASS2_MULTIPLICATION_QUESTIONS,
  ...CLASS2_DIVISION_QUESTIONS,
  ...CLASS2_TIME_QUESTIONS,
  ...CLASS2_SHAPES_QUESTIONS,

  // Class 3 (45)
  ...CLASS3_NUMBERS_QUESTIONS,
  ...CLASS3_ADDITION_QUESTIONS,
  ...CLASS3_SUBTRACTION_QUESTIONS,
  ...CLASS3_MULTIPLICATION_QUESTIONS,
  ...CLASS3_DIVISION_QUESTIONS,
  ...CLASS3_FRACTIONS_QUESTIONS,
  ...CLASS3_GEOMETRY_QUESTIONS,
  ...CLASS3_MEASUREMENT_QUESTIONS,

  // Class 4 (45)
  ...CLASS4_NUMBERS_QUESTIONS,
  ...CLASS4_ADDITION_QUESTIONS,
  ...CLASS4_SUBTRACTION_QUESTIONS,
  ...CLASS4_MULTIPLICATION_QUESTIONS,
  ...CLASS4_DIVISION_QUESTIONS,
  ...CLASS4_FRACTIONS_QUESTIONS,
  ...CLASS4_GEOMETRY_QUESTIONS,
  ...CLASS4_MEASUREMENT_QUESTIONS,
];

/**
 * Query questions for a specific curriculum level and topic ID.
 */
export function getQuestionsForTopic(
  level: CurriculumLevel,
  topicId: string,
  difficulty?: Difficulty
): QuizQuestion[] {
  return ALL_QUESTIONS.filter((q) => {
    if (q.level !== level) return false;
    if (q.topic !== topicId) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });
}

/**
 * Query questions for a specific Toddler activity.
 */
export function getQuestionsForActivity(
  activityId: ToddlerActivityId,
  difficulty?: Difficulty
): QuizQuestion[] {
  return ALL_QUESTIONS.filter((q) => {
    if (q.level !== 'toddler') return false;
    if (q.topic !== activityId && q.category !== activityId) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });
}

/**
 * Query all questions for a specific curriculum level.
 */
export function getQuestionsForLevel(level: CurriculumLevel): QuizQuestion[] {
  return ALL_QUESTIONS.filter((q) => q.level === level);
}

/**
 * Query questions for a specific level and subject.
 */
export function getQuestionsForSubject(
  level: CurriculumLevel,
  subject: SubjectId
): QuizQuestion[] {
  return ALL_QUESTIONS.filter((q) => q.level === level && q.subject === subject);
}

let configuredQuizCount: number = 5;

/**
 * Configure standard session question count (5 or 10).
 */
export function setConfiguredQuizCount(count: number): void {
  configuredQuizCount = count === 10 ? 10 : 5;
}

/**
 * Retrieve the current configured session question count.
 */
export function getConfiguredQuizCount(): number {
  return configuredQuizCount;
}

/**
 * Pick a pseudo-random slice of questions (defaults to configured session count).
 */
export function getRandomQuiz(
  questions: QuizQuestion[],
  count?: number
): QuizQuestion[] {
  const targetCount = count ?? configuredQuizCount;
  if (questions.length <= targetCount) {
    return [...questions];
  }
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, targetCount);
}

