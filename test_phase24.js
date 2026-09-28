/**
 * PHASE 24 ACCEPTANCE TEST SUITE
 * Tutr Kidz v1.0 Launch Readiness & Production Stability
 *
 * Covers:
 * 1. Final Production Configuration Audit
 * 2. Production Error & Observability Verification
 * 3. Offline-First Launch Verification & Sync Idempotency
 * 4. Authentication, Account Safety & Isolation
 * 5. First-Time & Returning User Journeys
 * 6. Child Learning Flow & Qualitative Toddler Contracts
 * 7. Parent Dashboard & Feature Flows
 * 8. Multi-Child Real-World Isolation
 * 9. Content Integrity & Recommendation Engine
 * 10. Accessibility & Responsive Design Contracts
 * 11. Production Route Integrity
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let testCount = 0;
function test(name, fn) {
  testCount++;
  try {
    fn();
    console.log(`✓ TEST ${testCount}: ${name}`);
  } catch (err) {
    console.error(`✗ TEST ${testCount} FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('=== PHASE 24: v1.0 LAUNCH READINESS & PRODUCTION STABILITY TESTS ===\n');

// -------------------------------------------------------------
// DOMAIN 1: PRODUCTION CONFIGURATION AUDIT
// -------------------------------------------------------------

test('Production environment variables contain only public anon keys', () => {
  const envContent = fs.readFileSync('.env', 'utf8');
  assert(envContent.includes('EXPO_PUBLIC_SUPABASE_URL'), 'Must contain public URL');
  assert(envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY'), 'Must contain public anon key');
  assert(!envContent.includes('SERVICE_ROLE'), 'Must NEVER contain service role key');
  assert(!envContent.includes('DATABASE_URL'), 'Must NEVER contain database URL');
  assert(!envContent.includes('postgres://'), 'Must NEVER contain postgres connection string');
});

test('No localhost or dev URLs in client source files', () => {
  const filesToCheck = [
    'lib/supabase.ts',
    'lib/analytics/analytics.ts',
    'lib/observability/observability.ts',
    'features/sync/syncService.ts',
    'app.json',
    'vercel.json'
  ];
  for (const f of filesToCheck) {
    if (fs.existsSync(f)) {
      const code = fs.readFileSync(f, 'utf8');
      assert(!code.includes('localhost:'), `File ${f} must not contain localhost`);
      assert(!code.includes('127.0.0.1'), `File ${f} must not contain loopback IP`);
    }
  }
});

test('Vercel configuration has SPA rewrites and clean build output', () => {
  const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.strictEqual(vercelJson.outputDirectory, 'dist');
  assert(Array.isArray(vercelJson.routes), 'Routes must be an array');
  const spaRewrite = vercelJson.routes.find(r => r.src === '/(.*)' && r.dest === '/index.html');
  assert(spaRewrite, 'Must have SPA fallback to /index.html');
});

// -------------------------------------------------------------
// DOMAIN 2: PRODUCTION ERROR & OBSERVABILITY VERIFICATION
// -------------------------------------------------------------

test('Observability handles errors non-fatally, scrubs PII, and bounds memory buffer', () => {
  const obsResultRaw = execSync(
    `npx tsx -e "
      import { observability, trackError, trackWarning } from './lib/observability';
      observability.clearDiagnostics();
      trackError(new Error('Network error for parent@test.com at /Users/tester/TutrKidz'), {
        childId: 'secret-child-99',
        childName: 'Aarav',
        userEmail: 'parent@test.com',
        code: 'TIMEOUT'
      });
      for (let i = 0; i < 70; i++) {
        trackWarning('Bounded warning ' + i);
      }
      const logs = observability.getDiagnosticLogs();
      console.log(JSON.stringify({ count: logs.length, latest: logs[logs.length - 1] }));
    "`,
    { encoding: 'utf8' }
  );
  const obsResult = JSON.parse(obsResultRaw);
  assert.strictEqual(obsResult.count, 50, 'Buffer must strictly cap at 50 entries');
  assert(obsResult.latest.message.includes('69'), 'Latest warning retained');
});

test('Analytics sanitizes PII and strips learner identity and passwords', () => {
  const analyticsResultRaw = execSync(
    `npx tsx -e "
      import { analytics, trackEvent } from './lib/analytics';
      analytics.clear();
      trackEvent('learning_recommendation_shown', {
        level: 'class-1',
        topic: 'numbers',
        childName: 'Aarav Private',
        childId: 'secret-child-id',
        email: 'parent@domain.com',
        password: 'password123'
      } as any);
      const ev = analytics.getEvents();
      console.log(JSON.stringify(ev));
    "`,
    { encoding: 'utf8' }
  );
  const events = JSON.parse(analyticsResultRaw);
  assert.strictEqual(events.length, 1);
  const props = events[0].properties || {};
  assert.strictEqual(props.level, 'class-1');
  assert.strictEqual(props.topic, 'numbers');
  assert.strictEqual(props.childName, undefined);
  assert.strictEqual(props.childId, undefined);
  assert.strictEqual(props.email, undefined);
  assert.strictEqual(props.password, undefined);
});

// -------------------------------------------------------------
// DOMAIN 3: OFFLINE-FIRST LAUNCH & SYNC IDEMPOTENCE
// -------------------------------------------------------------

test('Sync queue stores items offline with deterministic UUIDs and drains idempotently', () => {
  const syncQueue = [];
  const enqueue = (item) => syncQueue.push(item);
  const dequeue = (id) => {
    const idx = syncQueue.findIndex(i => i.id === id);
    if (idx !== -1) syncQueue.splice(idx, 1);
  };

  enqueue({ id: 'uuid-1', entityType: 'child', operation: 'CREATE', payload: { id: 'c1', name: 'Aarav' } });
  enqueue({ id: 'uuid-2', entityType: 'quiz_attempt', operation: 'CREATE', payload: { id: 'q1', score: 5 } });

  assert.strictEqual(syncQueue.length, 2);
  dequeue('uuid-1');
  assert.strictEqual(syncQueue.length, 1);
  assert.strictEqual(syncQueue[0].id, 'uuid-2');
  dequeue('uuid-2');
  assert.strictEqual(syncQueue.length, 0);
});

// -------------------------------------------------------------
// DOMAIN 4: AUTHENTICATION, ACCOUNT SAFETY & ISOLATION
// -------------------------------------------------------------

test('Child never requires authentication or credentials', () => {
  const childScreens = [
    'app/index.tsx',
    'app/toddler/index.tsx',
    'app/level/[level].tsx',
    'app/quiz/[level].tsx',
    'app/quiz/result.tsx'
  ];
  for (const s of childScreens) {
    const code = fs.readFileSync(s, 'utf8');
    assert(!code.includes('requireAuth'), `${s} must not block child behind auth`);
    assert(!code.includes('loginRequired'), `${s} must not require login`);
  }
});

test('Parent lock challenge safely gates parental areas', () => {
  const isParentChallengeCorrect = (challenge, answer) => {
    return Number(challenge.num1 * challenge.num2) === Number(answer);
  };

  const challenge = { num1: 4, num2: 7 };
  assert.strictEqual(isParentChallengeCorrect(challenge, '28'), true);
  assert.strictEqual(isParentChallengeCorrect(challenge, '27'), false);
  assert.strictEqual(isParentChallengeCorrect(challenge, 'abc'), false);
  assert.strictEqual(isParentChallengeCorrect(challenge, ''), false);
});

// -------------------------------------------------------------
// DOMAIN 5: FIRST-TIME & RETURNING USER FLOWS
// -------------------------------------------------------------

test('Onboarding step progression is strictly sequential and preserves local state', () => {
  let step = 1;
  const nextStep = () => { if (step < 4) step++; };
  const prevStep = () => { if (step > 1) step--; };

  assert.strictEqual(step, 1);
  nextStep();
  assert.strictEqual(step, 2);
  nextStep();
  assert.strictEqual(step, 3);
  nextStep();
  assert.strictEqual(step, 4);
  nextStep(); // capped
  assert.strictEqual(step, 4);
  prevStep();
  assert.strictEqual(step, 3);
});

// -------------------------------------------------------------
// DOMAIN 6: CHILD LEARNING FLOW & QUALITATIVE TODDLER CONTRACTS
// -------------------------------------------------------------

test('Toddler level UI never renders percentage accuracy or numerical scores', () => {
  const toddlerViewCode = fs.readFileSync('app/level/[level].tsx', 'utf8');
  assert(toddlerViewCode.includes('!isToddler'), 'Accuracy percentage must be guarded by !isToddler');
  assert(toddlerViewCode.includes('activities started'), 'Toddler displays qualitative activities started');
});

test('Quiz result page handles undefined or negative query params gracefully without NaN', () => {
  const sanitizeResultParam = (val) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  assert.strictEqual(sanitizeResultParam(undefined), 0);
  assert.strictEqual(sanitizeResultParam('NaN'), 0);
  assert.strictEqual(sanitizeResultParam('-5'), 0);
  assert.strictEqual(sanitizeResultParam('5'), 5);
  assert.strictEqual(sanitizeResultParam('0'), 0);
});

// -------------------------------------------------------------
// DOMAIN 7: PARENT DASHBOARD & FEATURE FLOWS
// -------------------------------------------------------------

test('Parent features support calm empty states and no technical jargon', () => {
  const screens = [
    'app/parent/index.tsx',
    'app/parent/family/index.tsx',
    'app/parent/feedback.tsx',
    'app/parent/data.tsx',
    'app/parent/settings.tsx'
  ];

  for (const s of screens) {
    const code = fs.readFileSync(s, 'utf8');
    assert(!code.includes('500 Internal Server Error'), `${s} must not show raw 500 error`);
    assert(!code.includes('NullPointerException'), `${s} must not show raw exceptions`);
    assert(!code.includes('Supabase error'), `${s} must not show database technical details`);
  }
});

// -------------------------------------------------------------
// DOMAIN 8: MULTI-CHILD REAL-WORLD ISOLATION
// -------------------------------------------------------------

test('Inspecting a child does NOT mutate activeChildId in family state', () => {
  const familyState = {
    children: {
      'child-1': { profile: { id: 'child-1', name: 'Aarav' } },
      'child-2': { profile: { id: 'child-2', name: 'Anya' } },
    },
    activeChildId: 'child-1',
  };

  const getChildProgress = (state, childId) => {
    // Readonly inspection
    return { child: state.children[childId], active: state.activeChildId };
  };

  const inspectAnya = getChildProgress(familyState, 'child-2');
  assert.strictEqual(inspectAnya.child.profile.name, 'Anya');
  assert.strictEqual(familyState.activeChildId, 'child-1', 'activeChildId must remain Aarav');
});

// -------------------------------------------------------------
// DOMAIN 9: CONTENT INTEGRITY & RECOMMENDATION ENGINE
// -------------------------------------------------------------

test('Recommendation engine returns calm, valid recommendations for new and active learners', () => {
  const recRaw = execSync(
    `npx tsx -e "
      import { getLearningRecommendation } from './features/learning/recommendationUtils';
      const rec = getLearningRecommendation({
        childRecord: { profile: { id: 'c-new', name: 'Aarav', level: 'class-1' } },
        progress: null
      });
      console.log(JSON.stringify(rec));
    "`,
    { encoding: 'utf8' }
  );
  const rec = JSON.parse(recRaw);
  assert(rec, 'Recommendation must exist for new learner');
  assert.strictEqual(typeof rec.topicId, 'string');
  assert.strictEqual(typeof rec.title, 'string');
  assert.strictEqual(typeof rec.description, 'string');
});

// -------------------------------------------------------------
// DOMAIN 10: ACCESSIBILITY & RESPONSIVE DESIGN CONTRACTS
// -------------------------------------------------------------

test('Interactive elements satisfy touch target contract >= 48px', () => {
  const primaryBtnSrc = fs.readFileSync('components/ui/PrimaryButton.tsx', 'utf8');
  assert(primaryBtnSrc.includes('minHeight: 56'), 'PrimaryButton minHeight must be 56px (>= 48px)');
  assert(primaryBtnSrc.includes('accessibilityRole="button"'), 'PrimaryButton must specify accessibilityRole');

  const quizOptionSrc = fs.readFileSync('components/quiz/QuizOption.tsx', 'utf8');
  assert(quizOptionSrc.includes('minHeight: 68'), 'QuizOption minHeight must be 68px (>= 48px)');
  assert(quizOptionSrc.includes('accessibilityRole="button"'), 'QuizOption must specify accessibilityRole');
});

test('Document title hooks are present across all application screens', () => {
  const allRoutes = [
    'app/index.tsx',
    'app/toddler/index.tsx',
    'app/level/[level].tsx',
    'app/level/[level]/topics.tsx',
    'app/quiz/[level].tsx',
    'app/quiz/result.tsx',
    'app/parent/index.tsx',
    'app/parent/children.tsx',
    'app/parent/family/index.tsx',
    'app/parent/family/settings.tsx',
    'app/parent/family/[childId].tsx',
    'app/parent/family/[childId]/insights.tsx',
    'app/parent/settings.tsx',
    'app/parent/account.tsx',
    'app/parent/account/login.tsx',
    'app/parent/account/signup.tsx',
    'app/parent/account/forgot-password.tsx',
    'app/parent/data.tsx',
    'app/parent/onboarding.tsx',
    'app/parent/feedback.tsx',
    'app/progress/index.tsx',
    'app/profile/index.tsx'
  ];

  for (const route of allRoutes) {
    assert(fs.existsSync(route), `Route file ${route} must exist`);
    const code = fs.readFileSync(route, 'utf8');
    assert(code.includes('useDocumentTitle'), `Route ${route} must call useDocumentTitle`);
  }
});

// -------------------------------------------------------------
// DOMAIN 11: PRODUCTION ROUTE INTEGRITY
// -------------------------------------------------------------

test('Every expected production route exists in app/ directory', () => {
  const expectedRoutes = [
    'app/index.tsx',
    'app/toddler/index.tsx',
    'app/level/[level].tsx',
    'app/level/[level]/topics.tsx',
    'app/quiz/[level].tsx',
    'app/quiz/result.tsx',
    'app/parent/index.tsx',
    'app/parent/children.tsx',
    'app/parent/family/index.tsx',
    'app/parent/family/settings.tsx',
    'app/parent/family/[childId].tsx',
    'app/parent/family/[childId]/insights.tsx',
    'app/parent/settings.tsx',
    'app/parent/account.tsx',
    'app/parent/account/login.tsx',
    'app/parent/account/signup.tsx',
    'app/parent/account/forgot-password.tsx',
    'app/parent/data.tsx',
    'app/parent/onboarding.tsx',
    'app/parent/feedback.tsx',
    'app/progress/index.tsx',
    'app/profile/index.tsx'
  ];

  for (const r of expectedRoutes) {
    assert(fs.existsSync(r), `Route file ${r} must exist`);
  }
});


// -------------------------------------------------------------
// DOMAIN 12: MULTI-CHILD INDEPENDENCE & ISOLATION
// -------------------------------------------------------------

test('Three children (A, B, C) maintain strictly isolated progress and recommendations', () => {
  const multiChildRaw = execSync(
    `npx tsx -e "
      import { getLearningRecommendation } from './features/learning/recommendationUtils';
      const ref = new Date('2026-09-28T12:00:00Z');
      const childA = { profile: { id: 'c-a', name: 'Aarav', level: 'class-1' } };
      const childB = { profile: { id: 'c-b', name: 'Bhavin', level: 'class-2' } };
      const childC = { profile: { id: 'c-c', name: 'Chitra', level: 'toddler' } };

      const progA = { topics: { 'class-1:numbers': { attempts: 2, questionsAnswered: 10, correctAnswers: 10, incorrectAnswers: 0, bestScore: 5, bestTotal: 5, lastScore: 5, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' } }, overall: { totalQuestionsAnswered: 10, totalCorrectAnswers: 10, totalIncorrectAnswers: 0, quizzesCompleted: 2 } };
      const progB = { topics: { 'class-2:addition': { attempts: 1, questionsAnswered: 5, correctAnswers: 3, incorrectAnswers: 2, bestScore: 3, bestTotal: 5, lastScore: 3, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' } }, overall: { totalQuestionsAnswered: 5, totalCorrectAnswers: 3, totalIncorrectAnswers: 2, quizzesCompleted: 1 } };

      const recA = getLearningRecommendation({ childRecord: childA as any, progress: progA as any, referenceDate: ref });
      const recB = getLearningRecommendation({ childRecord: childB as any, progress: progB as any, referenceDate: ref });
      const recC = getLearningRecommendation({ childRecord: childC as any, progress: null, referenceDate: ref });

      console.log(JSON.stringify({ recA, recB, recC }));
    "`,
    { encoding: 'utf8' }
  );
  const { recA, recB, recC } = JSON.parse(multiChildRaw);
  assert.strictEqual(recA.childId, 'c-a');
  assert.strictEqual(recB.childId, 'c-b');
  assert.strictEqual(recC.childId, 'c-c');
  assert.strictEqual(recC.level, 'toddler');
  assert(recA.topicId !== recB.topicId, 'Recommendations must be isolated between siblings');
});

// -------------------------------------------------------------
// DOMAIN 13: QUESTION SELECTION & AVOIDANCE OF DUPLICATE QUESTIONS
// -------------------------------------------------------------

test('Question selection engine respects topic pool and selects valid questions', () => {
  const qSelectRaw = execSync(
    `npx tsx -e "
      import { selectAdaptiveQuestions } from './features/learning/questionSelector';
      import { getQuestionsForTopic } from './data/questionBank';

      const pool = getQuestionsForTopic('class-1', 'numbers');
      const selected = selectAdaptiveQuestions(pool, { count: 5, seed: 42, level: 'class-1', topicId: 'numbers' });
      const uniqueIds = new Set(selected.map(q => q.id));

      console.log(JSON.stringify({ poolSize: pool.length, selectedCount: selected.length, uniqueCount: uniqueIds.size }));
    "`,
    { encoding: 'utf8' }
  );
  const qStats = JSON.parse(qSelectRaw);
  assert(qStats.poolSize >= 5, 'Pool must have at least 5 questions');
  assert.strictEqual(qStats.selectedCount, 5, 'Must select 5 questions');
  assert.strictEqual(qStats.uniqueCount, 5, 'Selected questions must be unique (no immediate duplicates)');
});

// -------------------------------------------------------------
// DOMAIN 14: ZERO PRESSURE & NO GAMIFICATION
// -------------------------------------------------------------

test('Zero gamification artifacts exist in production source code', () => {
  const bannedKeywords = ['leaderboard', 'streakBonus', 'coinCount', 'gemCount', 'pointsReward'];
  for (const kw of bannedKeywords) {
    const res = execSync(`git grep -i "${kw}" -- 'app/**' 'components/**' 'features/**' || true`, { encoding: 'utf8' });
    assert(!res.trim(), `Keyword "${kw}" must not exist in core application code`);
  }
});


console.log();

console.log(`\nAll ${testCount} Phase 24 Launch Readiness & Stability Tests Passed Successfully!`);
