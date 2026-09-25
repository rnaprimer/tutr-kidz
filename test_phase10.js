// Phase 10: Family Dashboard & Multi-Child Learning Insights Test Suite

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
const MIGRATION_KEY = 'tutr_kidz_family_migration_v1';
const LEGACY_PROFILE_KEY = 'tutr_kidz_profile';
const LEGACY_PROGRESS_KEY = 'tutr_kidz_progress';

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
  const record = {
    profile: {
      id,
      name: params.name.trim(),
      level: params.level,
      createdAt: now,
      updatedAt: now,
    },
    preferences: {
      dailyQuestionGoal: params.preferences?.dailyQuestionGoal ?? 5,
      showAllLevels: params.preferences?.showAllLevels ?? true,
    },
  };
  const nextChildren = { ...current.children, [id]: record };
  const nextActive = current.activeChildId || id;
  const nextState = { children: nextChildren, activeChildId: nextActive };
  await saveFamilyState(nextState);
  return record;
}

async function setActiveChild(id) {
  const current = await getFamilyState();
  if (!current.children[id]) return;
  await saveFamilyState({ ...current, activeChildId: id });
}

async function removeChild(id) {
  const current = await getFamilyState();
  if (!current.children[id]) return;
  const nextChildren = { ...current.children };
  delete nextChildren[id];
  const remainingIds = Object.keys(nextChildren);
  let nextActive = current.activeChildId;
  if (nextActive === id) {
    nextActive = remainingIds.length > 0 ? remainingIds[0] : null;
  }
  await saveFamilyState({ children: nextChildren, activeChildId: nextActive });
  await storageAdapter.removeItem(`tutr_kidz_progress_${id}`);
}

async function getProgress(childId) {
  const activeId = childId || (await getFamilyState()).activeChildId;
  const key = activeId ? `tutr_kidz_progress_${activeId}` : 'tutr_kidz_progress';
  const raw = await storageAdapter.getItem(key);
  if (!raw) return { topics: {}, overall: { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, totalIncorrectAnswers: 0, quizzesCompleted: 0 } };
  return JSON.parse(raw);
}

async function saveProgress(childId, progress) {
  const activeId = childId || (await getFamilyState()).activeChildId;
  const key = activeId ? `tutr_kidz_progress_${activeId}` : 'tutr_kidz_progress';
  await storageAdapter.setItem(key, JSON.stringify(progress));
}

async function recordQuizResult(childId, params) {
  const current = await getProgress(childId);
  const key = `${params.level}:${params.topic}`;
  const prev = current.topics[key];
  const attempts = (prev?.attempts || 0) + 1;
  const questionsAnswered = (prev?.questionsAnswered || 0) + params.total;
  const correctAnswers = (prev?.correctAnswers || 0) + params.score;
  const incorrectAnswers = (prev?.incorrectAnswers || 0) + Math.max(0, params.total - params.score);

  const updatedRecord = {
    level: params.level,
    topic: params.topic,
    attempts,
    questionsAnswered,
    correctAnswers,
    incorrectAnswers,
    bestScore: params.score,
    bestTotal: params.total,
    lastScore: params.score,
    lastTotal: params.total,
    lastPlayedAt: params.lastPlayedAt || new Date().toISOString(),
  };

  const nextState = {
    topics: { ...current.topics, [key]: updatedRecord },
    overall: {
      totalQuestionsAnswered: current.overall.totalQuestionsAnswered + params.total,
      totalCorrectAnswers: current.overall.totalCorrectAnswers + params.score,
      totalIncorrectAnswers: (current.overall.totalIncorrectAnswers || 0) + Math.max(0, params.total - params.score),
      quizzesCompleted: (current.overall.quizzesCompleted || 0) + 1,
      lastPlayedAt: updatedRecord.lastPlayedAt,
    },
  };
  await saveProgress(childId, nextState);
  return nextState;
}

// Phase 6/7/10 Pure Utilities
function getOverallAccuracy(progress) {
  const total = progress.overall.totalQuestionsAnswered;
  if (!total || total === 0) return 0;
  return Math.round((progress.overall.totalCorrectAnswers / total) * 100);
}

function getTopicAccuracy(record) {
  if (!record || !record.questionsAnswered) return 0;
  return Math.round((record.correctAnswers / record.questionsAnswered) * 100);
}

function getChildInsight(childRecord, progress) {
  const questionsAnswered = progress?.overall?.totalQuestionsAnswered || 0;
  const quizzesCompleted = progress?.overall?.quizzesCompleted || 0;
  const accuracy = getOverallAccuracy(progress);
  const lastPlayedAt = progress?.overall?.lastPlayedAt;

  const topicsStarted = Object.values(progress?.topics || {}).filter(
    (t) => (t?.attempts || 0) > 0
  ).length;

  return {
    childId: childRecord.profile.id,
    name: childRecord.profile.name,
    level: childRecord.profile.level,
    questionsAnswered,
    quizzesCompleted,
    accuracy,
    topicsStarted,
    lastPlayedAt,
  };
}

