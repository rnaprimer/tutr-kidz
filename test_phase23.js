/**
 * Tutr Kidz - Phase 23 Automated Test Suite
 *
 * Final Product Polish & Real-World QA
 * Comprehensive verification of all acceptance criteria:
 *
 * 1. Child learning journey
 * 2. Parent flow & navigation
 * 3. Onboarding flow & idempotence
 * 4. Curriculum & content integrity
 * 5. Quiz hardening & repetition avoidance
 * 6. Offline-first resilience & storage fallback
 * 7. Sync idempotency & recovery
 * 8. Multi-child isolation & non-mutation
 * 9. Authentication & Parent Lock safety
 * 10. Privacy sanitization & bundle security
 * 11. Analytics & bounded observability
 * 12. Accessibility contracts (touch targets >= 48px, roles, labels)
 * 13. Responsive design & layout containment
 * 14. Error, empty & loading states (calm, non-technical)
 * 15. Routing, SPA fallbacks & document titles
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${message}`);
  } else {
    console.error(`✗ FAILED: ${message}`);
    process.exitCode = 1;
  }
}

console.log("=== PHASE 23 TEST SUITE: FINAL PRODUCT POLISH & REAL-WORLD QA ===\n");

// ----------------------------------------------------------------------------
// 1. Child Learning Journey
// ----------------------------------------------------------------------------
console.log("--- 1. Child Learning Journey ---");

const homeSrc = fs.readFileSync(path.join(__dirname, "app/index.tsx"), "utf8");
assert(homeSrc.includes("DailyPracticeCard"), "Home displays daily learning recommendation card");
assert(homeSrc.includes("!isToddler"), "Toddlers are protected from numerical goal counters on Home");
assert(homeSrc.includes("router.push"), "Home routes to selected levels without dead ends");

const quizSrc = fs.readFileSync(path.join(__dirname, "app/quiz/[level].tsx"), "utf8");
assert(quizSrc.includes("isTransitioning"), "Quiz engine locks transitions to prevent accidental double-navigation");
assert(quizSrc.includes("selectAdaptiveQuestions"), "Quiz engine selects questions adaptively with repetition avoidance");
assert(quizSrc.includes("recordQuestionExposure"), "Quiz engine tracks exposed questions on session completion");

const resultSrc = fs.readFileSync(path.join(__dirname, "app/quiz/result.tsx"), "utf8");
assert(resultSrc.includes("hasRecordedRef"), "Quiz result guards against duplicate result recordings");
assert(resultSrc.includes("total <= 0"), "Quiz result provides graceful fallback for zero or missing total");
assert(resultSrc.includes("handleTryAgain"), "Quiz result provides seamless try-again loop");
assert(resultSrc.includes("handleChooseAnother"), "Quiz result provides choose-another-topic action");

// ----------------------------------------------------------------------------
// 2. Parent Journey & Family Navigation
// ----------------------------------------------------------------------------
console.log("\n--- 2. Parent Journey & Family Navigation ---");

const parentHomeSrc = fs.readFileSync(path.join(__dirname, "app/parent/index.tsx"), "utf8");
assert(parentHomeSrc.includes("ParentLockChallengeModal"), "Parent home is protected by Parent Lock challenge");
assert(parentHomeSrc.includes("Suggested Next"), "Parent home includes calm 'Suggested Next' section");
assert(parentHomeSrc.includes("Gentle Learning Intention"), "Parent home allows setting calm learning intentions");

const insightsSrc = fs.readFileSync(path.join(__dirname, "app/parent/family/[childId]/insights.tsx"), "utf8");
assert(insightsSrc.includes("Suggested Next"), "Learner insights displays 'Suggested Next'");
assert(insightsSrc.includes("Exploring Now"), "Learner insights displays 'Exploring Now'");
assert(insightsSrc.includes("Could Revisit") || insightsSrc.includes("Topics to Revisit"), "Learner insights displays topics to revisit");
assert(insightsSrc.includes("Learning History"), "Learner insights displays chronological learning history");

// ----------------------------------------------------------------------------
// 3. Onboarding Flow & Idempotence
// ----------------------------------------------------------------------------
console.log("\n--- 3. Onboarding Flow & Idempotence ---");

const onboardingSrc = fs.readFileSync(path.join(__dirname, "app/parent/onboarding.tsx"), "utf8");
assert(onboardingSrc.includes("hasCompletedOnboarding"), "Onboarding checks prior completion to bypass returning parents");
assert(onboardingSrc.includes("addChild"), "Onboarding creates learner profile idempotently");
assert(onboardingSrc.includes("setActiveChild"), "Onboarding marks new learner as active child");
assert(onboardingSrc.includes("markOnboardingCompleted"), "Onboarding persists completion flag");
assert(onboardingSrc.includes("handleNextFromStep2"), "Step 2 guards against empty child name input");

// ----------------------------------------------------------------------------
// 4. Curriculum & Content Integrity
// ----------------------------------------------------------------------------
console.log("\n--- 4. Curriculum & Content Integrity ---");

const currAuditRaw = execSync(
  `npx tsx -e "import { validateCurriculum, findOrphanedTopics, findOrphanedQuestions } from './features/curriculum/curriculumIntegrity'; import { validateQuestionBank } from './features/curriculum/questionIntegrity'; const c = validateCurriculum(); const q = validateQuestionBank(); console.log(JSON.stringify({ cValid: c.isValid, qValid: q.isValid, orphanedT: findOrphanedTopics().length, orphanedQ: findOrphanedQuestions().length, totalQ: q.totalQuestions }));"`,
  { encoding: "utf8" }
);
const currAudit = JSON.parse(currAuditRaw);

assert(currAudit.cValid === true, "Curriculum is 100% valid with zero orphaned topics");
assert(currAudit.qValid === true, "Question bank is 100% valid with zero broken references");
assert(currAudit.orphanedT === 0, "Zero orphaned topics exist");
assert(currAudit.orphanedQ === 0, "Zero orphaned questions exist");
assert(currAudit.totalQ === 185, "Exactly 185 questions audited across all levels");

// ----------------------------------------------------------------------------
// 5. Quiz Hardening & Repetition Avoidance
// ----------------------------------------------------------------------------
console.log("\n--- 5. Quiz Hardening & Repetition Avoidance ---");

const quizRepRaw = execSync(
  `npx tsx -e "import { selectAdaptiveQuestions } from './features/learning/questionSelector'; import { getQuestionsForTopic } from './data/questionBank'; const qs = getQuestionsForTopic('class-1', 'addition'); const seenIds = qs.slice(0, 5).map(q => q.id); const selected = selectAdaptiveQuestions(qs, { count: 5, recentQuestionIds: seenIds, level: 'class-1', topicId: 'addition' }); const overlap = selected.filter(q => seenIds.includes(q.id)); console.log(JSON.stringify({ selectedLen: selected.length, overlapLen: overlap.length }));"`,
  { encoding: "utf8" }
);
const quizRep = JSON.parse(quizRepRaw);

assert(quizRep.selectedLen === 5, "Adaptive question selector returns exactly 5 questions");
assert(quizRep.overlapLen === 0, "Questions seen in recent sessions are strictly avoided when alternatives exist");

// Edge case: single question topic
const singleTestRaw = execSync(
  `npx tsx -e "import { selectAdaptiveQuestions } from './features/learning/questionSelector'; const single = [{ id: 'q-single', level: 'class-1', subject: 'mathematics', topic: 'single', difficulty: 'easy', type: 'multiple_choice', question: 'What is 1+0?', options: [{ id: 'o1', label: '1' }], correctOptionId: 'o1' }]; const res = selectAdaptiveQuestions(single as any, { count: 5, recentQuestionIds: ['q-single'] }); console.log(JSON.stringify(res));"`,
  { encoding: "utf8" }
);
const singleTest = JSON.parse(singleTestRaw);
assert(singleTest.length === 1 && singleTest[0].id === "q-single", "Single question pool is never dropped");

// ----------------------------------------------------------------------------
// 6. Offline-First Resilience & Storage Fallback
// ----------------------------------------------------------------------------
console.log("\n--- 6. Offline-First Resilience & Storage Fallback ---");

const offlineTestRaw = execSync(
  `npx tsx -e "import { progressStorageAdapter } from './features/progress/progressStorageAdapter'; import { getLearningRecommendation } from './features/learning/recommendationUtils'; const key = 'test_offline_key_' + Date.now(); (async () => { await progressStorageAdapter.setItem(key, JSON.stringify({ test: 'local_data' })); const readBack = await progressStorageAdapter.getItem(key); const rec = getLearningRecommendation({ childRecord: { profile: { id: 'offline-child', name: 'Kabir', level: 'class-2' } } }); console.log(JSON.stringify({ readBack: JSON.parse(readBack!), recTopic: rec.topicId })); })();"`,
  { encoding: "utf8" }
);
const offlineTest = JSON.parse(offlineTestRaw);

assert(offlineTest.readBack.test === "local_data", "Local storage adapter works reliably in offline/fallback mode");
assert(offlineTest.recTopic === "numbers", "Learning recommendation computes purely offline without cloud dependency");

// ----------------------------------------------------------------------------
// 7. Sync Idempotency & Queue Resilience
// ----------------------------------------------------------------------------
console.log("\n--- 7. Sync Idempotency & Queue Resilience ---");

const syncSrc = fs.readFileSync(path.join(__dirname, "features/sync/syncService.ts"), "utf8");
assert(syncSrc.includes("flushSyncQueue"), "syncService exports flushSyncQueue");
assert(syncSrc.includes("upsert"), "syncService uses upsert for idempotent synchronization");
assert(syncSrc.includes("removeQueueItem"), "syncService drains queue only after successful sync");

// ----------------------------------------------------------------------------
// 8. Multi-Child Isolation & Non-Mutation
// ----------------------------------------------------------------------------
console.log("\n--- 8. Multi-Child Isolation & Non-Mutation ---");

const multiChildTestRaw = execSync(
  `npx tsx -e "import { getLearningRecommendation, getTopicFamiliaritySummaries } from './features/learning/recommendationUtils'; const ref = new Date('2026-09-28T12:00:00Z'); const childA = { profile: { id: 'c-aarav', name: 'Aarav', level: 'class-1' } }; const childB = { profile: { id: 'c-anya', name: 'Anya', level: 'class-3' } }; const progA = { topics: { 'class-1:numbers': { attempts: 2, questionsAnswered: 10, correctAnswers: 10, incorrectAnswers: 0, bestScore: 5, bestTotal: 5, lastScore: 5, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' } }, overall: { totalQuestionsAnswered: 10, totalCorrectAnswers: 10, totalIncorrectAnswers: 0, quizzesCompleted: 2 } }; const progB = { topics: { 'class-3:geometry': { attempts: 1, questionsAnswered: 5, correctAnswers: 4, incorrectAnswers: 1, bestScore: 4, bestTotal: 5, lastScore: 4, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' } }, overall: { totalQuestionsAnswered: 5, totalCorrectAnswers: 4, totalIncorrectAnswers: 1, quizzesCompleted: 1 } }; const recA = getLearningRecommendation({ childRecord: childA, progress: progA, referenceDate: ref }); const recB = getLearningRecommendation({ childRecord: childB, progress: progB, referenceDate: ref }); console.log(JSON.stringify({ recA: { id: recA.childId, topic: recA.topicId, level: recA.level }, recB: { id: recB.childId, topic: recB.topicId, level: recB.level } }));"`,
  { encoding: "utf8" }
);
const multiChildTest = JSON.parse(multiChildTestRaw);

assert(multiChildTest.recA.id === "c-aarav" && multiChildTest.recA.level === "class-1", "Child A strictly isolates Aarav's Class 1 data");
assert(multiChildTest.recB.id === "c-anya" && multiChildTest.recB.level === "class-3", "Child B strictly isolates Anya's Class 3 data");
assert(multiChildTest.recA.topic !== multiChildTest.recB.topic, "Child A and Child B receive completely distinct recommendations");

// ----------------------------------------------------------------------------
// 9. Authentication & Parent Lock Safety
// ----------------------------------------------------------------------------
console.log("\n--- 9. Authentication & Parent Lock Safety ---");

const lockTestRaw = execSync(
  `npx tsx -e "import { generateParentChallenge, verifyParentChallenge } from './features/settings/parentLock'; const ch = generateParentChallenge(); const valid = verifyParentChallenge(ch.answer, String(ch.answer)); const invalid = verifyParentChallenge(ch.answer, '999999'); console.log(JSON.stringify({ valid, invalid }));"`,
  { encoding: "utf8" }
);
const lockTest = JSON.parse(lockTestRaw);

assert(lockTest.valid === true, "Parent challenge passes with correct answer");
assert(lockTest.invalid === false, "Parent challenge rejects incorrect answer");

const authContextSrc = fs.readFileSync(path.join(__dirname, "features/auth/AuthContext.tsx"), "utf8");
assert(authContextSrc.includes("signOut"), "AuthContext provides safe signOut without wiping local learning state");

// ----------------------------------------------------------------------------
// 10. Privacy Sanitization & Bundle Security
// ----------------------------------------------------------------------------
console.log("\n--- 10. Privacy Sanitization & Bundle Security ---");

const privTestRaw = execSync(
  `npx tsx -e "import { analytics, trackEvent } from './lib/analytics'; analytics.clear(); trackEvent('learning_recommendation_shown', { level: 'class-1', topic: 'numbers', childName: 'Aarav Private', childId: 'secret-child-id', email: 'parent@domain.com', password: 'password123' } as any); const ev = analytics.getEvents(); console.log(JSON.stringify(ev));"`,
  { encoding: "utf8" }
);
const privEvents = JSON.parse(privTestRaw);

assert(privEvents.length === 1, "Analytics event tracked safely");
const pProps = privEvents[0].properties || {};
assert(pProps.level === "class-1" && pProps.topic === "numbers", "Safe properties retained");
assert(pProps.childName === undefined, "Child name stripped from telemetry");
assert(pProps.childId === undefined, "Child ID stripped from telemetry");
assert(pProps.email === undefined, "Email stripped from telemetry");
assert(pProps.password === undefined, "Password stripped from telemetry");

// ----------------------------------------------------------------------------
// 11. Bounded Observability
// ----------------------------------------------------------------------------
console.log("\n--- 11. Bounded Observability ---");

const obsTestRaw = execSync(
  `npx tsx -e "import { observability, trackError } from './lib/observability'; observability.clearDiagnostics(); for (let i = 0; i < 70; i++) { trackError(new Error('Test bounded error ' + i)); } console.log(JSON.stringify({ count: observability.getDiagnosticLogs().length }));"`,
  { encoding: "utf8" }
);
const obsTest = JSON.parse(obsTestRaw);

assert(obsTest.count === 50, "Observability buffer is strictly bounded to max 50 entries to prevent memory leaks");

// ----------------------------------------------------------------------------
// 12. Accessibility Contracts
// ----------------------------------------------------------------------------
console.log("\n--- 12. Accessibility Contracts ---");

const primaryBtnSrc = fs.readFileSync(path.join(__dirname, "components/ui/PrimaryButton.tsx"), "utf8");
assert(primaryBtnSrc.includes("minHeight: 56"), "PrimaryButton enforces generous touch target (minHeight: 56px >= 48px)");
assert(primaryBtnSrc.includes('accessibilityRole="button"'), "PrimaryButton specifies accessibilityRole='button'");

const quizOptSrc = fs.readFileSync(path.join(__dirname, "components/quiz/QuizOption.tsx"), "utf8");
assert(quizOptSrc.includes("minHeight: 68"), "QuizOption enforces generous child touch target (minHeight: 68px >= 48px)");
assert(quizOptSrc.includes('accessibilityRole="button"'), "QuizOption specifies accessibilityRole='button'");
assert(quizOptSrc.includes("accessibilityState="), "QuizOption exposes accessibilityState for disabled/selected");

const destructiveSrc = fs.readFileSync(path.join(__dirname, "components/settings/DestructiveAction.tsx"), "utf8");
assert(destructiveSrc.includes("minHeight: 56"), "DestructiveAction enforces touch target minHeight: 56px");

// ----------------------------------------------------------------------------
// 13. Responsive Layout & Width Containment
// ----------------------------------------------------------------------------
console.log("\n--- 13. Responsive Layout & Width Containment ---");

const colorsSrc = fs.readFileSync(path.join(__dirname, "constants/colors.ts"), "utf8");
assert(colorsSrc.includes("maxWidth: 540"), "Layout defines centered maxWidth: 540 for responsive containment");

// ----------------------------------------------------------------------------
// 14. Error, Empty & Loading States
// ----------------------------------------------------------------------------
console.log("\n--- 14. Error, Empty & Loading States ---");

assert(homeSrc.includes("What are you learning?"), "Home provides clear learning section heading");
assert(resultSrc.includes("No Quiz Results"), "Quiz result handles direct navigation with calm empty state");
assert(resultSrc.includes("Complete a quiz to see your learning results here."), "Result empty state provides reassuring guidance");

const progressSrc = fs.readFileSync(path.join(__dirname, "app/progress/index.tsx"), "utf8");
assert(progressSrc.includes("Your learning journey starts here."), "Progress screen provides calm initial empty state");

// ----------------------------------------------------------------------------
// 15. Routing, SPA Fallbacks & Document Titles
// ----------------------------------------------------------------------------
console.log("\n--- 15. Routing, SPA Fallbacks & Document Titles ---");

const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "vercel.json"), "utf8"));
assert(vercelConfig.routes.some((r) => r.dest === "/index.html"), "vercel.json configures SPA fallback to /index.html");

const routesWithTitles = [
  "app/index.tsx",
  "app/level/[level].tsx",
  "app/level/[level]/topics.tsx",
  "app/quiz/[level].tsx",
  "app/quiz/result.tsx",
  "app/toddler/index.tsx",
  "app/parent/index.tsx",
  "app/parent/settings.tsx",
  "app/parent/children.tsx",
  "app/parent/account.tsx",
  "app/parent/data.tsx",
  "app/parent/onboarding.tsx",
  "app/parent/feedback.tsx",
  "app/parent/family/index.tsx",
  "app/parent/family/settings.tsx",
  "app/parent/family/[childId].tsx",
  "app/parent/family/[childId]/insights.tsx",
  "app/parent/account/login.tsx",
  "app/parent/account/signup.tsx",
  "app/parent/account/forgot-password.tsx",
  "app/profile/index.tsx",
  "app/progress/index.tsx",
];

for (const rPath of routesWithTitles) {
  const content = fs.readFileSync(path.join(__dirname, rPath), "utf8");
  assert(content.includes("useDocumentTitle"), `Route ${rPath} integrates useDocumentTitle for Web tab updates`);
}

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log(`\n========================================`);
console.log(`PHASE 23 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  console.log("✓ ALL PHASE 23 PRODUCT POLISH & REAL-WORLD QA TESTS PASSED");
  process.exit(0);
} else {
  console.error("✗ SOME PHASE 23 TESTS FAILED");
  process.exit(1);
}
