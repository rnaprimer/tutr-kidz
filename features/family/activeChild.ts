import { ChildId, ChildRecord } from './familyTypes';
import { getFamilyState, getActiveChild as getActiveChildFromStorage } from './familyStorage';

/**
 * Retrieve the active child record, or null if none exists.
 */
export async function getActiveChild(): Promise<ChildRecord | null> {
  return getActiveChildFromStorage();
}

/**
 * Retrieve the active child ID, or null if none exists.
 */
export async function getActiveChildId(): Promise<ChildId | null> {
  const state = await getFamilyState();
  return state.activeChildId;
}

/**
 * Helper to get the active child or throw an error if strictly required.
 */
export async function requireActiveChild(): Promise<ChildRecord> {
  const child = await getActiveChild();
  if (!child) {
    throw new Error('No active child found in family state.');
  }
  return child;
}