function getChildSummaries(familyState, progressMap) {
  return Object.values(familyState.children).map((c) => {
    const prog = progressMap[c.profile.id] || { topics: {}, overall: { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, quizzesCompleted: 0 } };
    return getChildInsight(c, prog);
  });
}

function getFamilySummary(childSummaries) {
  return {
    childCount: childSummaries.length,
    totalQuestionsAnswered: childSummaries.reduce((sum, c) => sum + c.questionsAnswered, 0),
    totalQuizzesCompleted: childSummaries.reduce((sum, c) => sum + c.quizzesCompleted, 0),
    activeChildrenCount: childSummaries.filter((c) => c.questionsAnswered > 0).length,
  };
}

function getFamilyRecentActivity(familyState, progressMap) {
  const activities = [];
  for (const child of Object.values(familyState.children)) {
    const prog = progressMap[child.profile.id];
    if (!prog?.topics) continue;
    for (const record of Object.values(prog.topics)) {
      if (record?.attempts >= 1 && record?.lastPlayedAt) {
        activities.push({
          childId: child.profile.id,
          childName: child.profile.name,
          level: record.level,
          topic: record.topic,
          score: record.lastScore,
          total: record.lastTotal,
          lastPlayedAt: record.lastPlayedAt,
        });
      }
    }
  }
  activities.sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime());
  return activities.slice(0, 10);
}

async function runFamilyMigration() {
  const isMigrated = await storageAdapter.getItem(MIGRATION_KEY);
  if (isMigrated === 'true') return false;

  const legacyProfileRaw = await storageAdapter.getItem(LEGACY_PROFILE_KEY);
  if (!legacyProfileRaw) {
    await storageAdapter.setItem(MIGRATION_KEY, 'true');
    return false;
  }

  const legacyProfile = JSON.parse(legacyProfileRaw);
  if (legacyProfile.child && legacyProfile.child.name) {
    const existingFamily = await getFamilyState();
    if (Object.keys(existingFamily.children).length === 0) {
      const childId = generateChildId();
      const now = new Date().toISOString();
      const childRecord = {
        profile: {
          id: childId,
          name: legacyProfile.child.name.trim(),
          level: legacyProfile.child.level,
          createdAt: legacyProfile.child.createdAt || now,
          updatedAt: legacyProfile.child.updatedAt || now,
        },
        preferences: {
          dailyQuestionGoal: legacyProfile.preferences?.dailyQuestionGoal ?? 5,
          showAllLevels: legacyProfile.preferences?.showAllLevels ?? true,
        },
      };
      await saveFamilyState({
        children: { [childId]: childRecord },
        activeChildId: childId,
      });

      const legacyProgressRaw = await storageAdapter.getItem(LEGACY_PROGRESS_KEY);
      if (legacyProgressRaw) {
        await storageAdapter.setItem(`tutr_kidz_progress_${childId}`, legacyProgressRaw);
      }
    }
  }

  await storageAdapter.setItem(MIGRATION_KEY, 'true');
  return true;
}

