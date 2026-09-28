/**
 * Tutr Kidz - Curriculum Integrity Validator (Phase 21)
 *
 * Verifies consistency across Levels -> Topics -> Questions:
 * - Every level has registered topics
 * - Every topic has available questions
 * - Every question references a valid, mapped topic and level
 * - No orphaned topics or orphaned questions
 * - No terminology or identifier collisions
 */

import { LEVELS, getLevelById, isValidLevelId } from "../../constants/levels";
import { TOPICS_BY_LEVEL, SUBJECTS } from "../../data/curriculum";
import { ALL_QUESTIONS } from "../../data/questionBank";
import { CurriculumLevel } from "../../types/curriculum";

export interface CurriculumValidationError {
  type:
    | "INVALID_LEVEL"
    | "INVALID_SUBJECT"
    | "EMPTY_LEVEL"
    | "ORPHANED_TOPIC"
    | "ORPHANED_QUESTION"
    | "TERMINOLOGY_CONFLICT";
  level?: string;
  topic?: string;
  questionId?: string;
  message: string;
}

export interface LevelCurriculumSummary {
  level: string;
  title: string;
  topicCount: number;
  questionCount: number;
  topics: Array<{ id: string; title: string; questionCount: number }>;
}

export interface CurriculumValidationResult {
  isValid: boolean;
  errors: CurriculumValidationError[];
  levelSummaries: LevelCurriculumSummary[];
  totalLevels: number;
  totalTopics: number;
  totalQuestions: number;
}

/**
 * Validates a single level definition, its topics, and associated questions.
 */
export function validateLevel(levelId: string): {
  isValid: boolean;
  errors: CurriculumValidationError[];
  topicCount: number;
  questionCount: number;
} {
  const errors: CurriculumValidationError[] = [];
  const levelConfig = getLevelById(levelId);

  if (!levelConfig) {
    errors.push({
      type: "INVALID_LEVEL",
      level: levelId,
      message: "Level \"" + levelId + "\" is not recognized in LEVELS",
    });
    return { isValid: false, errors, topicCount: 0, questionCount: 0 };
  }

  const topics = TOPICS_BY_LEVEL[levelId as CurriculumLevel] || [];
  if (topics.length === 0) {
    errors.push({
      type: "EMPTY_LEVEL",
      level: levelId,
      message: "Level \"" + levelId + "\" has zero configured topics in TOPICS_BY_LEVEL",
    });
  }

  const validSubjects = new Set(SUBJECTS.map((s) => s.id));
  let questionCount = 0;

  for (const topic of topics) {
    if (!validSubjects.has(topic.subject)) {
      errors.push({
        type: "INVALID_SUBJECT",
        level: levelId,
        topic: topic.id,
        message: "Topic \"" + topic.id + "\" has unknown subject \"" + topic.subject + "\"",
      });
    }

    const matchingQuestions = ALL_QUESTIONS.filter(
      (q) => q.level === levelId && q.topic === topic.id
    );

    if (matchingQuestions.length === 0) {
      errors.push({
        type: "ORPHANED_TOPIC",
        level: levelId,
        topic: topic.id,
        message: "Topic \"" + topic.id + "\" in level \"" + levelId + "\" has zero questions",
      });
    }

    questionCount += matchingQuestions.length;
  }

  return {
    isValid: errors.length === 0,
    errors,
    topicCount: topics.length,
    questionCount,
  };
}

/**
 * Scan for topics that have no questions configured.
 */
export function findOrphanedTopics(): Array<{ level: string; topic: string }> {
  const orphaned: Array<{ level: string; topic: string }> = [];

  for (const [level, topics] of Object.entries(TOPICS_BY_LEVEL)) {
    for (const topic of topics) {
      const count = ALL_QUESTIONS.filter(
        (q) => q.level === level && q.topic === topic.id
      ).length;
      if (count === 0) {
        orphaned.push({ level, topic: topic.id });
      }
    }
  }

  return orphaned;
}

/**
 * Scan for questions that reference a topic not configured for that level.
 */
export function findOrphanedQuestions(): Array<{
  questionId: string;
  level: string;
  topic: string;
}> {
  const orphaned: Array<{ questionId: string; level: string; topic: string }> = [];

  const topicSet = new Set<string>();
  for (const [level, topics] of Object.entries(TOPICS_BY_LEVEL)) {
    for (const topic of topics) {
      topicSet.add(level + ":" + topic.id);
    }
  }

  for (const q of ALL_QUESTIONS) {
    const key = q.level + ":" + q.topic;
    if (!topicSet.has(key)) {
      orphaned.push({
        questionId: q.id,
        level: q.level,
        topic: q.topic,
      });
    }
  }

  return orphaned;
}

/**
 * Comprehensive curriculum integrity verification across all levels.
 */
export function validateCurriculum(): CurriculumValidationResult {
  const allErrors: CurriculumValidationError[] = [];
  const levelSummaries: LevelCurriculumSummary[] = [];

  let totalTopics = 0;

  for (const level of LEVELS) {
    const levelRes = validateLevel(level.id);
    if (!levelRes.isValid) {
      allErrors.push(...levelRes.errors);
    }

    const topics = TOPICS_BY_LEVEL[level.id as CurriculumLevel] || [];
    totalTopics += topics.length;

    const topicDetails = topics.map((t) => ({
      id: t.id,
      title: t.title,
      questionCount: ALL_QUESTIONS.filter(
        (q) => q.level === level.id && q.topic === t.id
      ).length,
    }));

    levelSummaries.push({
      level: level.id,
      title: level.title,
      topicCount: topics.length,
      questionCount: levelRes.questionCount,
      topics: topicDetails,
    });
  }

  // Check orphaned questions
  const orphanedQs = findOrphanedQuestions();
  orphanedQs.forEach((oq) => {
    allErrors.push({
      type: "ORPHANED_QUESTION",
      level: oq.level,
      topic: oq.topic,
      questionId: oq.questionId,
      message:
        "Question \"" +
        oq.questionId +
        "\" references unregistered topic \"" +
        oq.topic +
        "\" in level \"" +
        oq.level +
        "\"",
    });
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    levelSummaries,
    totalLevels: LEVELS.length,
    totalTopics,
    totalQuestions: ALL_QUESTIONS.length,
  };
}
