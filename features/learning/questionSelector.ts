/**
 * Tutr Kidz - Adaptive Question Selection & Repetition Avoidance (Phase 22)
 *
 * Deterministic question selector that:
 * 1. Avoids repeating questions recently seen in past sessions when alternatives exist
 * 2. Implements gentle, non-punishing progression for Classes 1-4 (easy -> medium)
 * 3. Provides exploratory variety for Toddlers
 * 4. Remains 100% deterministic, offline-first, and testable
 */

import { QuizQuestion } from "../../types/quiz";
import { CurriculumLevel, Difficulty } from "../../types/curriculum";
import { getConfiguredQuizCount } from "../../data/questionBank";
import { progressStorageAdapter } from "../progress/progressStorageAdapter";

export interface AdaptiveSelectionOptions {
  count?: number;
  recentQuestionIds?: string[];
  level?: CurriculumLevel;
  topicId?: string;
  seed?: number | string;
}

const RECENT_KEY_PREFIX = "tutr_kidz_recent_q_";
const MAX_RECENT_HISTORY = 30;

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 */
function createSeededRng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Retrieve recent question IDs for a child and optional topic from local storage.
 */
export async function getRecentQuestionIds(
  childId: string,
  topicId?: string
): Promise<string[]> {
  if (!childId) return [];
  const key = RECENT_KEY_PREFIX + childId + (topicId ? "_" + topicId : "");
  try {
    const raw = await progressStorageAdapter.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Record questions exposed to a child in local storage to prevent immediate repetition.
 */
export async function recordQuestionExposure(
  childId: string,
  questionIds: string[],
  topicId?: string
): Promise<void> {
  if (!childId || !questionIds || questionIds.length === 0) return;
  const key = RECENT_KEY_PREFIX + childId + (topicId ? "_" + topicId : "");
  try {
    const existing = await getRecentQuestionIds(childId, topicId);
    // Add new question IDs to end, maintaining FIFO max length
    const updated = [...existing.filter((id) => !questionIds.includes(id)), ...questionIds];
    const trimmed = updated.slice(-MAX_RECENT_HISTORY);
    await progressStorageAdapter.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Non-blocking storage fallback
  }
}

/**
 * Clear exposure history for a child (e.g. for testing or reset).
 */
export async function clearQuestionExposure(
  childId: string,
  topicId?: string
): Promise<void> {
  if (!childId) return;
  const key = RECENT_KEY_PREFIX + childId + (topicId ? "_" + topicId : "");
  try {
    await progressStorageAdapter.setItem(key, JSON.stringify([]));
  } catch {
    // Fallback
  }
}

const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * Core Deterministic Adaptive Question Selector.
 */
export function selectAdaptiveQuestions(
  allQuestions: QuizQuestion[],
  options?: AdaptiveSelectionOptions
): QuizQuestion[] {
  if (!allQuestions || allQuestions.length === 0) {
    return [];
  }

  const targetCount = options?.count ?? getConfiguredQuizCount();

  // If question bank has fewer or equal to target count, return all valid questions without dropping
  if (allQuestions.length <= targetCount) {
    return [...allQuestions];
  }

  const recentIds = options?.recentQuestionIds || [];
  const recentSet = new Set(recentIds);

  // Partition into unseen (fresh) and seen questions
  const unseen = allQuestions.filter((q) => !recentSet.has(q.id));
  const seen = allQuestions.filter((q) => recentSet.has(q.id));

  // Determine candidate pool with repetition avoidance
  let candidates: QuizQuestion[] = [];

  if (unseen.length >= targetCount) {
    // We have plenty of fresh questions!
    candidates = [...unseen];
  } else {
    // Start with all fresh questions
    candidates = [...unseen];

    // Backfill remainder from seen questions, prioritizing oldest seen first
    const sortedSeen = [...seen].sort((a, b) => {
      const idxA = recentIds.indexOf(a.id);
      const idxB = recentIds.indexOf(b.id);
      return idxA - idxB; // Earlier index = seen longer ago
    });

    const needed = targetCount - candidates.length;
    candidates.push(...sortedSeen.slice(0, needed));
  }

  // If candidates still exceed targetCount, apply deterministic ordering & selection
  const isToddler = options?.level === "toddler";

  if (options?.seed !== undefined) {
    const seedNum =
      typeof options.seed === "number"
        ? options.seed
        : stringToSeed(String(options.seed));
    const rng = createSeededRng(seedNum);

    // Seeded shuffle of candidate pool
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, targetCount);

    if (isToddler) {
      return selected;
    }

    // For Class 1-4: Sort selected questions by difficulty for gradual progression (easy -> medium -> hard)
    return selected.sort((a, b) => {
      const diffA = DIFFICULTY_WEIGHT[a.difficulty] || 2;
      const diffB = DIFFICULTY_WEIGHT[b.difficulty] || 2;
      return diffA - diffB;
    });
  }

  // Non-seeded deterministic path
  if (candidates.length > targetCount) {
    if (isToddler) {
      // Pick balanced spread
      candidates = candidates.slice(0, targetCount);
    } else {
      // Sort by difficulty first (gradual progression)
      candidates.sort((a, b) => {
        const diffA = DIFFICULTY_WEIGHT[a.difficulty] || 2;
        const diffB = DIFFICULTY_WEIGHT[b.difficulty] || 2;
        return diffA - diffB;
      });
      candidates = candidates.slice(0, targetCount);
    }
  }

  // Final check: For Classes 1-4, always arrange easy -> medium
  if (!isToddler) {
    return candidates.sort((a, b) => {
      const diffA = DIFFICULTY_WEIGHT[a.difficulty] || 2;
      const diffB = DIFFICULTY_WEIGHT[b.difficulty] || 2;
      return diffA - diffB;
    });
  }

  return candidates;
}
