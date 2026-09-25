import { ChildProfile, LearningPreferences, ProfileState } from './profileTypes';
import { CurriculumLevel } from '../../types/curriculum';

export const STORAGE_KEY = 'tutr_kidz_profile';

export const DEFAULT_PROFILE_STATE: ProfileState = {
  child: null,
  preferences: {
    dailyQuestionGoal: 5,
    showAllLevels: true,
  },
};

// In-memory fallback if persistent storage is unavailable
let profileMemoryStorage: Record<string, string> = {};

/**
 * Low-level storage adapter safely supporting localStorage and in-memory fallback.
 */
const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback below
    }
    return profileMemoryStorage[key] ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback below
    }
    profileMemoryStorage[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback below
    }
    delete profileMemoryStorage[key];
  },
};

const VALID_GOALS: Array<LearningPreferences['dailyQuestionGoal']> = [5, 10, 15, 20];
const VALID_LEVELS: CurriculumLevel[] = ['toddler', 'class-1', 'class-2', 'class-3', 'class-4'];

/**
 * Retrieve the current profile state from storage.
 * Gracefully returns default state if missing or malformed.
 */
export async function getProfileState(): Promise<ProfileState> {
  try {
    const raw = await storageAdapter.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        child: null,
        preferences: { ...DEFAULT_PROFILE_STATE.preferences },
      };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {
        child: null,
        preferences: { ...DEFAULT_PROFILE_STATE.preferences },
      };
    }

    let validatedChild: ChildProfile | null = null;
    if (
      parsed.child &&
      typeof parsed.child === 'object' &&
      typeof parsed.child.name === 'string' &&
      VALID_LEVELS.includes(parsed.child.level)
    ) {
      validatedChild = {
        name: parsed.child.name.trim(),
        level: parsed.child.level,
        createdAt: typeof parsed.child.createdAt === 'string' ? parsed.child.createdAt : new Date().toISOString(),
        updatedAt: typeof parsed.child.updatedAt === 'string' ? parsed.child.updatedAt : new Date().toISOString(),
      };
    }

    const rawGoal = Number(parsed.preferences?.dailyQuestionGoal);
    const dailyQuestionGoal: LearningPreferences['dailyQuestionGoal'] = VALID_GOALS.includes(rawGoal as any)
      ? (rawGoal as LearningPreferences['dailyQuestionGoal'])
      : DEFAULT_PROFILE_STATE.preferences.dailyQuestionGoal;

    const showAllLevels = typeof parsed.preferences?.showAllLevels === 'boolean'
      ? parsed.preferences.showAllLevels
      : DEFAULT_PROFILE_STATE.preferences.showAllLevels;

    return {
      child: validatedChild,
      preferences: {
        dailyQuestionGoal,
        showAllLevels,
      },
    };
  } catch {
    return {
      child: null,
      preferences: { ...DEFAULT_PROFILE_STATE.preferences },
    };
  }
}

/**
 * Persist the entire profile state atomically.
 */
export async function saveProfileState(state: ProfileState): Promise<void> {
  try {
    const data = JSON.stringify(state);
    await storageAdapter.setItem(STORAGE_KEY, data);
  } catch {
    // Fail gracefully without crashing
  }
}

/**
 * Update or set the child profile, preserving learning preferences.
 */
export async function updateChildProfile(child: ChildProfile | null): Promise<ProfileState> {
  const current = await getProfileState();
  const nextState: ProfileState = {
    ...current,
    child,
  };
  await saveProfileState(nextState);
  return nextState;
}

/**
 * Update learning preferences, preserving child profile and unspecified preference fields.
 */
export async function updateLearningPreferences(
  preferences: Partial<LearningPreferences>
): Promise<ProfileState> {
  const current = await getProfileState();
  const nextState: ProfileState = {
    ...current,
    preferences: {
      ...current.preferences,
      ...preferences,
    },
  };
  await saveProfileState(nextState);
  return nextState;
}

/**
 * Clear the child profile and reset preferences to default.
 * Does NOT touch progress storage.
 */
export async function resetProfile(): Promise<void> {
  try {
    profileMemoryStorage = {};
    await storageAdapter.removeItem(STORAGE_KEY);
  } catch {
    // Fail gracefully
  }
}
