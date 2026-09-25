/**
 * Tutr Kidz - Profile Repository (Phase 13)
 *
 * Provides profile and learning preferences management, backed by Supabase
 * with local fallback.
 */

import { ChildId, ChildProfile, ChildRecord, LearningPreferences } from '../family/familyTypes';
import { getFamilyState, updateChild } from '../family/familyRepository';
import { CurriculumLevel } from '../../types/curriculum';

/**
 * Get profile and preferences for a specific child.
 */
export async function getChildRecord(childId: ChildId): Promise<ChildRecord | null> {
  const family = await getFamilyState();
  return family.children[childId] ?? null;
}

/**
 * Update child profile details.
 */
export async function updateChildProfile(
  childId: ChildId,
  updates: { name?: string; level?: CurriculumLevel }
): Promise<ChildRecord> {
  return updateChild(childId, updates);
}

/**
 * Update child learning preferences.
 */
export async function updateChildPreferences(
  childId: ChildId,
  preferences: Partial<LearningPreferences>
): Promise<ChildRecord> {
  return updateChild(childId, { preferences });
}
