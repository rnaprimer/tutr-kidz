import { ALL_QUESTIONS } from '../../data/questionBank';
import { QuizQuestion } from '../../types/quiz';

export interface ValidationResult {
  totalQuestions: number;
  isValid: boolean;
  errors: string[];
  countsByLevel: Record<string, number>;
  countsByTopic: Record<string, number>;
}

export function validateQuestionBank(questions: QuizQuestion[] = ALL_QUESTIONS): ValidationResult {
  const errors: string[] = [];
  const questionIds = new Set<string>();
  const optionIds = new Set<string>();
  const countsByLevel: Record<string, number> = {};
  const countsByTopic: Record<string, number> = {};

  for (const q of questions) {
    // Check level count
    countsByLevel[q.level] = (countsByLevel[q.level] || 0) + 1;
    const topicKey = `${q.level}:${q.topic}`;
    countsByTopic[topicKey] = (countsByTopic[topicKey] || 0) + 1;

    // Check Question ID uniqueness
    if (questionIds.has(q.id)) {
      errors.push(`Duplicate question ID found: ${q.id}`);
    } else {
      questionIds.add(q.id);
    }

    // Check level, subject, topic, difficulty
    if (!q.level) errors.push(`Question ${q.id} missing level`);
    if (!q.subject) errors.push(`Question ${q.id} missing subject`);
    if (!q.topic) errors.push(`Question ${q.id} missing topic`);
    if (!q.difficulty) errors.push(`Question ${q.id} missing difficulty`);

    // Check options count
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`Question ${q.id} must have exactly 4 options, found ${q.options?.length}`);
    }

    // Check options uniqueness and correctOptionId validity
    let foundCorrect = false;
    if (Array.isArray(q.options)) {
      for (const opt of q.options) {
        if (optionIds.has(opt.id)) {
          errors.push(`Duplicate option ID found: ${opt.id} in question ${q.id}`);
        } else {
          optionIds.add(opt.id);
        }
        if (opt.id === q.correctOptionId) {
          foundCorrect = true;
        }
      }
    }

    if (!foundCorrect) {
      errors.push(`Question ${q.id} has invalid correctOptionId: "${q.correctOptionId}" not found in options`);
    }
  }

  return {
    totalQuestions: questions.length,
    isValid: errors.length === 0,
    errors,
    countsByLevel,
    countsByTopic,
  };
}
