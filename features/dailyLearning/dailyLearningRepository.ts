import { getFamilyState } from '../family/familyStorage';
import { getProgress } from '../progress/progressStorage';
import { getSettings } from '../settings/settingsStorage';
import { DailyLearningRecommendation } from './dailyLearningTypes';
import { getDailyRecommendation } from './dailyLearningUtils';

/**
 * Fetches the daily learning recommendation for the active learner (or specified childId).
 * Entirely derived from existing persistent state; no secondary recommendation store is used.
 */
export async function fetchDailyRecommendation(
  childId?: string | null
): Promise<DailyLearningRecommendation | null> {
  const familyState = await getFamilyState();
  const targetId = childId || familyState.activeChildId;

  if (!targetId || !familyState.children[targetId]) {
    return null;
  }

  const childRecord = familyState.children[targetId];

  const [progress, settings] = await Promise.all([
    getProgress(targetId),
    getSettings(),
  ]);

  return getDailyRecommendation({
    childRecord,
    progress,
    isGoalEnabled: settings.dailyQuestionGoalEnabled,
  });
}
