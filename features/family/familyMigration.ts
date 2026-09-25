import {
  generateChildId,
  getFamilyState,
  saveFamilyState,
  familyStorageAdapter,
} from './familyStorage';
import { ChildRecord, FamilyState } from './familyTypes';

export const MIGRATION_KEY = 'tutr_kidz_family_migration_v1';
export const LEGACY_PROFILE_KEY = 'tutr_kidz_profile';
export const LEGACY_PROGRESS_KEY = 'tutr_kidz_progress';

/**
 * Perform a safe, one-time idempotent migration from Phase 8 single-child profile
 * and progress into the Phase 9 multi-child family structure.
 */
export async function runFamilyMigration(): Promise<boolean> {
  try {
    const isMigrated = await familyStorageAdapter.getItem(MIGRATION_KEY);
    if (isMigrated === 'true') {
      return false; // Already completed
    }

    const legacyProfileRaw = await familyStorageAdapter.getItem(LEGACY_PROFILE_KEY);
    if (!legacyProfileRaw) {
      await familyStorageAdapter.setItem(MIGRATION_KEY, 'true');
      return false;
    }

    const legacyProfile = JSON.parse(legacyProfileRaw);
    if (!legacyProfile || typeof legacyProfile !== 'object') {
      await familyStorageAdapter.setItem(MIGRATION_KEY, 'true');
      return false;
    }

    if (legacyProfile.child && legacyProfile.child.name) {
      const existingFamily = await getFamilyState();
      const existingCount = Object.keys(existingFamily.children).length;

      // Only migrate into family if no family children currently exist
      if (existingCount === 0) {
        const childId = generateChildId();
        const now = new Date().toISOString();

        const childRecord: ChildRecord = {
          profile: {
            id: childId,
            name: legacyProfile.child.name.trim(),
            level: legacyProfile.child.level,
            createdAt: legacyProfile.child.createdAt || now,
            updatedAt: legacyProfile.child.updatedAt || now,
          },
          preferences: {
            dailyQuestionGoal: legacyProfile.preferences?.dailyQuestionGoal ?? 5,
            showAllLevels: legacyProfile.preferences?.showAllLevels ?? true,
          },
        };

        const newFamilyState: FamilyState = {
          children: {
            [childId]: childRecord,
          },
          activeChildId: childId,
        };

        // Migrate legacy progress to child progress key
        const legacyProgressRaw = await familyStorageAdapter.getItem(LEGACY_PROGRESS_KEY);
        if (legacyProgressRaw) {
          const childProgressKey = `tutr_kidz_progress_${childId}`;
          await familyStorageAdapter.setItem(childProgressKey, legacyProgressRaw);
        }

        // Save family state atomically
        await saveFamilyState(newFamilyState);
      }
    }

    // Mark migration as completed
    await familyStorageAdapter.setItem(MIGRATION_KEY, 'true');
    return true;
  } catch {
    // If migration errors, preserve all data and do not mark as migrated to allow retry
    return false;
  }
}
