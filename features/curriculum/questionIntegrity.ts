/**
 * Tutr Kidz - Question Bank Integrity Validator (Phase 21)
 *
 * Deterministic validation utility for question banks.
 * Never silently modifies questions.
 * Returns structured, actionable errors.
 */

import { ALL_QUESTIONS } from "../../data/questionBank";
import { TOPICS_BY_LEVEL } from "../../data/curriculum";
import { LEVELS } from "../../constants/levels";
import { QuizQuestion } from "../../types/quiz";
import { CurriculumLevel } from "../../types/curriculum";

export interface QuestionValidationError {
  questionId?: string;
  field?: string;
  error: string;
  code:
    | "MISSING_ID"
    | "DUPLICATE_ID"
    | "INVALID_LEVEL"
    | "INVALID_TOPIC"
    | "EMPTY_QUESTION"
    | "INVALID_OPTIONS_COUNT"
    | "DUPLICATE_OPTION_ID"
    | "DUPLICATE_OPTION_VALUE"
    | "MISSING_OPTION_CONTENT"
    | "MISSING_A11Y_LABEL"
    | "INVALID_CORRECT_OPTION"
    | "BROKEN_REFERENCE";
}

export interface QuestionValidationResult {
  isValid: boolean;
  errors: QuestionValidationError[];
}

export interface QuestionBankValidationResult {
  totalQuestions: number;
  isValid: boolean;
  errors: QuestionValidationError[];
  duplicateIds: string[];
  invalidQuestions: Array<{ id: string; errors: string[] }>;
  brokenReferences: Array<{ id: string; reference: string; details: string }>;
  countsByLevel: Record<string, number>;
  countsByTopic: Record<string, number>;
}

const VALID_LEVELS = new Set<string>(LEVELS.map((l) => l.id));

function getTopicsMap(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const [level, topics] of Object.entries(TOPICS_BY_LEVEL)) {
    map.set(level, new Set(topics.map((t) => t.id)));
  }
  return map;
}

/**
 * Validate a single question in isolation against schema and content rules.
 */
