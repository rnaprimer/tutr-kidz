/**
 * Tutr Kidz - Progress Integrity Helpers (Phase 21)
 *
 * Deterministic validation and sanitization for progress records,
 * quiz attempts, and topic progress summaries.
 * Prevents negative counts, score > total, and state corruption.
 */

import { ProgressRecord, ProgressState, RecordQuizParams } from "./types";
import { isValidLevelId } from "../../constants/levels";

export interface ProgressValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a quiz attempt before recording.
 */
export function validateQuizAttempt(params: {
  level: string;
  topic: string;
  score: number;
  total: number;
  childId?: string | null;
}): ProgressValidationResult {
  const errors: string[] = [];

  if (!params.level || !isValidLevelId(params.level)) {
    errors.push("Invalid curriculum level: \"" + params.level + "\"");
  }

  if (!params.topic || typeof params.topic !== "string" || params.topic.trim() === "") {
    errors.push("Topic must be a non-empty string");
  }

  if (typeof params.total !== "number" || isNaN(params.total) || params.total <= 0) {
    errors.push("Quiz total must be a positive number greater than 0");
  }

  if (typeof params.score !== "number" || isNaN(params.score) || params.score < 0) {
    errors.push("Quiz score cannot be negative");
  } else if (params.total > 0 && params.score > params.total) {
    errors.push("Quiz score (" + params.score + ") cannot exceed total (" + params.total + ")");
  }

  if (params.childId !== undefined && params.childId !== null) {
    if (typeof params.childId !== "string" || params.childId.trim() === "") {
      errors.push("Child ID if provided must be a non-empty string");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize quiz attempt parameters to prevent corrupt state.
 */
export function sanitizeQuizAttempt(params: RecordQuizParams): RecordQuizParams {
  const rawTotal = Math.floor(Number(params.total));
  const safeTotal = isNaN(rawTotal) || rawTotal <= 0 ? 1 : rawTotal;

  const rawScore = Math.floor(Number(params.score));
  const clampedScore = isNaN(rawScore)
    ? 0
    : Math.max(0, Math.min(rawScore, safeTotal));

  return {
    level: params.level,
    topic: typeof params.topic === "string" && params.topic.trim() ? params.topic.trim() : "general",
    score: clampedScore,
    total: safeTotal,
  };
}

/**
 * Validate a single topic progress record.
 */
export function validateProgressRecord(record: ProgressRecord): ProgressValidationResult {
  const errors: string[] = [];

  if (!record) {
    return { isValid: false, errors: ["Progress record is null or undefined"] };
  }

  if (record.attempts < 0) errors.push("Attempts count cannot be negative");
  if (record.questionsAnswered < 0) errors.push("Questions answered cannot be negative");
  if (record.correctAnswers < 0) errors.push("Correct answers cannot be negative");
  if (record.incorrectAnswers < 0) errors.push("Incorrect answers cannot be negative");

  if (record.correctAnswers + record.incorrectAnswers !== record.questionsAnswered) {
    errors.push(
      "Sum of correct (" +
        record.correctAnswers +
        ") and incorrect (" +
        record.incorrectAnswers +
        ") must equal questions answered (" +
        record.questionsAnswered +
        ")"
    );
  }

  if (record.bestScore < 0) errors.push("Best score cannot be negative");
  if (record.bestTotal < 0) errors.push("Best total cannot be negative");
  if (record.bestTotal > 0 && record.bestScore > record.bestTotal) {
    errors.push("Best score (" + record.bestScore + ") cannot exceed best total (" + record.bestTotal + ")");
  }

  if (record.lastScore < 0) errors.push("Last score cannot be negative");
  if (record.lastTotal < 0) errors.push("Last total cannot be negative");
  if (record.lastTotal > 0 && record.lastScore > record.lastTotal) {
    errors.push("Last score (" + record.lastScore + ") cannot exceed last total (" + record.lastTotal + ")");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an entire progress state dictionary.
 */
export function validateTopicProgress(
  topics: Record<string, ProgressRecord>
): ProgressValidationResult {
  const errors: string[] = [];

  if (!topics || typeof topics !== "object") {
    return { isValid: false, errors: ["Topics must be an object"] };
  }

  for (const [topicKey, record] of Object.entries(topics)) {
    const res = validateProgressRecord(record);
    if (!res.isValid) {
      errors.push("Topic [" + topicKey + "]: " + res.errors.join(", "));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
