/**
 * Tutr Kidz - Plan Storage Adapter (Phase 19)
 *
 * Local-first persistence adapter for gentle learning plans.
 */

import { familyStorageAdapter } from '../family/familyStorageAdapter';
export { LearningPlan } from './planTypes';
import { LearningPlan } from './planTypes';

export const getPlanStorageKey = (childId: string): string => `tutr_kidz_plan_${childId}`;

export function createDefaultPlan(childId: string): LearningPlan {
  const now = new Date().toISOString();
  return {
    childId,
    intention: 'Keep learning naturally',
    selectedTopics: [],
    enabled: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const planStorageAdapter = {
  getPlan: async (childId: string): Promise<LearningPlan | null> => {
    try {
      const raw = await familyStorageAdapter.getItem(getPlanStorageKey(childId));
      if (!raw) return null;
      return JSON.parse(raw) as LearningPlan;
    } catch {
      return null;
    }
  },

  setPlan: async (plan: LearningPlan): Promise<void> => {
    try {
      await familyStorageAdapter.setItem(getPlanStorageKey(plan.childId), JSON.stringify(plan));
    } catch {
      // Safe fail
    }
  },

  removePlan: async (childId: string): Promise<void> => {
    try {
      await familyStorageAdapter.removeItem(getPlanStorageKey(childId));
    } catch {
      // Safe fail
    }
  },
};
