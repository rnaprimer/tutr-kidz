/**
 * In-memory parent session management.
 * The unlocked state is NOT persisted across app reloads/restarts.
 */

let parentUnlocked = false;

export function isParentUnlocked(): boolean {
  return parentUnlocked;
}

export function unlockParent(): void {
  parentUnlocked = true;
}

export function lockParent(): void {
  parentUnlocked = false;
}

/**
 * Reset parent session (used in testing or app reset)
 */
export function resetParentSession(): void {
  parentUnlocked = false;
}