async function runAllTests() {
  console.log('=== PHASE 10 DATA ISOLATION & FAMILY INSIGHT TESTS ===\n');

  // TEST 1: Empty family returns clean empty state.
  memoryStore = {};
  const emptyState = await getFamilyState();
  const emptySummaries = getChildSummaries(emptyState, {});
  const emptyFamilySummary = getFamilySummary(emptySummaries);
  assert(emptyFamilySummary.childCount === 0, 'TEST 1: Empty family has 0 learners');
  assert(emptyFamilySummary.totalQuestionsAnswered === 0, 'TEST 1: Empty family has 0 questions answered');
  assert(emptyFamilySummary.totalQuizzesCompleted === 0, 'TEST 1: Empty family has 0 quizzes completed');
  assert(emptyFamilySummary.activeChildrenCount === 0, 'TEST 1: Empty family has 0 active children');

  // TEST 2: Create Aarav and Anya.
  const aarav = await addChild({ name: 'Aarav', level: 'class-2', preferences: { dailyQuestionGoal: 10 } });
  const anya = await addChild({ name: 'Anya', level: 'class-1', preferences: { dailyQuestionGoal: 5 } });
  const familyWithTwo = await getFamilyState();
  assert(Object.keys(familyWithTwo.children).length === 2, 'TEST 2: Two children created');
  assert(familyWithTwo.activeChildId === aarav.profile.id, 'TEST 2: Initial active child is Aarav');

  // TEST 3: Record Aarav progress. Verify Anya remains untouched.
  const now = new Date().toISOString();
  await recordQuizResult(aarav.profile.id, {
    level: 'class-2',
    topic: 'multiplication',
    score: 4,
    total: 5,
    lastPlayedAt: now,
  });
  const aaravProgAfterQ1 = await getProgress(aarav.profile.id);
  const anyaProgAfterQ1 = await getProgress(anya.profile.id);
  assert(aaravProgAfterQ1.overall.totalQuestionsAnswered === 5, 'TEST 3: Aarav has 5 questions');
  assert(aaravProgAfterQ1.overall.totalCorrectAnswers === 4, 'TEST 3: Aarav has 4 correct');
  assert(anyaProgAfterQ1.overall.totalQuestionsAnswered === 0, 'TEST 3: Anya has 0 questions (untouched)');
  assert(Object.keys(anyaProgAfterQ1.topics).length === 0, 'TEST 3: Anya has 0 topic records (untouched)');

  // TEST 4: Record Anya progress. Verify Aarav remains unchanged.
  const earlier = new Date(Date.now() - 3600000).toISOString();
  await recordQuizResult(anya.profile.id, {
    level: 'class-1',
    topic: 'addition',
    score: 5,
    total: 5,
    lastPlayedAt: earlier,
  });
  const aaravProgAfterQ2 = await getProgress(aarav.profile.id);
  const anyaProgAfterQ2 = await getProgress(anya.profile.id);
  assert(aaravProgAfterQ2.overall.totalQuestionsAnswered === 5, 'TEST 4: Aarav questions still 5 (unchanged)');
  assert(aaravProgAfterQ2.overall.totalCorrectAnswers === 4, 'TEST 4: Aarav correct still 4 (unchanged)');
  assert(anyaProgAfterQ2.overall.totalQuestionsAnswered === 5, 'TEST 4: Anya questions is 5');
  assert(anyaProgAfterQ2.overall.totalCorrectAnswers === 5, 'TEST 4: Anya correct is 5');

  // TEST 5: Family summary aggregates both children correctly.
  const currentFamily = await getFamilyState();
  const progressMap = {
    [aarav.profile.id]: aaravProgAfterQ2,
    [anya.profile.id]: anyaProgAfterQ2,
  };
  const summaries = getChildSummaries(currentFamily, progressMap);
  const famSummary = getFamilySummary(summaries);
  assert(famSummary.childCount === 2, 'TEST 5: Family has 2 children');
  assert(famSummary.totalQuestionsAnswered === 10, 'TEST 5: Aggregated total questions is 10 (5 + 5)');
  assert(famSummary.totalQuizzesCompleted === 2, 'TEST 5: Aggregated quizzes completed is 2 (1 + 1)');
  assert(famSummary.activeChildrenCount === 2, 'TEST 5: Active children count is 2');

  // TEST 6: Child summary for Aarav contains only Aarav data.
  const aaravSummary = summaries.find((s) => s.childId === aarav.profile.id);
  assert(aaravSummary !== undefined, 'TEST 6: Aarav summary exists');
  assert(aaravSummary.name === 'Aarav', 'TEST 6: Name is Aarav');
  assert(aaravSummary.questionsAnswered === 5, 'TEST 6: Aarav questions is 5');
  assert(aaravSummary.accuracy === 80, 'TEST 6: Aarav accuracy is 80% (4/5)');

  // TEST 7: Child summary for Anya contains only Anya data.
  const anyaSummary = summaries.find((s) => s.childId === anya.profile.id);
  assert(anyaSummary !== undefined, 'TEST 7: Anya summary exists');
  assert(anyaSummary.name === 'Anya', 'TEST 7: Name is Anya');
  assert(anyaSummary.questionsAnswered === 5, 'TEST 7: Anya questions is 5');
  assert(anyaSummary.accuracy === 100, 'TEST 7: Anya accuracy is 100% (5/5)');

  // TEST 8: Family recent activity includes both children with correct names.
  const recentActivities = getFamilyRecentActivity(currentFamily, progressMap);
  assert(recentActivities.length === 2, 'TEST 8: Two recent activities found');
  assert(recentActivities[0].childName === 'Aarav', 'TEST 8: Latest activity is Aarav (Multiplication)');
  assert(recentActivities[0].topic === 'multiplication', 'TEST 8: Topic is multiplication');
  assert(recentActivities[0].score === 4, 'TEST 8: Score is 4');
  assert(recentActivities[1].childName === 'Anya', 'TEST 8: Second activity is Anya (Addition)');
  assert(recentActivities[1].topic === 'addition', 'TEST 8: Topic is addition');
  assert(recentActivities[1].score === 5, 'TEST 8: Score is 5');

  // TEST 9: Viewing Anya's detail page does not change activeChildId.
  const activeBeforeViewingAnya = (await getFamilyState()).activeChildId;
  assert(activeBeforeViewingAnya === aarav.profile.id, 'TEST 9: Active child before viewing Anya is Aarav');
  // Simulating viewing Anya's detail page by querying Anya's data:
  const anyaDetailProgress = await getProgress(anya.profile.id);
  assert(anyaDetailProgress.overall.totalQuestionsAnswered === 5, 'TEST 9: Anya detail progress retrieved');
  const activeAfterViewingAnya = (await getFamilyState()).activeChildId;
  assert(activeAfterViewingAnya === aarav.profile.id, 'TEST 9: Active child remains Aarav (no silent mutation)');

  // TEST 10: Removing Aarav removes Aarav from family insights.
  await removeChild(aarav.profile.id);
  const familyAfterRemoveAarav = await getFamilyState();
  const progressMapAfterRemove = {
    [anya.profile.id]: await getProgress(anya.profile.id),
  };
  const summariesAfterRemove = getChildSummaries(familyAfterRemoveAarav, progressMapAfterRemove);
  const famSummaryAfterRemove = getFamilySummary(summariesAfterRemove);
  assert(famSummaryAfterRemove.childCount === 1, 'TEST 10: Family child count reduced to 1');
  assert(summariesAfterRemove.find((s) => s.childId === aarav.profile.id) === undefined, 'TEST 10: Aarav absent from summaries');

  // TEST 11: Removing Aarav does not affect Anya's progress.
  const anyaProgressAfterAaravRemoved = await getProgress(anya.profile.id);
  assert(anyaProgressAfterAaravRemoved.overall.totalQuestionsAnswered === 5, 'TEST 11: Anya questions preserved at 5');
  assert(anyaProgressAfterAaravRemoved.overall.totalCorrectAnswers === 5, 'TEST 11: Anya correct answers preserved at 5');

  // TEST 12: Adding a new child with no activity shows a clean "Not started" state.
  const baby = await addChild({ name: 'Rohan', level: 'toddler' });
  const rohanProg = await getProgress(baby.profile.id);
  const rohanSummary = getChildInsight(baby, rohanProg);
  assert(rohanSummary.questionsAnswered === 0, 'TEST 12: Rohan questions answered is 0');
  assert(rohanSummary.quizzesCompleted === 0, 'TEST 12: Rohan quizzes completed is 0');
  assert(rohanSummary.accuracy === 0, 'TEST 12: Rohan accuracy is 0');
  assert(rohanSummary.topicsStarted === 0, 'TEST 12: Rohan topics started is 0');
  assert(rohanSummary.lastPlayedAt === undefined, 'TEST 12: Rohan lastPlayedAt is undefined');

  // TEST 13: Phase 9 migration continues to work.
  memoryStore = {};
  const phase8Fixture = {
    child: { name: 'Priya', level: 'class-3', createdAt: '2026-09-24T12:00:00.000Z', updatedAt: '2026-09-24T12:00:00.000Z' },
    preferences: { dailyQuestionGoal: 20, showAllLevels: true },
  };
  await storageAdapter.setItem(LEGACY_PROFILE_KEY, JSON.stringify(phase8Fixture));
  await storageAdapter.setItem(LEGACY_PROGRESS_KEY, JSON.stringify({
    topics: { 'class-3:fractions': { attempts: 1, questionsAnswered: 5, correctAnswers: 4, bestScore: 4, bestTotal: 5, lastScore: 4, lastTotal: 5, lastPlayedAt: '2026-09-24T12:05:00.000Z' } },
    overall: { totalQuestionsAnswered: 5, totalCorrectAnswers: 4, quizzesCompleted: 1 },
  }));
  const migrationSuccess = await runFamilyMigration();
  assert(migrationSuccess === true, 'TEST 13: Phase 9 migration executed successfully');
  const migratedFam = await getFamilyState();
  assert(Object.keys(migratedFam.children).length === 1, 'TEST 13: One migrated child created');
  const priyaId = migratedFam.activeChildId;
  const priyaProg = await getProgress(priyaId);
  assert(priyaProg.overall.totalQuestionsAnswered === 5, 'TEST 13: Migrated progress preserved');

  // TEST 14: Existing Phase 6/7 progress utilities continue working.
  const priyaAccuracy = getOverallAccuracy(priyaProg);
  assert(priyaAccuracy === 80, 'TEST 14: Overall accuracy calculation returns 80%');
  const priyaTopicAcc = getTopicAccuracy(priyaProg.topics['class-3:fractions']);
  assert(priyaTopicAcc === 80, 'TEST 14: Topic accuracy calculation returns 80%');

  console.log('\nAll 14 Phase 10 Data Isolation & Family Insight Tests Passed Successfully!');
}

runAllTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
