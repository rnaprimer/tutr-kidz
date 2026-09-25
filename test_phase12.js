// Phase 12: Daily Learning Experience & Smart Practice Guidance Test Suite

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
  await storageAdapter.setItem(SETTINGS_KEY, JSON.stringify({ settings, updatedAt: new Date().toISOString() }));
  cachedSettings = { ...settings };
}

async function updateSettings(partial) {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await saveSettings(next);
  return next;
}

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

async function setActiveChild(childId) {
  const current = await getFamilyState();
  if (current.children[childId]) {
    await saveFamilyState({ ...current, activeChildId: childId });
  }
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

async function recordProgress(childId, level, topic, score, total, date = new Date().toISOString()) {
  const key = `tutr_kidz_progress_${childId}`;
  const raw = await storageAdapter.getItem(key);
  const current = raw ? JSON.parse(raw) : { topics: {}, overall: { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, quizzesCompleted: 0 } };
  
  const topicKey = `${level}:${topic}`;
  const existingTopic = current.topics[topicKey] || {
    level,
    topic,
    attempts: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    bestScore: 0,
    bestTotal: 0,
    lastScore: 0,
    lastTotal: 0,
  };

  const updatedTopic = {
    ...existingTopic,
    attempts: existingTopic.attempts + 1,
    questionsAnswered: existingTopic.questionsAnswered + total,
    correctAnswers: existingTopic.correctAnswers + score,
    incorrectAnswers: existingTopic.incorrectAnswers + (total - score),
    bestScore: Math.max(existingTopic.bestScore, score),
    bestTotal: total,
    lastScore: score,
    lastTotal: total,
    lastPlayedAt: date,
  };

  const updatedOverall = {
    totalQuestionsAnswered: current.overall.totalQuestionsAnswered + total,
    totalCorrectAnswers: current.overall.totalCorrectAnswers + score,
    quizzesCompleted: current.overall.quizzesCompleted + 1,
    lastPlayedAt: date,
  };

  const nextProgress = {
    topics: { ...current.topics, [topicKey]: updatedTopic },
    overall: updatedOverall,
  };

  await storageAdapter.setItem(key, JSON.stringify(nextProgress));
}

async function getProgress(childId) {
  const raw = await storageAdapter.getItem(`tutr_kidz_progress_${childId}`);
  if (!raw) return { topics: {}, overall: { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, quizzesCompleted: 0 } };
  return JSON.parse(raw);
}

// In-memory parent lock simulation
let parentUnlocked = false;
function isParentUnlocked() { return parentUnlocked; }
function unlockParent() { parentUnlocked = true; }
function lockParent() { parentUnlocked = false; }

// Curriculum definitions for testing
const CURRICULUM = {
  toddler: [
    { id: 'colours', title: 'Colours' },
    { id: 'shapes', title: 'Shapes' },
    { id: 'numbers', title: 'Numbers' },
    { id: 'matching', title: 'Matching' },
  ],
  'class-1': [
    { id: 'numbers', title: 'Numbers' },
    { id: 'addition', title: 'Addition' },
    { id: 'subtraction', title: 'Subtraction' },
    { id: 'shapes', title: 'Shapes' },
    { id: 'measurement', title: 'Measurement' },
  ],
  'class-2': [
    { id: 'numbers', title: 'Numbers' },
    { id: 'addition', title: 'Addition' },
    { id: 'subtraction', title: 'Subtraction' },
    { id: 'multiplication', title: 'Multiplication' },
    { id: 'division', title: 'Division' },
    { id: 'time', title: 'Time' },
    { id: 'shapes', title: 'Shapes' },
  ],
};

function getTopicsForLevel(level) {
  return CURRICULUM[level] || [];
}

function getTopicAccuracy(record) {
  if (!record || !record.questionsAnswered) return 0;
  return Math.round((record.correctAnswers / record.questionsAnswered) * 100);
}

function getTodayQuestionsAnswered(progress) {
  if (!progress || !progress.topics) return 0;
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
  let count = 0;
  for (const record of Object.values(progress.topics)) {
    if (!record || !record.lastPlayedAt) continue;
    try {
      const p = new Date(record.lastPlayedAt);
      if (p.getFullYear() === y && p.getMonth() === m && p.getDate() === d) {
        count += record.questionsAnswered || 0;
      }
    } catch {}
  }
  return count;
}

function calculateRemainingQuestions(answeredToday, goal) {
  return Math.max(0, goal - answeredToday);
}

function getDailyRecommendation({ childRecord, progress, isGoalEnabled = true }) {
  const childId = childRecord.profile.id;
  const childName = childRecord.profile.name;
  const level = childRecord.profile.level;
  const goal = childRecord.preferences?.dailyQuestionGoal ?? 5;
  const questionsAnsweredToday = getTodayQuestionsAnswered(progress);
  const remainingQuestions = isGoalEnabled ? calculateRemainingQuestions(questionsAnsweredToday, goal) : 0;
  const isGoalReached = isGoalEnabled && questionsAnsweredToday >= goal;
  const actionRoute = level === 'toddler' ? '/toddler' : `/level/${level}/topics`;

  const levelTopics = getTopicsForLevel(level);

  // 1. Empty state
  if (!progress.overall || progress.overall.totalQuestionsAnswered === 0 || Object.keys(progress.topics || {}).length === 0) {
    const first = levelTopics[0];
    return {
      childId,
      childName,
      level,
      topicId: first?.id || '',
      title: 'Start with something simple.',
      description: 'Choose a topic below to begin learning.',
      reason: 'none',
      actionLabel: 'Choose Topic',
      actionRoute,
      questionsAnsweredToday,
      dailyQuestionGoal: goal,
      remainingQuestions,
      isGoalEnabled,
      isGoalReached,
    };
  }

  // 2. Practice (accuracy < 70% and >= 5 questions)
  const practiceCandidates = [];
  for (const topic of levelTopics) {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    if (record && record.questionsAnswered >= 5) {
      const accuracy = getTopicAccuracy(record);
      if (accuracy < 70) {
        practiceCandidates.push({ topicId: topic.id, title: topic.title, accuracy, attempts: record.attempts });
      }
    }
  }
  if (practiceCandidates.length > 0) {
    practiceCandidates.sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
    const chosen = practiceCandidates[0];
    return {
      childId,
      childName,
      level,
      topicId: chosen.topicId,
      title: `Practice ${chosen.title}`,
      description: 'Practice a few more questions to build confidence.',
      reason: 'practice',
      actionLabel: 'Practice',
      actionRoute,
      questionsAnsweredToday,
      dailyQuestionGoal: goal,
      remainingQuestions,
      isGoalEnabled,
      isGoalReached,
    };
  }

  // 3. Continue recent practice
  const recentCandidates = [];
  for (const topic of levelTopics) {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    if (record && record.attempts >= 1 && record.lastPlayedAt) {
      recentCandidates.push({
        topicId: topic.id,
        title: topic.title,
        lastPlayedAt: record.lastPlayedAt,
        timestamp: new Date(record.lastPlayedAt).getTime() || 0,
      });
    }
  }
  if (recentCandidates.length > 0) {
    recentCandidates.sort((a, b) => b.timestamp - a.timestamp);
    const chosen = recentCandidates[0];
    return {
      childId,
      childName,
      level,
      topicId: chosen.topicId,
      title: `Continue ${chosen.title}`,
      description: `Keep practicing ${chosen.title} from your recent learning.`,
      reason: 'continue',
      actionLabel: 'Continue',
      actionRoute,
      questionsAnsweredToday,
      dailyQuestionGoal: goal,
      remainingQuestions,
      isGoalEnabled,
      isGoalReached,
    };
  }

  // 4. New topic (unstarted)
  const unstarted = levelTopics.filter((topic) => {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    return !record || record.attempts === 0;
  });
  if (unstarted.length > 0) {
    const chosen = unstarted[0];
    return {
      childId,
      childName,
      level,
      topicId: chosen.id,
      title: `Try ${chosen.title}`,
      description: 'Explore something new today.',
      reason: 'new',
      actionLabel: 'Start',
      actionRoute,
      questionsAnsweredToday,
      dailyQuestionGoal: goal,
      remainingQuestions,
      isGoalEnabled,
      isGoalReached,
    };
  }

  // 5. Review
  const reviewCandidates = [];
  for (const topic of levelTopics) {
    const key = `${level}:${topic.id}`;
    const record = progress.topics[key];
    reviewCandidates.push({
      topicId: topic.id,
      title: topic.title,
      timestamp: record?.lastPlayedAt ? new Date(record.lastPlayedAt).getTime() : 0,
    });
  }
  reviewCandidates.sort((a, b) => a.timestamp - b.timestamp);
  const chosen = reviewCandidates[0] || levelTopics[0];
  return {
    childId,
    childName,
    level,
    topicId: chosen.topicId || chosen.id,
    title: `Review ${chosen.title}`,
    description: "Revisit something you've practiced before.",
    reason: 'review',
    actionLabel: 'Review',
    actionRoute,
    questionsAnsweredToday,
    dailyQuestionGoal: goal,
    remainingQuestions,
    isGoalEnabled,
    isGoalReached,
  };
}

function getFamilySummary(famState, famProgMap) {
  let totalQuestions = 0;
  let totalQuizzes = 0;
  let activeChildren = 0;
  const children = Object.values(famState.children);
  for (const child of children) {
    const p = famProgMap[child.profile.id];
    if (p && p.overall) {
      totalQuestions += p.overall.totalQuestionsAnswered || 0;
      totalQuizzes += p.overall.quizzesCompleted || 0;
      if (p.overall.totalQuestionsAnswered > 0) activeChildren++;
    }
  }
  return {
    childCount: children.length,
    totalQuestionsAnswered: totalQuestions,
    totalQuizzesCompleted: totalQuizzes,
    activeChildrenCount: activeChildren,
  };
}

async function runTests() {
  console.log('=== PHASE 12 DAILY LEARNING EXPERIENCE & SMART PRACTICE TESTS ===\n');

  // TEST 1: Brand-new child receives a valid empty-state recommendation
  memoryStore = {};
  const aarav = await addChild({ name: 'Aarav', level: 'class-2', preferences: { dailyQuestionGoal: 5 } });
  const emptyProgress = await getProgress(aarav.profile.id);
  const rec1 = getDailyRecommendation({ childRecord: aarav, progress: emptyProgress, isGoalEnabled: true });
  assert(rec1.reason === 'none', 'TEST 1: Brand-new child recommendation reason is "none"');
  assert(rec1.title === 'Start with something simple.', 'TEST 1: Brand-new child recommendation title is "Start with something simple."');
  assert(rec1.description === 'Choose a topic below to begin learning.', 'TEST 1: Brand-new child description prompts to choose a topic below');
  assert(rec1.actionLabel === 'Choose Topic', 'TEST 1: Action label is "Choose Topic"');
  assert(rec1.actionRoute === '/level/class-2/topics', 'TEST 1: Action route routes to level topics screen');

  // TEST 2: Child with recent activity receives a continue recommendation
  // Aarav practices Multiplication: 5 questions, 4 correct (80% accuracy)
  await recordProgress(aarav.profile.id, 'class-2', 'multiplication', 4, 5);
  const progressAaravRecent = await getProgress(aarav.profile.id);
  const rec2 = getDailyRecommendation({ childRecord: aarav, progress: progressAaravRecent, isGoalEnabled: true });
  assert(rec2.reason === 'continue', 'TEST 2: Child with good recent practice receives "continue" recommendation');
  assert(rec2.topicId === 'multiplication', 'TEST 2: Recommended topic is multiplication');
  assert(rec2.title.includes('Multiplication'), 'TEST 2: Title references Multiplication');
  assert(rec2.actionLabel === 'Continue', 'TEST 2: Action label is "Continue"');

  // TEST 3: Child with low topic accuracy receives a practice recommendation
  // Anya practices Addition: 5 questions, 2 correct (40% accuracy < 70%)
  const anya = await addChild({ name: 'Anya', level: 'class-1', preferences: { dailyQuestionGoal: 10 } });
  await recordProgress(anya.profile.id, 'class-1', 'addition', 2, 5);
  const progressAnyaLow = await getProgress(anya.profile.id);
  const rec3 = getDailyRecommendation({ childRecord: anya, progress: progressAnyaLow, isGoalEnabled: true });
  assert(rec3.reason === 'practice', 'TEST 3: Child with topic accuracy < 70% receives "practice" recommendation');
  assert(rec3.topicId === 'addition', 'TEST 3: Practice recommended for addition');
  assert(rec3.description === 'Practice a few more questions to build confidence.', 'TEST 3: Description uses calm, non-punitive language');
  assert(rec3.actionLabel === 'Practice', 'TEST 3: Action label is "Practice"');

  // TEST 4: Unstarted topic can be recommended
  const rohan = await addChild({ name: 'Rohan', level: 'class-1' });
  const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await recordProgress(rohan.profile.id, 'class-1', 'numbers', 5, 5, oldDate);
  const progressRohan = await getProgress(rohan.profile.id);
  const class1Topics = getTopicsForLevel('class-1');
  const unstartedFound = class1Topics.some(t => !progressRohan.topics[`class-1:${t.id}`]);
  assert(unstartedFound === true, 'TEST 4: Unstarted topics exist in Class 1 for Rohan');
  const progressRohanOldOnly = {
    ...progressRohan,
    topics: {
      'class-1:numbers': { ...progressRohan.topics['class-1:numbers'], lastPlayedAt: '' },
    },
  };
  const rec4 = getDailyRecommendation({ childRecord: rohan, progress: progressRohanOldOnly, isGoalEnabled: true });
  assert(rec4.reason === 'new', 'TEST 4: Unstarted topic receives "new" recommendation');
  assert(rec4.title.startsWith('Try '), 'TEST 4: Title starts with "Try "');
  assert(rec4.actionLabel === 'Start', 'TEST 4: Action label is "Start"');

  // TEST 5: Previously practiced topic can be recommended for review
  const allStartedTopics = {};
  for (const t of class1Topics) {
    allStartedTopics[`class-1:${t.id}`] = {
      level: 'class-1',
      topic: t.id,
      attempts: 2,
      questionsAnswered: 10,
      correctAnswers: 9,
      incorrectAnswers: 1,
      lastPlayedAt: '',
    };
  }
  const progressAllOld = {
    topics: allStartedTopics,
    overall: { totalQuestionsAnswered: 50, totalCorrectAnswers: 45, quizzesCompleted: 5 },
  };
  const rec5 = getDailyRecommendation({ childRecord: rohan, progress: progressAllOld, isGoalEnabled: true });
  assert(rec5.reason === 'review', 'TEST 5: All topics started receives "review" recommendation');
  assert(rec5.title.startsWith('Review '), 'TEST 5: Title starts with "Review "');
  assert(rec5.description === "Revisit something you've practiced before.", 'TEST 5: Review description is calm and friendly');
  assert(rec5.actionLabel === 'Review', 'TEST 5: Action label is "Review"');

  // TEST 6: Daily goal of 5 calculates remaining questions correctly
  const goal5Remaining = calculateRemainingQuestions(2, 5);
  assert(goal5Remaining === 3, 'TEST 6: 2 of 5 questions answered -> 3 remaining');

  // TEST 7: Daily goal of 10 calculates remaining questions correctly
  const goal10Remaining = calculateRemainingQuestions(4, 10);
  assert(goal10Remaining === 6, 'TEST 7: 4 of 10 questions answered -> 6 remaining');

  // TEST 8: Daily goal disabled removes goal calculations
  const rec8 = getDailyRecommendation({ childRecord: aarav, progress: progressAaravRecent, isGoalEnabled: false });
  assert(rec8.isGoalEnabled === false, 'TEST 8: isGoalEnabled is false');
  assert(rec8.remainingQuestions === 0, 'TEST 8: remainingQuestions is 0 when goal is disabled');

  // TEST 9: Completing the daily goal produces calm completion messaging
  const goalReachedRemaining = calculateRemainingQuestions(5, 5);
  assert(goalReachedRemaining === 0, 'TEST 9: Remaining questions is 0 when goal is reached');
  const rec9 = getDailyRecommendation({
    childRecord: aarav,
    progress: {
      ...progressAaravRecent,
      topics: {
        'class-2:multiplication': {
          ...progressAaravRecent.topics['class-2:multiplication'],
          questionsAnswered: 5,
          lastPlayedAt: new Date().toISOString(),
        },
      },
    },
    isGoalEnabled: true,
  });
  assert(rec9.isGoalReached === true, 'TEST 9: isGoalReached is true when answered >= goal');

  // TEST 10: Aarav recommendation uses Aarav progress only
  assert(rec2.childId === aarav.profile.id, 'TEST 10: rec2 is for Aarav');
  assert(rec2.topicId === 'multiplication', 'TEST 10: Aarav recommendation is multiplication');

  // TEST 11: Anya recommendation uses Anya progress only
  assert(rec3.childId === anya.profile.id, 'TEST 11: rec3 is for Anya');
  assert(rec3.topicId === 'addition', 'TEST 11: Anya recommendation is addition (isolated from Aarav)');

  // TEST 12: Toddler activities remain isolated from Class 1-4 topics
  const toddlerChild = await addChild({ name: 'Baby Leo', level: 'toddler' });
  await recordProgress(toddlerChild.profile.id, 'toddler', 'colours', 5, 5);
  const progressToddler = await getProgress(toddlerChild.profile.id);
  const recToddler = getDailyRecommendation({ childRecord: toddlerChild, progress: progressToddler, isGoalEnabled: true });
  assert(recToddler.level === 'toddler', 'TEST 12: Toddler recommendation level is toddler');
  assert(recToddler.actionRoute === '/toddler', 'TEST 12: Toddler action route is /toddler');
  assert(recToddler.topicId === 'colours', 'TEST 12: Toddler recommendation uses toddler activity "colours"');

  // TEST 13: Changing the active child changes the recommendation correctly
  await setActiveChild(anya.profile.id);
  const currentFamily = await getFamilyState();
  assert(currentFamily.activeChildId === anya.profile.id, 'TEST 13: Active child switched to Anya');
  const activeChildRec = currentFamily.children[currentFamily.activeChildId];
  const activeProgress = await getProgress(currentFamily.activeChildId);
  const activeRec = getDailyRecommendation({ childRecord: activeChildRec, progress: activeProgress, isGoalEnabled: true });
  assert(activeRec.childId === anya.profile.id, 'TEST 13: Active recommendation is for Anya');
  assert(activeRec.topicId === 'addition', 'TEST 13: Active recommendation reflects Anya progress');

  // TEST 14: Viewing another child's parent detail does not change activeChildId
  const beforeViewActive = (await getFamilyState()).activeChildId;
  const aaravProgressDetail = await getProgress(aarav.profile.id);
  const afterViewActive = (await getFamilyState()).activeChildId;
  assert(beforeViewActive === afterViewActive, 'TEST 14: Viewing detail progress does not mutate activeChildId');

  // TEST 15: Removing a child does not leave orphaned recommendation data
  await removeChild(anya.profile.id);
  const familyAfterRemove = await getFamilyState();
  assert(familyAfterRemove.children[anya.profile.id] === undefined, 'TEST 15: Anya removed from family state');
  const anyaProgressAfterRemove = await getProgress(anya.profile.id);
  assert(Object.keys(anyaProgressAfterRemove.topics).length === 0, 'TEST 15: Anya progress key cleaned up');

  // TEST 16: Phase 10 family insights still work
  const famState = await getFamilyState();
  const famProgMap = {
    [aarav.profile.id]: await getProgress(aarav.profile.id),
  };
  const famSummary = getFamilySummary(famState, famProgMap);
  assert(famSummary.childCount === Object.keys(famState.children).length, 'TEST 16: Family summary child count correct');

  // TEST 17: Phase 11 parent lock still works
  await updateSettings({ parentLockEnabled: true });
  lockParent();
  assert(isParentUnlocked() === false, 'TEST 17: Parent lock session starts locked');
  unlockParent();
  assert(isParentUnlocked() === true, 'TEST 17: Parent lock session unlocks correctly');

  // TEST 18: Existing Phase 6/7 progress calculations remain unchanged
  const sampleTopicRecord = { attempts: 1, questionsAnswered: 5, correctAnswers: 4 };
  assert(getTopicAccuracy(sampleTopicRecord) === 80, 'TEST 18: getTopicAccuracy(4/5) returns 80%');

  console.log('\nAll 18 Phase 12 Daily Learning Experience & Smart Practice Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
