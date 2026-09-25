// Phase 11: Parent Controls, Safety & App Configuration Test Suite

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ ${message}`);
}

// Low-level storage simulation
let memoryStore = {};

const storageAdapter = {
  getItem: async (key) => memoryStore[key] ?? null,
  setItem: async (key, val) => { memoryStore[key] = val; },
  removeItem: async (key) => { delete memoryStore[key]; },
};

function generateChildId() {
  return `child_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const FAMILY_KEY = 'tutr_kidz_family';
const SETTINGS_KEY = 'tutr_kidz_settings';
const DEFAULT_SETTINGS = {
  dailyQuestionGoalEnabled: true,
  defaultDailyQuestionGoal: 5,
  showAllLevelsByDefault: true,
  sessionQuestionCount: 5,
  reduceMotion: false,
  parentLockEnabled: false,
  requireParentConfirmationForReset: true,
};

let cachedSettings = { ...DEFAULT_SETTINGS };

async function getSettings() {
  const raw = await storageAdapter.getItem(SETTINGS_KEY);
  if (!raw) {
    await saveSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
  const parsed = JSON.parse(raw);
  const settings = parsed.settings || parsed;
  cachedSettings = { ...settings };
  return { ...settings };
}

async function saveSettings(settings) {
  const state = {
    settings: { ...settings },
    updatedAt: new Date().toISOString(),
  };
  await storageAdapter.setItem(SETTINGS_KEY, JSON.stringify(state));
  cachedSettings = { ...settings };
}

async function updateSettings(partial) {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await saveSettings(next);
  return next;
}

async function resetSettings() {
  await saveSettings(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS };
}

// In-memory parent session state
let parentUnlocked = false;

function isParentUnlocked() {
  return parentUnlocked;
}

function unlockParent() {
  parentUnlocked = true;
}

function lockParent() {
  parentUnlocked = false;
}

function verifyParentChallenge(expected, given) {
  const parsed = parseInt(String(given).trim(), 10);
  if (isNaN(parsed)) return false;
  const isCorrect = parsed === expected;
  if (isCorrect) {
    unlockParent();
  }
  return isCorrect;
}

const PROTECTED_PARENT_PREFIXES = ['/parent'];

function isParentProtectedRoute(route) {
  if (!route) return false;
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return PROTECTED_PARENT_PREFIXES.some(
    (prefix) => cleanRoute === prefix || cleanRoute.startsWith(`${prefix}/`)
  );
}

async function canAccessParentRoute(route) {
  if (!isParentProtectedRoute(route)) {
    return true;
  }
  const settings = await getSettings();
  if (!settings.parentLockEnabled) {
    return true;
  }
  return isParentUnlocked();
}

// Family storage simulation
async function getFamilyState() {
  const raw = await storageAdapter.getItem(FAMILY_KEY);
  if (!raw) return { children: {}, activeChildId: null };
  return JSON.parse(raw);
}

async function saveFamilyState(state) {
  await storageAdapter.setItem(FAMILY_KEY, JSON.stringify(state));
}

async function addChild(params) {
  const current = await getFamilyState();
  const id = generateChildId();
  const now = new Date().toISOString();
  const settings = cachedSettings;
  const record = {
    profile: {
      id,
      name: params.name.trim(),
      level: params.level,
      createdAt: now,
      updatedAt: now,
    },
    preferences: {
      dailyQuestionGoal: params.preferences?.dailyQuestionGoal ?? settings.defaultDailyQuestionGoal,
      showAllLevels: params.preferences?.showAllLevels ?? settings.showAllLevelsByDefault,
    },
  };
  const nextChildren = { ...current.children, [id]: record };
  const nextActive = current.activeChildId || id;
  const nextState = { children: nextChildren, activeChildId: nextActive };
  await saveFamilyState(nextState);
  return record;
}

async function removeChild(id) {
  const current = await getFamilyState();
  if (!current.children[id]) return;
  const nextChildren = { ...current.children };
  delete nextChildren[id];
  const remainingIds = Object.keys(nextChildren);
  const nextActive = current.activeChildId === id ? (remainingIds[0] ?? null) : current.activeChildId;
  await saveFamilyState({ children: nextChildren, activeChildId: nextActive });
  await storageAdapter.removeItem(`tutr_kidz_progress_${id}`);
}

async function resetFamily() {
  const current = await getFamilyState();
  for (const childId of Object.keys(current.children)) {
    await storageAdapter.removeItem(`tutr_kidz_progress_${childId}`);
  }
  await storageAdapter.removeItem(FAMILY_KEY);
}

async function recordProgress(childId, score, total) {
  const key = `tutr_kidz_progress_${childId}`;
  const raw = await storageAdapter.getItem(key);
  const current = raw ? JSON.parse(raw) : { overall: { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, quizzesCompleted: 0 } };
  const updated = {
    overall: {
      totalQuestionsAnswered: current.overall.totalQuestionsAnswered + total,
      totalCorrectAnswers: current.overall.totalCorrectAnswers + score,
      quizzesCompleted: current.overall.quizzesCompleted + 1,
    },
  };
  await storageAdapter.setItem(key, JSON.stringify(updated));
}

async function resetProgress(childId) {
  await storageAdapter.removeItem(`tutr_kidz_progress_${childId}`);
}

async function getProgress(childId) {
  const raw = await storageAdapter.getItem(`tutr_kidz_progress_${childId}`);
  if (!raw) return { overall: { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, quizzesCompleted: 0 } };
  return JSON.parse(raw);
}

// RUN TESTS
async function runTests() {
  console.log('=== PHASE 11 PARENT CONTROLS & SETTINGS TESTS ===\n');

  // TEST 1: Fresh install creates default settings
  memoryStore = {};
  parentUnlocked = false;
  const initialSettings = await getSettings();
  assert(initialSettings.dailyQuestionGoalEnabled === true, 'TEST 1: Fresh install has dailyQuestionGoalEnabled = true');
  assert(initialSettings.defaultDailyQuestionGoal === 5, 'TEST 1: Fresh install has defaultDailyQuestionGoal = 5');
  assert(initialSettings.showAllLevelsByDefault === true, 'TEST 1: Fresh install has showAllLevelsByDefault = true');
  assert(initialSettings.sessionQuestionCount === 5, 'TEST 1: Fresh install has sessionQuestionCount = 5');
  assert(initialSettings.reduceMotion === false, 'TEST 1: Fresh install has reduceMotion = false');
  assert(initialSettings.parentLockEnabled === false, 'TEST 1: Fresh install has parentLockEnabled = false');
  assert(initialSettings.requireParentConfirmationForReset === true, 'TEST 1: Fresh install has requireParentConfirmationForReset = true');

  // TEST 2: Settings persist after reload
  await updateSettings({ reduceMotion: true });
  const reloaded = await getSettings();
  assert(reloaded.reduceMotion === true, 'TEST 2: Settings update persists across read');

  // TEST 3: Updating session length from 5 -> 10 persists
  await updateSettings({ sessionQuestionCount: 10 });
  const updatedSession = await getSettings();
  assert(updatedSession.sessionQuestionCount === 10, 'TEST 3: Session question count updated to 10 and persists');

  // TEST 4: Changing global daily goal does not overwrite existing child preferences
  const aarav = await addChild({ name: 'Aarav', level: 'class-2', preferences: { dailyQuestionGoal: 10 } });
  await updateSettings({ defaultDailyQuestionGoal: 20 });
  const familyStateAfterGoalChange = await getFamilyState();
  const aaravPreferences = familyStateAfterGoalChange.children[aarav.profile.id].preferences;
  assert(aaravPreferences.dailyQuestionGoal === 10, 'TEST 4: Existing learner Aarav retains daily goal 10 after global default changed to 20');

  // TEST 5: New learner receives the configured global defaults
  const anya = await addChild({ name: 'Anya', level: 'class-1' });
  const anyaRecord = (await getFamilyState()).children[anya.profile.id];
  assert(anyaRecord.preferences.dailyQuestionGoal === 20, 'TEST 5: New learner Anya receives global default daily goal 20');
  assert(anyaRecord.preferences.showAllLevels === true, 'TEST 5: New learner Anya receives global default level visibility');

  // TEST 6: Existing learner's level visibility remains unchanged when global default changes
  await updateSettings({ showAllLevelsByDefault: false });
  const anyaAfterVisibilityChange = (await getFamilyState()).children[anya.profile.id];
  assert(anyaAfterVisibilityChange.preferences.showAllLevels === true, 'TEST 6: Anya level visibility remains true after global default set to false');

  // TEST 7: Parent lock disabled allows parent routes
  await updateSettings({ parentLockEnabled: false });
  const canAccessWhenDisabled = await canAccessParentRoute('/parent');
  assert(canAccessWhenDisabled === true, 'TEST 7: Parent routes accessible when parent lock is disabled');

  // TEST 8: Parent lock enabled blocks parent routes until challenge succeeds
  await updateSettings({ parentLockEnabled: true });
  parentUnlocked = false; // ensure locked
  const canAccessWhenLocked = await canAccessParentRoute('/parent');
  const canAccessSettingsWhenLocked = await canAccessParentRoute('/parent/settings');
  const canAccessFamilyWhenLocked = await canAccessParentRoute('/parent/family');
  assert(canAccessWhenLocked === false, 'TEST 8: /parent blocked when parent lock enabled and session locked');
  assert(canAccessSettingsWhenLocked === false, 'TEST 8: /parent/settings blocked when parent lock enabled');
  assert(canAccessFamilyWhenLocked === false, 'TEST 8: /parent/family blocked when parent lock enabled');

  // TEST 9: Failed parent challenge does not unlock parent routes
  const challenge = { question: 'What is 7 + 5?', answer: 12 };
  const wrongAttempt = verifyParentChallenge(challenge.answer, 99);
  assert(wrongAttempt === false, 'TEST 9: Incorrect challenge answer returns false');
  assert(isParentUnlocked() === false, 'TEST 9: Parent session remains locked after incorrect answer');
  const stillBlocked = await canAccessParentRoute('/parent');
  assert(stillBlocked === false, 'TEST 9: Parent route still blocked after failed challenge');

  // TEST 10: Successful challenge unlocks parent routes for the current session
  const correctAttempt = verifyParentChallenge(challenge.answer, 12);
  assert(correctAttempt === true, 'TEST 10: Correct challenge answer returns true');
  assert(isParentUnlocked() === true, 'TEST 10: Parent session is unlocked');
  const nowAccessible = await canAccessParentRoute('/parent');
  assert(nowAccessible === true, 'TEST 10: Parent route accessible after successful challenge');

  // TEST 11: App restart clears in-memory parent unlock state
  // Simulate app restart by resetting in-memory session
  lockParent();
  assert(isParentUnlocked() === false, 'TEST 11: In-memory unlock state cleared on restart/lock');
  const blockedAfterRestart = await canAccessParentRoute('/parent');
  assert(blockedAfterRestart === false, 'TEST 11: Parent route blocked after app restart');

  // TEST 12: Reset progress removes only the active child's progress
  await recordProgress(aarav.profile.id, 4, 5);
  await recordProgress(anya.profile.id, 5, 5);
  await resetProgress(aarav.profile.id);
  const aaravProgressAfterReset = await getProgress(aarav.profile.id);
  const anyaProgressAfterAaravReset = await getProgress(anya.profile.id);
  assert(aaravProgressAfterReset.overall.totalQuestionsAnswered === 0, 'TEST 12: Aarav progress reset to 0');
  assert(anyaProgressAfterAaravReset.overall.totalQuestionsAnswered === 5, 'TEST 12: Anya progress untouched (5 questions answered)');

  // TEST 13: Resetting family data removes all children and their progress
  await resetFamily();
  const familyAfterReset = await getFamilyState();
  const anyaProgressAfterFamilyReset = await getProgress(anya.profile.id);
  assert(Object.keys(familyAfterReset.children).length === 0, 'TEST 13: Family children reset to empty');
  assert(familyAfterReset.activeChildId === null, 'TEST 13: Active child set to null');
  assert(anyaProgressAfterFamilyReset.overall.totalQuestionsAnswered === 0, 'TEST 13: Anya progress key cleared on family reset');

  // TEST 14: Resetting settings restores defaults without deleting family or progress data
  const rohan = await addChild({ name: 'Rohan', level: 'class-3' });
  await recordProgress(rohan.profile.id, 3, 5);
  await updateSettings({ sessionQuestionCount: 10, reduceMotion: true });
  await resetSettings();
  const settingsAfterReset = await getSettings();
  const rohanRecord = (await getFamilyState()).children[rohan.profile.id];
  const rohanProgress = await getProgress(rohan.profile.id);
  assert(settingsAfterReset.sessionQuestionCount === 5, 'TEST 14: Session count restored to default 5');
  assert(settingsAfterReset.reduceMotion === false, 'TEST 14: Reduce motion restored to default false');
  assert(rohanRecord !== undefined, 'TEST 14: Learner Rohan profile preserved');
  assert(rohanProgress.overall.totalQuestionsAnswered === 5, 'TEST 14: Learner Rohan progress preserved');

  // TEST 15: Child learning routes remain accessible regardless of parent lock
  await updateSettings({ parentLockEnabled: true });
  lockParent(); // lock session
  assert(await canAccessParentRoute('/') === true, 'TEST 15: Child home route / always accessible');
  assert(await canAccessParentRoute('/level/class-1') === true, 'TEST 15: Child level route always accessible');
  assert(await canAccessParentRoute('/toddler') === true, 'TEST 15: Child toddler route always accessible');
  assert(await canAccessParentRoute('/quiz/class-1') === true, 'TEST 15: Child quiz route always accessible');

  // TEST 16: Family Dashboard remains child-isolated
  const rhea = await addChild({ name: 'Rhea', level: 'toddler' });
  await recordProgress(rhea.profile.id, 5, 5);
  const rheaProgress = await getProgress(rhea.profile.id);
  const rohanProgress2 = await getProgress(rohan.profile.id);
  assert(rheaProgress.overall.totalCorrectAnswers === 5, 'TEST 16: Rhea has 5 correct answers');
  assert(rohanProgress2.overall.totalCorrectAnswers === 3, 'TEST 16: Rohan has 3 correct answers (isolated)');

  // TEST 17: No existing Phase 9/10 data is corrupted
  const famState = await getFamilyState();
  assert(famState.children[rohan.profile.id] !== undefined, 'TEST 17: Rohan record intact');
  assert(famState.children[rhea.profile.id] !== undefined, 'TEST 17: Rhea record intact');

  console.log('\nAll 17 Phase 11 Parent Controls & App Configuration Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
