/**
 * Tutr Kidz - Parent Controls & App Settings Types (Phase 11)
 *
 * Defines app-wide parent settings and configuration state.
 * Child-specific preferences remain stored in ChildRecord.preferences.
 */

export interface ParentSettings {
  /** Whether daily question guidance is enabled in the app */
  dailyQuestionGoalEnabled: boolean;

  /** Default daily goal assigned to newly created learners */
  defaultDailyQuestionGoal: 5 | 10 | 15 | 20;

  /** Default level visibility assigned to newly created learners */
  showAllLevelsByDefault: boolean;

  /** Number of questions in a standard quiz session */
  sessionQuestionCount: 5 | 10;

  /** Whether to reduce motion and visual transitions */
  reduceMotion: boolean;

  /** Whether parent areas require simple arithmetic confirmation */
  parentLockEnabled: boolean;

  /** Whether destructive actions require explicit confirmation dialogs */
  requireParentConfirmationForReset: boolean;
}

export interface AppSettingsState {
  settings: ParentSettings;
  updatedAt: string;
}

export interface ParentChallenge {
  question: string;
  answer: number;
  prompt: string;
}
