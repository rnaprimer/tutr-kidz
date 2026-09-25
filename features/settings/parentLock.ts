import { ParentChallenge } from './settingsTypes';
import { getSettings } from './settingsStorage';
import { isParentUnlocked, unlockParent } from './parentSession';

const ARITHMETIC_CHALLENGES: Array<{ question: string; answer: number }> = [
  { question: 'What is 7 + 5?', answer: 12 },
  { question: 'What is 8 + 6?', answer: 14 },
  { question: 'What is 9 + 4?', answer: 13 },
  { question: 'What is 6 + 7?', answer: 13 },
  { question: 'What is 15 - 8?', answer: 7 },
  { question: 'What is 12 - 4?', answer: 8 },
  { question: 'What is 3 × 4?', answer: 12 },
  { question: 'What is 5 × 3?', answer: 15 },
  { question: 'What is 8 + 9?', answer: 17 },
  { question: 'What is 14 - 6?', answer: 8 },
];

/**
 * Checks whether parent lock is currently enabled in settings.
 */
export async function isParentLockEnabled(): Promise<boolean> {
  const settings = await getSettings();
  return settings.parentLockEnabled;
}

/**
 * Generate a random simple arithmetic challenge.
 */
export function generateParentChallenge(): ParentChallenge {
  const index = Math.floor(Math.random() * ARITHMETIC_CHALLENGES.length);
  const item = ARITHMETIC_CHALLENGES[index];
  return {
    question: item.question,
    answer: item.answer,
    prompt: "Let's check that a grown-up is here.",
  };
}

/**
 * Verifies a challenge response.
 * If correct, marks the parent session as unlocked.
 */
export function verifyParentChallenge(
  expectedAnswer: number,
  userAnswer: string | number
): boolean {
  const parsed = typeof userAnswer === 'number' ? userAnswer : parseInt(String(userAnswer).trim(), 10);
  if (isNaN(parsed)) {
    return false;
  }

  const isCorrect = parsed === expectedAnswer;
  if (isCorrect) {
    unlockParent();
  }
  return isCorrect;
}

/**
 * Determine if a route or parent entry requires unlocking.
 */
export async function requiresParentUnlock(): Promise<boolean> {
  const lockEnabled = await isParentLockEnabled();
  if (!lockEnabled) {
    return false;
  }
  return !isParentUnlocked();
}
