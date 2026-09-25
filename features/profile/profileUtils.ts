import { CurriculumLevel } from '../../types/curriculum';
import { ProgressState } from '../progress/types';
import { ProfileState } from './profileTypes';
import { ChildRecord } from '../family/familyTypes';

/**
 * Get the display name of the child, or an empty string if no profile is set.
 */
export function getChildDisplayName(
  profileState: ProfileState | ChildRecord | null | undefined
): string {
  if (!profileState) return '';
  if ('profile' in profileState) {
    return profileState.profile.name.trim();
  }
  if (!profileState.child?.name) {
    return '';
  }
  return profileState.child.name.trim();
}

/**
 * Get the current learning level of the child, or null if no profile is set.
 */
export function getCurrentLevel(
  profileState: ProfileState | ChildRecord | null | undefined
): CurriculumLevel | null {
  if (!profileState) return null;
  if ('profile' in profileState) {
    return profileState.profile.level;
  }
  return profileState.child?.level ?? null;
}

/**
 * Get the configured daily question goal (defaults to 5).
 */
export function getDailyQuestionGoal(
  profileState: ProfileState | ChildRecord | null | undefined
): number {
  return profileState?.preferences?.dailyQuestionGoal ?? 5;
}

/**
 * Determine whether a specific curriculum level should be visible on the Home screen.
 * - When no child profile exists, all levels are shown.
 * - When showAllLevels is true, all levels are shown.
 * - When showAllLevels is false, only the child's selected level is shown.
 */
export function shouldShowLevel(
  profileState: ProfileState | ChildRecord | null | undefined,
  level: CurriculumLevel
): boolean {
  if (!profileState) {
    return true;
  }
  if ('profile' in profileState) {
    if (profileState.preferences?.showAllLevels !== false) {
      return true;
    }
    return profileState.profile.level === level;
  }
  if (!profileState.child) {
    return true;
  }
  if (profileState.preferences?.showAllLevels !== false) {
    return true;
  }
  return profileState.child.level === level;
}

/**
 * Calculate total questions answered today using existing Phase 6 topic record timestamps.
 * Compares local calendar dates to accurately reflect the child's practice today.
 */
export function getTodayQuestionsAnswered(progress: ProgressState | null | undefined): number {
  if (!progress || !progress.topics) {
    return 0;
  }

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  let count = 0;
  for (const record of Object.values(progress.topics)) {
    if (!record || !record.lastPlayedAt) continue;

    try {
      const playedDate = new Date(record.lastPlayedAt);
      if (
        playedDate.getFullYear() === todayYear &&
        playedDate.getMonth() === todayMonth &&
        playedDate.getDate() === todayDate
      ) {
        count += record.questionsAnswered || 0;
      }
    } catch {
      // Ignore invalid date strings safely
    }
  }

  return count;
}