export function validateQuestion(q: QuizQuestion): QuestionValidationResult {
  const errors: QuestionValidationError[] = [];
  const qId = q.id;

  // 1. Question ID
  if (!q.id || typeof q.id !== "string" || q.id.trim() === "") {
    errors.push({
      questionId: qId,
      field: "id",
      error: "Question ID must be a non-empty string",
      code: "MISSING_ID",
    });
  }

  // 2. Level
  if (!q.level || !VALID_LEVELS.has(q.level)) {
    errors.push({
      questionId: qId,
      field: "level",
      error: "Invalid level: " + q.level,
      code: "INVALID_LEVEL",
    });
  }

  // 3. Topic
  const topicsMap = getTopicsMap();
  const levelTopics = q.level ? topicsMap.get(q.level) : undefined;
  if (!q.topic || !levelTopics || !levelTopics.has(q.topic)) {
    errors.push({
      questionId: qId,
      field: "topic",
      error: "Invalid or unmapped topic " + q.topic + " for level " + q.level,
      code: "INVALID_TOPIC",
    });
  }

  // 4. Question Text
  if (!q.question || typeof q.question !== "string" || q.question.trim() === "") {
    errors.push({
      questionId: qId,
      field: "question",
      error: "Question text must be a non-empty string",
      code: "EMPTY_QUESTION",
    });
  }

  // 5. Options Structure
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push({
      questionId: qId,
      field: "options",
      error: "Question must have exactly 4 options, found " + (q.options ? q.options.length : 0),
      code: "INVALID_OPTIONS_COUNT",
    });
  } else {
    const seenOptionIds = new Set<string>();
    const seenOptionValues = new Set<string>();
    let correctFound = false;

    q.options.forEach((opt, idx) => {
      // Option ID
      if (!opt.id || typeof opt.id !== "string" || opt.id.trim() === "") {
        errors.push({
          questionId: qId,
          field: "options[" + idx + "].id",
          error: "Option at index " + idx + " has an empty ID",
          code: "MISSING_ID",
        });
      } else if (seenOptionIds.has(opt.id)) {
        errors.push({
          questionId: qId,
          field: "options[" + idx + "].id",
          error: "Duplicate option ID within question: " + opt.id,
          code: "DUPLICATE_OPTION_ID",
        });
      } else {
        seenOptionIds.add(opt.id);
      }

      // Option Content: must have label OR visual
      const hasLabel = opt.label && typeof opt.label === "string" && opt.label.trim() !== "";
      const hasVisual = opt.visual && typeof opt.visual === "object";
      const hasA11y =
        opt.accessibilityLabel &&
        typeof opt.accessibilityLabel === "string" &&
        opt.accessibilityLabel.trim() !== "";

      if (!hasLabel && !hasVisual) {
        errors.push({
          questionId: qId,
          field: "options[" + idx + "]",
          error: "Option at index " + idx + " must provide either a text label or a visual object",
          code: "MISSING_OPTION_CONTENT",
        });
      }

      if (hasVisual && !hasLabel && !hasA11y) {
        errors.push({
          questionId: qId,
          field: "options[" + idx + "].accessibilityLabel",
          error: "Visual option at index " + idx + " without label requires an accessibilityLabel",
          code: "MISSING_A11Y_LABEL",
        });
      }

      // Check duplicate option values
      const valKey = hasLabel
        ? opt.label.trim().toLowerCase()
        : (hasA11y && opt.accessibilityLabel)
        ? opt.accessibilityLabel.trim().toLowerCase()
        : JSON.stringify(opt.visual);

      if (seenOptionValues.has(valKey)) {
        errors.push({
          questionId: qId,
          field: "options[" + idx + "]",
          error: "Duplicate option answer value within question: " + valKey,
          code: "DUPLICATE_OPTION_VALUE",
        });
      }
      seenOptionValues.add(valKey);

      if (opt.id === q.correctOptionId) {
        correctFound = true;
      }
    });

    // 6. Correct Option ID
    if (!correctFound) {
      errors.push({
        questionId: qId,
        field: "correctOptionId",
        error: "correctOptionId " + q.correctOptionId + " not found among the 4 options",
        code: "INVALID_CORRECT_OPTION",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Scan a list of questions to identify duplicate question IDs.
 */
export function findDuplicateQuestionIds(
  questions: QuizQuestion[] = ALL_QUESTIONS
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const q of questions) {
    if (!q.id) continue;
    if (seen.has(q.id)) {
      duplicates.add(q.id);
    } else {
      seen.add(q.id);
    }
  }

  return Array.from(duplicates);
}

/**
 * Find all questions with validation failures.
 */
export function findInvalidQuestions(
  questions: QuizQuestion[] = ALL_QUESTIONS
): Array<{ id: string; errors: string[] }> {
  const invalid: Array<{ id: string; errors: string[] }> = [];

  for (const q of questions) {
    const res = validateQuestion(q);
    if (!res.isValid) {
      invalid.push({
        id: q.id || "UNKNOWN",
        errors: res.errors.map((e) => e.error),
      });
    }
  }

  return invalid;
}

/**
 * Find broken references: unmapped topics, unmapped levels, or missing visual data.
 */
export function findBrokenReferences(
  questions: QuizQuestion[] = ALL_QUESTIONS
): Array<{ id: string; reference: string; details: string }> {
  const broken: Array<{ id: string; reference: string; details: string }> = [];
  const topicsMap = getTopicsMap();

  for (const q of questions) {
    if (!VALID_LEVELS.has(q.level)) {
      broken.push({
        id: q.id,
        reference: "level:" + q.level,
        details: "Level " + q.level + " is not registered in LEVELS",
      });
    }

    const levelTopics = topicsMap.get(q.level);
    if (!levelTopics || !levelTopics.has(q.topic)) {
      broken.push({
        id: q.id,
        reference: "topic:" + q.level + ":" + q.topic,
        details: "Topic " + q.topic + " is not registered under level " + q.level + " in TOPICS_BY_LEVEL",
      });
    }

    if (q.visual && typeof q.visual === "object") {
      if (!("type" in q.visual)) {
        broken.push({
          id: q.id,
          reference: "visual:type",
          details: "Question visual object missing type property",
        });
      }
    }
  }

  return broken;
}

/**
 * Comprehensive question bank audit.
 */
export function validateQuestionBank(
  questions: QuizQuestion[] = ALL_QUESTIONS
): QuestionBankValidationResult {
  const allErrors: QuestionValidationError[] = [];
  const countsByLevel: Record<string, number> = {};
  const countsByTopic: Record<string, number> = {};

  const duplicateIds = findDuplicateQuestionIds(questions);
  duplicateIds.forEach((dupId) => {
    allErrors.push({
      questionId: dupId,
      field: "id",
      error: "Duplicate question ID found: " + dupId,
      code: "DUPLICATE_ID",
    });
  });

  const invalidQuestions = findInvalidQuestions(questions);
  const brokenReferences = findBrokenReferences(questions);

  for (const q of questions) {
    countsByLevel[q.level] = (countsByLevel[q.level] || 0) + 1;
    const topicKey = q.level + ":" + q.topic;
    countsByTopic[topicKey] = (countsByTopic[topicKey] || 0) + 1;

    const res = validateQuestion(q);
    if (!res.isValid) {
      allErrors.push(...res.errors);
    }
  }

  return {
    totalQuestions: questions.length,
    isValid: allErrors.length === 0,
    errors: allErrors,
    duplicateIds,
    invalidQuestions,
    brokenReferences,
    countsByLevel,
    countsByTopic,
  };
}
