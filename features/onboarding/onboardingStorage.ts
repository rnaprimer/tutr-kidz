/**
 * Tutr Kidz - Onboarding Persistence (Phase 20)
 *
 * Local-first flag indicating whether the first-time onboarding has been completed.
 * Returning parents always bypass onboarding.
 */

import { familyStorageAdapter } from '../family/familyStorageAdapter';

export const ONBOARDING_STORAGE_KEY = 'tutr_kidz_onboarding_completed';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await familyStorageAdapter.getItem(ONBOARDING_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingCompleted(): Promise<void> {
  try {
    await familyStorageAdapter.setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch {
    // Safe fail
  }
}

export async function resetOnboardingState(): Promise<void> {
  try {
    await familyStorageAdapter.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // Safe fail
  }
}
