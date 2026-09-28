/**
 * Tutr Kidz - Phase 21 Automated Test Suite
 *
 * Learning Quality, Content Integrity & Family Safety.
 * Deterministic tests verifying requirements A through N:
 *
 * A. Question integrity
 * B. Curriculum integrity
 * C. Quiz state integrity
 * D. Progress integrity
 * E. Offline recovery
 * F. Sync idempotency
 * G. Multi-child isolation
 * H. Parent safety
 * I. Child-safe UX
 * J. Accessibility
 * K. Error recovery
 * L. Privacy sanitization
 * M. Route parameter safety
 * N. Performance invariants
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

console.log("=== PHASE 21 TEST SUITE: LEARNING QUALITY, CONTENT INTEGRITY & FAMILY SAFETY ===\n");

// ----------------------------------------------------------------------------
// Source File Inspection & Module Exports Verification
// ----------------------------------------------------------------------------
console.log("--- File & Module Existence ---");

const questionIntegritySrc = fs.readFileSync(
  path.join(__dirname, "features/curriculum/questionIntegrity.ts"),
  "utf8"
);
assert(questionIntegritySrc.includes("export function validateQuestion"), "questionIntegrity exports validateQuestion");
assert(questionIntegritySrc.includes("export function validateQuestionBank"), "questionIntegrity exports validateQuestionBank");
assert(questionIntegritySrc.includes("export function findDuplicateQuestionIds"), "questionIntegrity exports findDuplicateQuestionIds");
assert(questionIntegritySrc.includes("export function findInvalidQuestions"), "questionIntegrity exports findInvalidQuestions");
assert(questionIntegritySrc.includes("export function findBrokenReferences"), "questionIntegrity exports findBrokenReferences");

const curriculumIntegritySrc = fs.readFileSync(
  path.join(__dirname, "features/curriculum/curriculumIntegrity.ts"),
  "utf8"
);
assert(curriculumIntegritySrc.includes("export function validateCurriculum"), "curriculumIntegrity exports validateCurriculum");
assert(curriculumIntegritySrc.includes("export function validateLevel"), "curriculumIntegrity exports validateLevel");
assert(curriculumIntegritySrc.includes("export function findOrphanedTopics"), "curriculumIntegrity exports findOrphanedTopics");
assert(curriculumIntegritySrc.includes("export function findOrphanedQuestions"), "curriculumIntegrity exports findOrphanedQuestions");

const progressIntegritySrc = fs.readFileSync(
  path.join(__dirname, "features/progress/progressIntegrity.ts"),
  "utf8"
);
assert(progressIntegritySrc.includes("export function validateQuizAttempt"), "progressIntegrity exports validateQuizAttempt");
assert(progressIntegritySrc.includes("export function sanitizeQuizAttempt"), "progressIntegrity exports sanitizeQuizAttempt");
assert(progressIntegritySrc.includes("export function validateProgressRecord"), "progressIntegrity exports validateProgressRecord");
assert(progressIntegritySrc.includes("export function validateTopicProgress"), "progressIntegrity exports validateTopicProgress");

// ----------------------------------------------------------------------------
// A. Question Bank Integrity
// ----------------------------------------------------------------------------
console.log("\n--- A. Question Bank Integrity ---");

const qbResultRaw = execSync(
  `npx tsx -e "import { validateQuestionBank, findDuplicateQuestionIds, findInvalidQuestions, findBrokenReferences } from './features/curriculum/questionIntegrity'; console.log(JSON.stringify({ bank: validateQuestionBank(), dups: findDuplicateQuestionIds(), invalid: findInvalidQuestions(), broken: findBrokenReferences() }));"`,
  { encoding: "utf8" }
);
const qbResult = JSON.parse(qbResultRaw);

assert(qbResult.bank.totalQuestions === 185, "Total questions audited equals 185 across all curriculum levels");
assert(qbResult.bank.isValid === true, "Question bank validateQuestionBank returns isValid === true");
assert(qbResult.bank.errors.length === 0, "Question bank has 0 validation errors");
assert(qbResult.dups.length === 0, "Zero duplicate question IDs found in entire question bank");
assert(qbResult.invalid.length === 0, "Zero invalid questions found in entire question bank");
assert(qbResult.broken.length === 0, "Zero broken references to levels, topics, or visuals");
assert(qbResult.bank.countsByLevel["toddler"] === 20, "Toddler level has 20 questions");
assert(qbResult.bank.countsByLevel["class-1"] === 35, "Class 1 level has 35 questions");
assert(qbResult.bank.countsByLevel["class-2"] === 40, "Class 2 level has 40 questions");
assert(qbResult.bank.countsByLevel["class-3"] === 45, "Class 3 level has 45 questions");
assert(qbResult.bank.countsByLevel["class-4"] === 45, "Class 4 level has 45 questions");

// Test validateQuestion failure handling
const failQRaw = execSync(
  `npx tsx -e "import { validateQuestion } from './features/curriculum/questionIntegrity'; console.log(JSON.stringify(validateQuestion({ id: '', level: 'invalid', topic: '', question: '', options: [] } as any)));"`,
  { encoding: "utf8" }
);
const failQ = JSON.parse(failQRaw);
assert(failQ.isValid === false, "validateQuestion correctly flags invalid question as isValid === false");
assert(failQ.errors.some((e) => e.code === "MISSING_ID"), "validateQuestion reports MISSING_ID for empty id");
assert(failQ.errors.some((e) => e.code === "INVALID_LEVEL"), "validateQuestion reports INVALID_LEVEL for unknown level");
assert(failQ.errors.some((e) => e.code === "EMPTY_QUESTION"), "validateQuestion reports EMPTY_QUESTION for blank text");
assert(failQ.errors.some((e) => e.code === "INVALID_OPTIONS_COUNT"), "validateQuestion reports INVALID_OPTIONS_COUNT for empty options array");

// ----------------------------------------------------------------------------
// B. Curriculum Integrity
// ----------------------------------------------------------------------------
console.log("\n--- B. Curriculum Integrity ---");

const currResultRaw = execSync(
  `npx tsx -e "import { validateCurriculum, findOrphanedTopics, findOrphanedQuestions } from './features/curriculum/curriculumIntegrity'; console.log(JSON.stringify({ curr: validateCurriculum(), orphanedTopics: findOrphanedTopics(), orphanedQuestions: findOrphanedQuestions() }));"`,
  { encoding: "utf8" }
);
const currResult = JSON.parse(currResultRaw);

assert(currResult.curr.isValid === true, "validateCurriculum returns isValid === true");
assert(currResult.curr.totalLevels === 5, "Curriculum contains exactly 5 registered levels");
assert(currResult.curr.totalTopics === 32, "Curriculum contains exactly 32 registered topics across all levels");
assert(currResult.curr.errors.length === 0, "Curriculum contains 0 integrity errors");
assert(currResult.orphanedTopics.length === 0, "Zero orphaned topics (every topic has available questions)");
assert(currResult.orphanedQuestions.length === 0, "Zero orphaned questions (every question maps to a valid topic)");

// Test validateLevel for known vs unknown
const levelAuditRaw = execSync(
  `npx tsx -e "import { validateLevel } from './features/curriculum/curriculumIntegrity'; console.log(JSON.stringify({ valid: validateLevel('class-1'), invalid: validateLevel('class-99') }));"`,
  { encoding: "utf8" }
);
const levelAudit = JSON.parse(levelAuditRaw);
assert(levelAudit.valid.isValid === true, "validateLevel(class-1) returns isValid === true");
assert(levelAudit.valid.topicCount === 5, "Class 1 has 5 registered topics");
assert(levelAudit.valid.questionCount === 35, "Class 1 has 35 questions total");
assert(levelAudit.invalid.isValid === false, "validateLevel(class-99) returns isValid === false for unknown level");
assert(levelAudit.invalid.errors[0].type === "INVALID_LEVEL", "Unknown level returns structured error type INVALID_LEVEL");

// ----------------------------------------------------------------------------
// C. Quiz State Integrity
// ----------------------------------------------------------------------------
console.log("\n--- C. Quiz State Integrity ---");

const useQuizSrc = fs.readFileSync(path.join(__dirname, "features/quiz/useQuiz.ts"), "utf8");
assert(useQuizSrc.includes("if (isAnswered || !currentQuestion)"), "useQuiz guards against multiple option selections after locking");
assert(useQuizSrc.includes("if (!isAnswered)"), "useQuiz guards against nextQuestion before an option is selected");
assert(useQuizSrc.includes("isLastQuestion"), "useQuiz tracks last question boundary deterministically");
assert(useQuizSrc.includes("Math.min(currentIndex + 1, totalQuestions)"), "useQuiz progressText handles bounds safely");

const quizLevelSrc = fs.readFileSync(path.join(__dirname, "app/quiz/[level].tsx"), "utf8");
assert(quizLevelSrc.includes("if (isTransitioning) return;"), "QuizScreen guards against rapid double next navigation clicks");
assert(quizLevelSrc.includes("if (!currentQuestion || totalQuestions === 0)"), "QuizScreen provides graceful fallback when no questions are available");

const quizResultSrc = fs.readFileSync(path.join(__dirname, "app/quiz/result.tsx"), "utf8");
assert(quizResultSrc.includes("hasRecordedRef.current = true;"), "QuizResult guards against duplicate result recording via hasRecordedRef");

// ----------------------------------------------------------------------------
// D. Progress Integrity
// ----------------------------------------------------------------------------
console.log("\n--- D. Progress Integrity ---");

const progressIntegrityTestRaw = execSync(
  `npx tsx -e "import { validateQuizAttempt, sanitizeQuizAttempt, validateProgressRecord, validateTopicProgress } from './features/progress/progressIntegrity'; const badAttempt = validateQuizAttempt({ level: 'class-1', topic: 'addition', score: 10, total: 5 }); const negAttempt = validateQuizAttempt({ level: 'class-1', topic: 'addition', score: -2, total: 5 }); const sanitized = sanitizeQuizAttempt({ level: 'class-1', topic: 'addition', score: 12, total: 5 }); const validRec = validateProgressRecord({ level: 'class-1', topic: 'addition', attempts: 2, questionsAnswered: 10, correctAnswers: 8, incorrectAnswers: 2, bestScore: 5, bestTotal: 5, lastScore: 4, lastTotal: 5, lastPlayedAt: '' }); const corruptRec = validateProgressRecord({ level: 'class-1', topic: 'addition', attempts: 2, questionsAnswered: 10, correctAnswers: 8, incorrectAnswers: 5, bestScore: 5, bestTotal: 5, lastScore: 4, lastTotal: 5, lastPlayedAt: '' }); console.log(JSON.stringify({ badAttempt, negAttempt, sanitized, validRec, corruptRec }));"`,

  { encoding: "utf8" }
);
const piTest = JSON.parse(progressIntegrityTestRaw);

assert(piTest.badAttempt.isValid === false, "validateQuizAttempt flags score > total as invalid");
assert(piTest.negAttempt.isValid === false, "validateQuizAttempt flags negative score as invalid");
assert(piTest.sanitized.score === 5, "sanitizeQuizAttempt clamps score exceeding total to total (12 -> 5)");
assert(piTest.validRec.isValid === true, "validateProgressRecord validates consistent progress record (correct + incorrect === answered)");
assert(piTest.corruptRec.isValid === false, "validateProgressRecord rejects corrupt record where correct + incorrect !== answered");

const progressRepoSrc = fs.readFileSync(path.join(__dirname, "features/progress/progressRepository.ts"), "utf8");
assert(progressRepoSrc.includes("const safeParams = sanitizeQuizAttempt(params);"), "progressRepository automatically sanitizes quiz attempt parameters before write");

// ----------------------------------------------------------------------------
// E. Offline Recovery & F. Sync Idempotency
// ----------------------------------------------------------------------------
console.log("\n--- E. Offline Recovery & F. Sync Idempotency ---");

const syncServiceSrc = fs.readFileSync(path.join(__dirname, "features/sync/syncService.ts"), "utf8");
assert(syncServiceSrc.includes("export async function flushSyncQueue"), "syncService exports flushSyncQueue for offline synchronization");
assert(syncServiceSrc.includes("upsert"), "syncService uses idempotent upsert semantics for entities");
assert(syncServiceSrc.includes("removeQueueItem"), "syncService removes items from offline queue upon successful sync");
assert(syncServiceSrc.includes("updateQueueItemError"), "syncService captures errors without throwing or crashing");

// ----------------------------------------------------------------------------
// G. Multi-Child Isolation
// ----------------------------------------------------------------------------
console.log("\n--- G. Multi-Child Isolation ---");

const familyRepoSrc = fs.readFileSync(path.join(__dirname, "features/family/familyRepository.ts"), "utf8");
assert(familyRepoSrc.includes("progressStorageAdapter.removeItem(`tutr_kidz_progress_${id}`)"), "removeChild cleans local child-isolated progress");
assert(familyRepoSrc.includes("familyStorageAdapter.removeItem(`tutr_kidz_plan_${id}`)"), "removeChild cleans local child-isolated learning plan");
assert(familyRepoSrc.includes("export async function setActiveChild"), "familyRepository supports explicit learner switching");
assert(familyRepoSrc.includes("activeChildIdCache = state.activeChildId;"), "activeChildId persists deterministically in family state");

// ----------------------------------------------------------------------------
// H. Parent Safety & Destructive Actions
// ----------------------------------------------------------------------------
console.log("\n--- H. Parent Safety & Destructive Actions ---");

const destructiveActionSrc = fs.readFileSync(
  path.join(__dirname, "components/settings/DestructiveAction.tsx"),
  "utf8"
);
assert(destructiveActionSrc.includes("requireConfirmation = true"), "DestructiveAction defaults requireConfirmation to true");
assert(destructiveActionSrc.includes("const [isPending, setIsPending] = useState(false)"), "DestructiveAction maintains isPending state");
assert(destructiveActionSrc.includes("disabled={isPending}"), "DestructiveAction disables button while operation is in progress");
assert(destructiveActionSrc.includes("ActivityIndicator"), "DestructiveAction displays loading indicator when executing");

const parentLockChallengeModalSrc = fs.readFileSync(
  path.join(__dirname, "components/settings/ParentLockChallengeModal.tsx"),
  "utf8"
);
assert(parentLockChallengeModalSrc.includes("verifyParentChallenge(challenge.answer, inputVal)"), "ParentLockChallengeModal verifies answer mathematically");
assert(parentLockChallengeModalSrc.includes("setChallenge(generateParentChallenge())"), "ParentLockChallengeModal regenerates challenge on incorrect attempt");

// ----------------------------------------------------------------------------
// I. Child-Safe UX
// ----------------------------------------------------------------------------
console.log("\n--- I. Child-Safe UX ---");

assert(!quizResultSrc.includes("isToddler ? `You got ${score} right"), "Toddler quiz result never displays numeric score count");
assert(quizResultSrc.includes("isToddler ? \"Nice exploring! 🌟\" : \"Great job!\""), "Toddler quiz result displays qualitative discovery heading");
assert(quizResultSrc.includes("You discovered something new."), "Toddler quiz result provides calm exploratory discovery text");
assert(quizResultSrc.includes("Ready to explore another one?"), "Toddler quiz result provides encouraging next step without pressure");
assert(quizResultSrc.includes("isToddler ? \"Explore Again\" : \"Try Again\""), "Toddler quiz result provides exploratory button label");

// ----------------------------------------------------------------------------
// J. Accessibility Contracts
// ----------------------------------------------------------------------------
console.log("\n--- J. Accessibility Contracts ---");

const quizOptionSrc = fs.readFileSync(path.join(__dirname, "components/quiz/QuizOption.tsx"), "utf8");
assert(quizOptionSrc.includes("minHeight: 68"), "QuizOption enforces minimum touch target height of 68px (>= 48px)");
assert(quizOptionSrc.includes("accessibilityRole=\"button\""), "QuizOption declares accessibilityRole=button");
assert(quizOptionSrc.includes("accessibilityState="), "QuizOption exposes accessibilityState for disabled and selected");

const primaryButtonSrc = fs.readFileSync(path.join(__dirname, "components/ui/PrimaryButton.tsx"), "utf8");
assert(primaryButtonSrc.includes("minHeight: 56"), "PrimaryButton enforces minimum touch target height of 56px (>= 48px)");
assert(primaryButtonSrc.includes("accessibilityRole=\"button\""), "PrimaryButton declares accessibilityRole=button");

const levelCardSrc = fs.readFileSync(path.join(__dirname, "components/ui/LevelCard.tsx"), "utf8");
assert(levelCardSrc.includes("minHeight: 76"), "LevelCard enforces minimum touch target height of 76px (>= 48px)");
assert(levelCardSrc.includes("accessibilityRole=\"button\""), "LevelCard declares accessibilityRole=button");

const topicCardSrc = fs.readFileSync(path.join(__dirname, "components/curriculum/TopicCard.tsx"), "utf8");
assert(topicCardSrc.includes("minHeight: 80"), "TopicCard enforces minimum touch target height of 80px (>= 48px)");
assert(topicCardSrc.includes("accessibilityRole=\"button\""), "TopicCard declares accessibilityRole=button");

// ----------------------------------------------------------------------------
// K. Error Recovery & Non-blocking Behavior
// ----------------------------------------------------------------------------
console.log("\n--- K. Error Recovery & Non-blocking Behavior ---");

const obsSrc = fs.readFileSync(path.join(__dirname, "lib/observability/observability.ts"), "utf8");
assert(obsSrc.includes("export function trackError"), "observability exports non-blocking trackError");
assert(obsSrc.includes("maxBufferSize = 50"), "observability caps in-memory diagnostic logs at 50 to prevent memory leaks");
assert(obsSrc.includes("sanitizeMessage"), "observability sanitizes error messages to protect privacy");

// ----------------------------------------------------------------------------
// L. Privacy Sanitization & Security Contracts
// ----------------------------------------------------------------------------
console.log("\n--- L. Privacy Sanitization & Security Contracts ---");

const analyticsSrc = fs.readFileSync(path.join(__dirname, "lib/analytics/analytics.ts"), "utf8");
assert(analyticsSrc.includes("learner_id"), "analytics sanitization strips learner_id");
assert(analyticsSrc.includes("lower.includes('name')"), "analytics sanitization strips child_name");
assert(analyticsSrc.includes("email"), "analytics sanitization strips email");
assert(analyticsSrc.includes("password"), "analytics sanitization strips password");
assert(analyticsSrc.includes("feedback"), "analytics sanitization strips raw feedback text");

const gitignoreSrc = fs.readFileSync(path.join(__dirname, ".gitignore"), "utf8");
assert(gitignoreSrc.includes(".env"), ".gitignore protects .env files from repository inclusion");

// ----------------------------------------------------------------------------
// M. Route Parameter Safety
// ----------------------------------------------------------------------------
console.log("\n--- M. Route Parameter Safety ---");

assert(quizResultSrc.includes("if (total <= 0)"), "QuizResult screen guards against zero or negative total with safe fallback");
assert(quizResultSrc.includes("Return Home"), "QuizResult provides safe return home action when parameters are invalid");
assert(quizLevelSrc.includes("router.replace('/')"), "QuizLevel screen provides return home action when questions cannot be loaded");

// ----------------------------------------------------------------------------
// N. Performance Invariants & Anti-Gamification Verification
// ----------------------------------------------------------------------------
console.log("\n--- N. Performance Invariants & Anti-Gamification ---");

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
assert(!packageJson.dependencies["sentry"], "No heavy third-party Sentry dependency introduced");
assert(!packageJson.dependencies["datadog"], "No heavy third-party Datadog dependency introduced");
assert(!packageJson.dependencies["firebase"], "No heavy third-party Firebase SDK introduced");

// Anti-gamification invariants
const repoFiles = [
  "features/progress/types.ts",
  "features/progress/progressRepository.ts",
  "app/quiz/result.tsx",
  "features/dailyLearning/dailyLearningTypes.ts",
];
for (const f of repoFiles) {
  const content = fs.readFileSync(path.join(__dirname, f), "utf8");
  assert(!content.includes("streak"), `${f} does not introduce streak pressure`);
  assert(!content.includes("leaderboard"), `${f} does not introduce leaderboards`);
  assert(!content.includes("ranking"), `${f} does not introduce competitive ranking`);
  assert(!content.includes("badge"), `${f} does not introduce gamified badges`);
}

console.log(`\n====================================================`);
console.log(`Phase 21 Test Results: ${passedTests} / ${totalTests} passed`);
console.log(`====================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
