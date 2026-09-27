/**
 * Tutr Kidz - Gentle Learning Plan Repository (Phase 19)
 *
 * Provides single-source-of-truth access for family learning intentions.
 * Fully offline-first: persists locally to cache, queues mutations when offline,
 * and maintains complete child/family isolation.
 */

import { LearningPlan, createDefaultPlan, planStorageAdapter } from './planStorage';
import { enqueueSyncItem } from '../sync/syncQueue';
import { getSupabaseClient } from '../../lib/supabase/client';
import { getCurrentParentUser } from '../../lib/supabase/auth';
import { trackEvent } from '../../lib/analytics';

/**
 * Retrieves the learning plan for a specific child, or creates a default plan.
 */
export async function getLearningPlan(childId: string): Promise<LearningPlan> {
  if (!childId) return createDefaultPlan('unknown');

  const existing = await planStorageAdapter.getPlan(childId);
  if (existing) {
    return existing;
  }

  const defaultPlan = createDefaultPlan(childId);
  await planStorageAdapter.setPlan(defaultPlan);
  return defaultPlan;
}

/**
 * Saves or updates a learning plan locally and synchronizes/queues for cloud.
 */
export async function saveLearningPlan(plan: LearningPlan): Promise<LearningPlan> {
  const updatedPlan: LearningPlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
  };

  // 1. Write locally
  await planStorageAdapter.setPlan(updatedPlan);

  // 2. Queue or sync via existing sync queue
  try {
    await enqueueSyncItem({
      entityType: 'learning_plan',
      entityId: updatedPlan.childId,
      operation: 'UPDATE',
      payload: updatedPlan,
    });
  } catch {
    // Local write succeeded; queue error is non-fatal
  }

  // 3. Track product-level analytics (sanitized, zero child IDs in payload)
  trackEvent('learning_plan_updated', {
    hasTopics: updatedPlan.selectedTopics.length > 0,
    enabled: updatedPlan.enabled,
  });

  return updatedPlan;
}

/**
 * Updates the gentle intention for a learner.
 */
export async function updateLearningIntention(
  childId: string,
  intention: string
): Promise<LearningPlan> {
  const current = await getLearningPlan(childId);
  const isFirstTime = !current.enabled;

  const next: LearningPlan = {
    ...current,
    intention,
    enabled: true,
  };

  const saved = await saveLearningPlan(next);

  if (isFirstTime) {
    trackEvent('learning_plan_created', { enabled: true });
  }

  return saved;
}

/**
 * Updates selected topics for gentle focus.
 */
export async function updatePlanTopics(
  childId: string,
  topics: string[]
): Promise<LearningPlan> {
  const current = await getLearningPlan(childId);
  const next: LearningPlan = {
    ...current,
    selectedTopics: [...topics],
  };
  return await saveLearningPlan(next);
}

/**
 * Toggles whether a gentle learning plan is active.
 */
export async function toggleLearningPlan(
  childId: string,
  enabled: boolean
): Promise<LearningPlan> {
  const current = await getLearningPlan(childId);
  const next: LearningPlan = {
    ...current,
    enabled,
  };
  return await saveLearningPlan(next);
}

/**
 * Resets a child's learning plan back to defaults.
 */
export async function resetLearningPlan(childId: string): Promise<void> {
  const defaultPlan = createDefaultPlan(childId);
  await planStorageAdapter.setPlan(defaultPlan);

  try {
    await enqueueSyncItem({
      entityType: 'learning_plan',
      entityId: childId,
      operation: 'DELETE',
      payload: { childId },
    });
  } catch {
    // Safe fail
  }
}
