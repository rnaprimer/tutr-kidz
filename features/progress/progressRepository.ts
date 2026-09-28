/**
 * Tutr Kidz - Progress Repository (Phase 13)
 *
 * Normalizes learning progress into PostgreSQL `topic_progress` and `quiz_attempts`,
 * maintaining strict child isolation, best-score logic, and offline local cache.
 */

import { getSupabaseClient } from '../../lib/supabase/client';
import { getCurrentParentUser } from '../../lib/supabase/auth';
import { OverallProgress, ProgressRecord, ProgressState, RecordQuizParams } from './types';
import { sanitizeQuizAttempt } from './progressIntegrity';
import { getActiveChildId } from '../family/activeChild';
import {
  progressStorageAdapter,
  DEFAULT_PROGRESS,
  DEFAULT_STORAGE_KEY,
} from './progressStorageAdapter';

export async function resolveProgressKey(childId?: string | null): Promise<string> {
  const resolvedChildId = childId ?? (await getActiveChildId());
  if (resolvedChildId) {
    return `${DEFAULT_STORAGE_KEY}_${resolvedChildId}`;
  }
  return DEFAULT_STORAGE_KEY;
}

/**
 * Retrieve progress for a specific child.
 */
export async function getProgress(childId?: string | null): Promise<ProgressState> {
  const resolvedChildId = childId ?? (await getActiveChildId());
  const storageKey = await resolveProgressKey(resolvedChildId);

  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user && resolvedChildId) {
    try {
      const { data: dbTopics, error: topicErr } = await client
        .from('topic_progress')
        .select('*')
        .eq('child_id', resolvedChildId);

      if (!topicErr && dbTopics) {
        const topics: Record<string, ProgressRecord> = {};
        let totalQuestionsAnswered = 0;
        let totalCorrectAnswers = 0;
        let totalIncorrectAnswers = 0;
        let quizzesCompleted = 0;
        let latestPlayedAt: string | undefined = undefined;

        for (const row of dbTopics) {
          const rec: ProgressRecord = {
            level: row.level as any,
            topic: row.topic,
            attempts: row.attempts,
            questionsAnswered: row.questions_answered,
            correctAnswers: row.correct_answers,
            incorrectAnswers: row.incorrect_answers,
            bestScore: row.best_score,
            bestTotal: row.best_total,
            lastScore: row.last_score,
            lastTotal: row.last_total,
            lastPlayedAt: row.last_played_at || '',
          };

          topics[row.topic] = rec;
          totalQuestionsAnswered += row.questions_answered;
          totalCorrectAnswers += row.correct_answers;
          totalIncorrectAnswers += row.incorrect_answers;
          quizzesCompleted += row.attempts;

          if (row.last_played_at) {
            if (!latestPlayedAt || new Date(row.last_played_at) > new Date(latestPlayedAt)) {
              latestPlayedAt = row.last_played_at;
            }
          }
        }

        const overall: OverallProgress = {
          totalQuestionsAnswered,
          totalCorrectAnswers,
          totalIncorrectAnswers,
          quizzesCompleted,
          lastPlayedAt: latestPlayedAt,
        };

        const cloudProgress: ProgressState = { topics, overall };

        // Update local cache
        await progressStorageAdapter.setItem(storageKey, JSON.stringify(cloudProgress));
        return cloudProgress;
      }
    } catch {
      // network failure: fall back to local storage
    }
  }

  // Local fallback
  try {
    const raw = await progressStorageAdapter.getItem(storageKey);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    if (!parsed.topics || !parsed.overall) return DEFAULT_PROGRESS;
    return parsed as ProgressState;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

/**
 * Save progress state to cache & cloud.
 */
export async function saveProgress(
  state: ProgressState,
  childId?: string | null
): Promise<void> {
  const storageKey = await resolveProgressKey(childId);
  await progressStorageAdapter.setItem(storageKey, JSON.stringify(state));
}

/**
 * Record a completed quiz result.
 * Updates historical quiz_attempts and aggregated topic_progress.
 * Preserves bestScore and ensures complete child isolation.
 */
export async function recordQuizResult(
  params: RecordQuizParams,
  childId?: string | null
): Promise<ProgressState> {
  const safeParams = sanitizeQuizAttempt(params);
  const resolvedChildId = childId ?? (await getActiveChildId());
  const now = new Date().toISOString();

  // 1. Calculate updated local progress state first
  const current = await getProgress(resolvedChildId);
  const existingTopic = current.topics[safeParams.topic];

  // Best score logic: compute percentage to handle variable session lengths correctly
  let bestScore = safeParams.score;
  let bestTotal = safeParams.total;

  if (existingTopic && existingTopic.bestTotal > 0) {
    const prevBestRatio = existingTopic.bestScore / existingTopic.bestTotal;
    const newRatio = safeParams.score / safeParams.total;

    if (prevBestRatio > newRatio) {
      bestScore = existingTopic.bestScore;
      bestTotal = existingTopic.bestTotal;
    } else if (prevBestRatio === newRatio && existingTopic.bestScore >= safeParams.score) {
      bestScore = existingTopic.bestScore;
      bestTotal = existingTopic.bestTotal;
    }
  }

  const updatedTopic: ProgressRecord = {
    level: safeParams.level,
    topic: safeParams.topic,
    attempts: (existingTopic?.attempts ?? 0) + 1,
    questionsAnswered: (existingTopic?.questionsAnswered ?? 0) + safeParams.total,
    correctAnswers: (existingTopic?.correctAnswers ?? 0) + safeParams.score,
    incorrectAnswers: (existingTopic?.incorrectAnswers ?? 0) + (safeParams.total - safeParams.score),
    bestScore,
    bestTotal,
    lastScore: safeParams.score,
    lastTotal: safeParams.total,
    lastPlayedAt: now,
  };

  const nextTopics = {
    ...current.topics,
    [safeParams.topic]: updatedTopic,
  };

  const nextOverall: OverallProgress = {
    totalQuestionsAnswered: current.overall.totalQuestionsAnswered + safeParams.total,
    totalCorrectAnswers: current.overall.totalCorrectAnswers + safeParams.score,
    totalIncorrectAnswers: current.overall.totalIncorrectAnswers + (safeParams.total - safeParams.score),
    quizzesCompleted: current.overall.quizzesCompleted + 1,
    lastPlayedAt: now,
  };

  const nextState: ProgressState = {
    topics: nextTopics,
    overall: nextOverall,
  };

  // 2. Save locally
  await saveProgress(nextState, resolvedChildId);

  // 3. Sync to Supabase if authenticated
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user && resolvedChildId) {
    try {
      // 3.1 Insert immutable quiz attempt
      await client.from('quiz_attempts').insert({
        child_id: resolvedChildId,
        level: safeParams.level,
        topic: safeParams.topic,
        score: safeParams.score,
        total: safeParams.total,
        completed_at: now,
      });

      // 3.2 Upsert topic progress summary
      await client.from('topic_progress').upsert(
        {
          child_id: resolvedChildId,
          level: safeParams.level,
          topic: safeParams.topic,
          attempts: updatedTopic.attempts,
          questions_answered: updatedTopic.questionsAnswered,
          correct_answers: updatedTopic.correctAnswers,
          incorrect_answers: updatedTopic.incorrectAnswers,
          best_score: updatedTopic.bestScore,
          best_total: updatedTopic.bestTotal,
          last_score: updatedTopic.lastScore,
          last_total: updatedTopic.lastTotal,
          last_played_at: now,
          updated_at: now,
        },
        { onConflict: 'child_id,level,topic' }
      );
    } catch {
      // network failure: local write already succeeded
    }
  }

  return nextState;
}

/**
 * Reset progress for a specific child.
 */
export async function resetProgress(childId?: string | null): Promise<void> {
  const resolvedChildId = childId ?? (await getActiveChildId());
  const storageKey = await resolveProgressKey(resolvedChildId);

  // Reset local cache
  await progressStorageAdapter.removeItem(storageKey);

  // Reset in Supabase if authenticated
  const client = getSupabaseClient();
  const user = await getCurrentParentUser();

  if (client && user && resolvedChildId) {
    try {
      await client.from('topic_progress').delete().eq('child_id', resolvedChildId);
      await client.from('quiz_attempts').delete().eq('child_id', resolvedChildId);
    } catch {
      // ignore
    }
  }
}
