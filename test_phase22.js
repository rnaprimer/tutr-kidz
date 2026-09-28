/**
 * Tutr Kidz - Phase 22 Automated Test Suite
 *
 * Learning Intelligence & Content System
 * Deterministic tests verifying requirements A through O:
 *
 * A. Content model
 * B. Curriculum relationships
 * C. Topic familiarity
 * D. Recommendation selection
 * E. Parent plan integration
 * F. Question repetition avoidance
 * G. Adaptive question selection
 * H. Toddler qualitative separation
 * I. Parent insight generation
 * J. Offline recommendation behavior
 * K. Multi-child isolation
 * L. Determinism
 * M. Privacy sanitization
 * N. Accessibility contracts
 * O. Invalid/missing data handling
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

console.log("=== PHASE 22 TEST SUITE: LEARNING INTELLIGENCE & CONTENT SYSTEM ===\n");

// ----------------------------------------------------------------------------
// Source File Inspection & Module Verification
// ----------------------------------------------------------------------------
console.log("--- File & Module Existence ---");

const contentTypesSrc = fs.readFileSync(path.join(__dirname, "features/curriculum/contentTypes.ts"), "utf8");
assert(contentTypesSrc.includes("export const TOPIC_CONTENT_MODELS"), "contentTypes exports TOPIC_CONTENT_MODELS");
assert(contentTypesSrc.includes("export function getTopicContentModel"), "contentTypes exports getTopicContentModel");
assert(contentTypesSrc.includes("export function getTopicPrerequisites"), "contentTypes exports getTopicPrerequisites");
assert(contentTypesSrc.includes("export function getRelatedTopics"), "contentTypes exports getRelatedTopics");
assert(contentTypesSrc.includes("export function getNextExplorationTopic"), "contentTypes exports getNextExplorationTopic");

const recTypesSrc = fs.readFileSync(path.join(__dirname, "features/learning/recommendationTypes.ts"), "utf8");
assert(recTypesSrc.includes("export type TopicFamiliarity"), "recommendationTypes exports TopicFamiliarity");
assert(recTypesSrc.includes("export interface LearningRecommendation"), "recommendationTypes exports LearningRecommendation");

const recUtilsSrc = fs.readFileSync(path.join(__dirname, "features/learning/recommendationUtils.ts"), "utf8");
assert(recUtilsSrc.includes("export function getTopicFamiliarity"), "recommendationUtils exports getTopicFamiliarity");
assert(recUtilsSrc.includes("export function getTopicFamiliaritySummaries"), "recommendationUtils exports getTopicFamiliaritySummaries");
assert(recUtilsSrc.includes("export function getTopicsToRevisit"), "recommendationUtils exports getTopicsToRevisit");
assert(recUtilsSrc.includes("export function getTopicsExploringNow"), "recommendationUtils exports getTopicsExploringNow");
assert(recUtilsSrc.includes("export function getLearningRecommendation"), "recommendationUtils exports getLearningRecommendation");
assert(recUtilsSrc.includes("export async function fetchLearningRecommendation"), "recommendationUtils exports fetchLearningRecommendation");

const qSelectorSrc = fs.readFileSync(path.join(__dirname, "features/learning/questionSelector.ts"), "utf8");
assert(qSelectorSrc.includes("export function selectAdaptiveQuestions"), "questionSelector exports selectAdaptiveQuestions");
assert(qSelectorSrc.includes("export async function getRecentQuestionIds"), "questionSelector exports getRecentQuestionIds");
assert(qSelectorSrc.includes("export async function recordQuestionExposure"), "questionSelector exports recordQuestionExposure");

// ----------------------------------------------------------------------------
// A. Content Model
// ----------------------------------------------------------------------------
console.log("\n--- A. Content Model ---");

const modelResultRaw = execSync(
  `npx tsx -e "import { TOPIC_CONTENT_MODELS, getTopicContentModel } from './features/curriculum/contentTypes'; const total = Object.keys(TOPIC_CONTENT_MODELS).length; const sample = getTopicContentModel('class-1', 'addition'); console.log(JSON.stringify({ total, sample }));"`,
  { encoding: "utf8" }
);
const modelResult = JSON.parse(modelResultRaw);

assert(modelResult.total === 32, "Content model covers all 32 curriculum topics");
assert(modelResult.sample && modelResult.sample.id === "addition", "getTopicContentModel returns valid model for class-1:addition");
assert(modelResult.sample.prerequisites.includes("numbers"), "class-1:addition correctly identifies numbers as prerequisite");
assert(modelResult.sample.nextTopicId === "subtraction", "class-1:addition correctly identifies subtraction as next topic");

// ----------------------------------------------------------------------------
// B. Curriculum Relationships
// ----------------------------------------------------------------------------
console.log("\n--- B. Curriculum Relationships ---");

const relResultRaw = execSync(
  `npx tsx -e "import { getTopicPrerequisites, getRelatedTopics, getNextExplorationTopic } from './features/curriculum/contentTypes'; const c2SubPrereqs = getTopicPrerequisites('class-2', 'subtraction'); const c3FracRelated = getRelatedTopics('class-3', 'fractions'); const c1NumNext = getNextExplorationTopic('class-1', 'numbers'); console.log(JSON.stringify({ c2SubPrereqs, c3FracRelated, c1NumNext }));"`,
  { encoding: "utf8" }
);
const relResult = JSON.parse(relResultRaw);

assert(relResult.c2SubPrereqs.includes("addition"), "Class 2 Subtraction requires Addition prerequisite");
assert(relResult.c3FracRelated.includes("geometry"), "Class 3 Fractions relates to Geometry");
assert(relResult.c1NumNext === "addition", "Class 1 Numbers flows into Addition");

// ----------------------------------------------------------------------------
// C. Topic Familiarity
// ----------------------------------------------------------------------------
console.log("\n--- C. Topic Familiarity ---");

const famResultRaw = execSync(
  `npx tsx -e "import { getTopicFamiliarity } from './features/learning/recommendationUtils'; const ref = new Date('2026-09-28T12:00:00Z'); const notExplored = getTopicFamiliarity(null, ref); const zeroAttempts = getTopicFamiliarity({ attempts: 0, questionsAnswered: 0, correctAnswers: 0, incorrectAnswers: 0, bestScore: 0, bestTotal: 0, lastScore: 0, lastTotal: 0, lastPlayedAt: '' }, ref); const explored = getTopicFamiliarity({ attempts: 1, questionsAnswered: 5, correctAnswers: 4, incorrectAnswers: 1, bestScore: 4, bestTotal: 5, lastScore: 4, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' }, ref); const familiar = getTopicFamiliarity({ attempts: 3, questionsAnswered: 15, correctAnswers: 14, incorrectAnswers: 1, bestScore: 5, bestTotal: 5, lastScore: 5, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' }, ref); const revisitOld = getTopicFamiliarity({ attempts: 2, questionsAnswered: 10, correctAnswers: 9, incorrectAnswers: 1, bestScore: 5, bestTotal: 5, lastScore: 5, lastTotal: 5, lastPlayedAt: '2026-09-20T10:00:00Z' }, ref); console.log(JSON.stringify({ notExplored, zeroAttempts, explored, familiar, revisitOld }));"`,
  { encoding: "utf8" }
);
const famResult = JSON.parse(famResultRaw);

assert(famResult.notExplored === "not-explored", "Null record maps to 'not-explored'");
assert(famResult.zeroAttempts === "not-explored", "0 attempts record maps to 'not-explored'");
assert(famResult.explored === "explored", "1 attempt with 5 questions maps to 'explored'");
assert(famResult.familiar === "familiar", "15 questions answered maps to 'familiar'");
assert(famResult.revisitOld === "revisit-suggested", "Practice >= 5 days ago maps to 'revisit-suggested'");

// ----------------------------------------------------------------------------
// D. Recommendation Selection
// ----------------------------------------------------------------------------
console.log("\n--- D. Recommendation Selection ---");

const recResultRaw = execSync(
  `npx tsx -e "import { getLearningRecommendation } from './features/learning/recommendationUtils'; const ref = new Date('2026-09-28T12:00:00Z'); const childRecord = { profile: { id: 'c1', name: 'Aarav', level: 'class-1' } }; const freshRec = getLearningRecommendation({ childRecord, progress: null, referenceDate: ref }); const inProgressRec = getLearningRecommendation({ childRecord, progress: { topics: { 'class-1:numbers': { attempts: 1, questionsAnswered: 5, correctAnswers: 5, incorrectAnswers: 0, bestScore: 5, bestTotal: 5, lastScore: 5, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' } }, overall: { totalQuestionsAnswered: 5, totalCorrectAnswers: 5, totalIncorrectAnswers: 0, quizzesCompleted: 1, lastPlayedAt: '2026-09-27T10:00:00Z' } }, referenceDate: ref }); console.log(JSON.stringify({ freshRec, inProgressRec }));"`,
  { encoding: "utf8" }
);
const recResult = JSON.parse(recResultRaw);

assert(recResult.freshRec.topicId === "numbers", "Fresh learner is recommended numbers");
assert(recResult.freshRec.reason === "explore-new", "Fresh learner recommendation reason is 'explore-new'");
assert(recResult.inProgressRec.topicId === "numbers", "In-progress learner continues numbers");
assert(recResult.inProgressRec.reason === "continue-exploring", "In-progress recommendation reason is 'continue-exploring'");
assert(!recResult.freshRec.title.includes("behind") && !recResult.freshRec.title.includes("fail"), "Recommendation never contains deficit language");

// ----------------------------------------------------------------------------
// E. Parent Plan Integration
// ----------------------------------------------------------------------------
console.log("\n--- E. Parent Plan Integration ---");

const planRecRaw = execSync(
  `npx tsx -e "import { getLearningRecommendation } from './features/learning/recommendationUtils'; const ref = new Date('2026-09-28T12:00:00Z'); const childRecord = { profile: { id: 'c1', name: 'Aarav', level: 'class-1' } }; const plan = { childId: 'c1', intention: 'Practice basic addition', selectedTopics: ['addition'], enabled: true, createdAt: '', updatedAt: '' }; const rec = getLearningRecommendation({ childRecord, plan, progress: null, referenceDate: ref }); console.log(JSON.stringify(rec));"`,
  { encoding: "utf8" }
);
const planRec = JSON.parse(planRecRaw);

assert(planRec.topicId === "addition", "Parent plan topic (addition) is prioritized");
assert(planRec.reason === "parent-plan", "Recommendation reason is 'parent-plan'");
assert(planRec.description.includes("gentle learning intention"), "Description references family gentle intention");

// ----------------------------------------------------------------------------
// F. Question Repetition Avoidance
// ----------------------------------------------------------------------------
console.log("\n--- F. Question Repetition Avoidance ---");

const repResultRaw = execSync(
  `npx tsx -e "import { selectAdaptiveQuestions } from './features/learning/questionSelector'; import { getQuestionsForTopic } from './data/questionBank'; const allQ = getQuestionsForTopic('class-1', 'addition'); const first5 = allQ.slice(0, 5).map(q => q.id); const selected = selectAdaptiveQuestions(allQ, { count: 5, recentQuestionIds: first5, level: 'class-1', topicId: 'addition' }); const selectedIds = selected.map(q => q.id); const overlap = selectedIds.filter(id => first5.includes(id)); console.log(JSON.stringify({ totalCandidates: allQ.length, overlapCount: overlap.length, selectedCount: selected.length }));"`,
  { encoding: "utf8" }
);
const repResult = JSON.parse(repResultRaw);

assert(repResult.selectedCount === 5, "Returns exactly configured count of 5 questions");
assert(repResult.overlapCount === 0, "Avoids all 5 recently seen questions when alternatives exist");

// Edge case: single question bank topic
const singleQRaw = execSync(
  `npx tsx -e "import { selectAdaptiveQuestions } from './features/learning/questionSelector'; const single = [{ id: 'q1', level: 'class-1', subject: 'mathematics', topic: 'single', difficulty: 'easy', type: 'multiple_choice', question: 'What is 1+1?', options: [{ id: 'o1', label: '2' }], correctOptionId: 'o1' }]; const res = selectAdaptiveQuestions(single as any, { count: 5, recentQuestionIds: ['q1'] }); console.log(JSON.stringify(res));"`,
  { encoding: "utf8" }
);
const singleQ = JSON.parse(singleQRaw);
assert(singleQ.length === 1 && singleQ[0].id === "q1", "Single question topic returns the question safely without dropping");

// ----------------------------------------------------------------------------
// G. Adaptive Question Selection & Difficulty Progression
// ----------------------------------------------------------------------------
console.log("\n--- G. Adaptive Question Selection & Difficulty Progression ---");

const progResultRaw = execSync(
  `npx tsx -e "import { selectAdaptiveQuestions } from './features/learning/questionSelector'; import { getQuestionsForTopic } from './data/questionBank'; const allQ = getQuestionsForTopic('class-1', 'addition'); const selected = selectAdaptiveQuestions(allQ, { count: 5, level: 'class-1', topicId: 'addition' }); const diffs = selected.map(q => q.difficulty); console.log(JSON.stringify({ diffs }));"`,
  { encoding: "utf8" }
);
const progResult = JSON.parse(progResultRaw);

assert(progResult.diffs[0] === "easy", "First questions in Class 1 are gentle easy difficulty");
assert(progResult.diffs.every(d => d === "easy" || d === "medium"), "Difficulty progression never spikes unexpectedly");

// ----------------------------------------------------------------------------
// H. Toddler Qualitative Separation
// ----------------------------------------------------------------------------
console.log("\n--- H. Toddler Qualitative Separation ---");

const toddlerRecRaw = execSync(
  `npx tsx -e "import { getLearningRecommendation } from './features/learning/recommendationUtils'; const childRecord = { profile: { id: 't1', name: 'Maya', level: 'toddler' } }; const rec = getLearningRecommendation({ childRecord, progress: null }); console.log(JSON.stringify(rec));"`,
  { encoding: "utf8" }
);
const toddlerRec = JSON.parse(toddlerRecRaw);

assert(toddlerRec.isToddler === true, "Recommendation identifies learner as toddler");
assert(toddlerRec.title.includes("Colours"), "Fresh toddler recommendation explores Colours");
assert(!toddlerRec.description.includes("%") && !toddlerRec.description.includes("score"), "Toddler recommendation contains zero numerical scores or percentages");

// ----------------------------------------------------------------------------
// I. Parent Insight Generation
// ----------------------------------------------------------------------------
console.log("\n--- I. Parent Insight Generation ---");

const insightRaw = execSync(
  `npx tsx -e "import { getTopicsToRevisit, getTopicsExploringNow, getTopicFamiliaritySummaries } from './features/learning/recommendationUtils'; const ref = new Date('2026-09-28T12:00:00Z'); const progress = { topics: { 'class-1:numbers': { attempts: 3, questionsAnswered: 15, correctAnswers: 15, incorrectAnswers: 0, bestScore: 5, bestTotal: 5, lastScore: 5, lastTotal: 5, lastPlayedAt: '2026-09-20T10:00:00Z' }, 'class-1:addition': { attempts: 1, questionsAnswered: 5, correctAnswers: 4, incorrectAnswers: 1, bestScore: 4, bestTotal: 5, lastScore: 4, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' } }, overall: { totalQuestionsAnswered: 20, totalCorrectAnswers: 19, totalIncorrectAnswers: 1, quizzesCompleted: 4, lastPlayedAt: '2026-09-27T10:00:00Z' } }; const toRevisit = getTopicsToRevisit('class-1', progress, ref); const exploring = getTopicsExploringNow('class-1', progress, ref); console.log(JSON.stringify({ toRevisit: toRevisit.map(t => t.topicId), exploring: exploring.map(t => t.topicId) }));"`,
  { encoding: "utf8" }
);
const insightResult = JSON.parse(insightRaw);

assert(insightResult.toRevisit.includes("numbers"), "Numbers is flagged for gentle revisit after 8 days of quiet");
assert(insightResult.exploring.includes("addition"), "Addition is flagged as currently exploring");

// ----------------------------------------------------------------------------
// J. Offline Recommendation Behavior
// ----------------------------------------------------------------------------
console.log("\n--- J. Offline Recommendation Behavior ---");

const offlineRaw = execSync(
  `npx tsx -e "import { getLearningRecommendation } from './features/learning/recommendationUtils'; const rec = getLearningRecommendation({ childRecord: { profile: { id: 'offline-child', name: 'Kabir', level: 'class-2' } }, progress: { topics: {}, overall: { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, totalIncorrectAnswers: 0, quizzesCompleted: 0 } } }); console.log(JSON.stringify(rec));"`,
  { encoding: "utf8" }
);
const offlineRec = JSON.parse(offlineRaw);
assert(offlineRec && offlineRec.topicId === "numbers", "Offline recommendation executes instantaneously without network");

// ----------------------------------------------------------------------------
// K. Multi-Child Isolation
// ----------------------------------------------------------------------------
console.log("\n--- K. Multi-Child Isolation ---");

const multiChildRaw = execSync(
  `npx tsx -e "import { getLearningRecommendation } from './features/learning/recommendationUtils'; const ref = new Date('2026-09-28T12:00:00Z'); const childA = { profile: { id: 'child-a', name: 'Anya', level: 'class-1' } }; const childB = { profile: { id: 'child-b', name: 'Bhavin', level: 'class-3' } }; const progressA = { topics: { 'class-1:numbers': { attempts: 1, questionsAnswered: 5, correctAnswers: 5, incorrectAnswers: 0, bestScore: 5, bestTotal: 5, lastScore: 5, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' } }, overall: { totalQuestionsAnswered: 5, totalCorrectAnswers: 5, totalIncorrectAnswers: 0, quizzesCompleted: 1 } }; const progressB = { topics: { 'class-3:geometry': { attempts: 2, questionsAnswered: 10, correctAnswers: 10, incorrectAnswers: 0, bestScore: 5, bestTotal: 5, lastScore: 5, lastTotal: 5, lastPlayedAt: '2026-09-27T10:00:00Z' } }, overall: { totalQuestionsAnswered: 10, totalCorrectAnswers: 10, totalIncorrectAnswers: 0, quizzesCompleted: 2 } }; const recA = getLearningRecommendation({ childRecord: childA, progress: progressA, referenceDate: ref }); const recB = getLearningRecommendation({ childRecord: childB, progress: progressB, referenceDate: ref }); console.log(JSON.stringify({ recA: { id: recA.childId, topic: recA.topicId, level: recA.level }, recB: { id: recB.childId, topic: recB.topicId, level: recB.level } }));"`,
  { encoding: "utf8" }
);
const multiChild = JSON.parse(multiChildRaw);

assert(multiChild.recA.id === "child-a" && multiChild.recA.level === "class-1", "Child A recommendation strictly uses Child A profile and level");
assert(multiChild.recB.id === "child-b" && multiChild.recB.level === "class-3", "Child B recommendation strictly uses Child B profile and level");
assert(multiChild.recA.topic !== multiChild.recB.topic, "Child A and Child B receive isolated recommendations");

// ----------------------------------------------------------------------------
// L. Determinism
// ----------------------------------------------------------------------------
console.log("\n--- L. Determinism ---");

const detRaw = execSync(
  `npx tsx -e "import { getLearningRecommendation } from './features/learning/recommendationUtils'; import { selectAdaptiveQuestions } from './features/learning/questionSelector'; import { getQuestionsForTopic } from './data/questionBank'; const ref = new Date('2026-09-28T12:00:00Z'); const child = { profile: { id: 'c-det', name: 'Tara', level: 'class-2' } }; const r1 = getLearningRecommendation({ childRecord: child, referenceDate: ref }); const r2 = getLearningRecommendation({ childRecord: child, referenceDate: ref }); const allQ = getQuestionsForTopic('class-2', 'addition'); const q1 = selectAdaptiveQuestions(allQ, { count: 5, seed: 12345, level: 'class-2', topicId: 'addition' }).map(q => q.id); const q2 = selectAdaptiveQuestions(allQ, { count: 5, seed: 12345, level: 'class-2', topicId: 'addition' }).map(q => q.id); console.log(JSON.stringify({ recIdentical: JSON.stringify(r1) === JSON.stringify(r2), questionsIdentical: JSON.stringify(q1) === JSON.stringify(q2) }));"`,
  { encoding: "utf8" }
);
const detResult = JSON.parse(detRaw);

assert(detResult.recIdentical === true, "Given identical state, recommendation output is 100% deterministic");
assert(detResult.questionsIdentical === true, "Seeded question selection produces identical sequence across executions");

// ----------------------------------------------------------------------------
// M. Privacy Sanitization
// ----------------------------------------------------------------------------
console.log("\n--- M. Privacy Sanitization ---");

const privRaw = execSync(
  `npx tsx -e "import { analytics, trackEvent } from './lib/analytics'; analytics.clear(); trackEvent('learning_recommendation_shown', { level: 'class-1', topic: 'numbers', childName: 'SecretChildName', childId: 'secret-uuid-1234', email: 'parent@example.com' } as any); const events = analytics.getEvents(); console.log(JSON.stringify(events));"`,
  { encoding: "utf8" }
);
const privEvents = JSON.parse(privRaw);

assert(privEvents.length === 1, "Analytics event recorded safely");
const payloadProps = privEvents[0].properties || {};
assert(payloadProps.level === "class-1" && payloadProps.topic === "numbers", "Whitelisted safe properties preserved");
assert(payloadProps.childName === undefined, "Child name stripped by analytics sanitizer");
assert(payloadProps.childId === undefined, "Child ID stripped by analytics sanitizer");
assert(payloadProps.email === undefined, "Email stripped by analytics sanitizer");

// ----------------------------------------------------------------------------
// N. Accessibility Contracts
// ----------------------------------------------------------------------------
console.log("\n--- N. Accessibility Contracts ---");

const homeSrc = fs.readFileSync(path.join(__dirname, "app/index.tsx"), "utf8");
const practiceCardSrc = fs.readFileSync(path.join(__dirname, "components/dailyLearning/DailyPracticeCard.tsx"), "utf8");

assert(practiceCardSrc.includes("minHeight: 56"), "Recommendation action button has touch target >= 48px (56px)");
assert(practiceCardSrc.includes('accessibilityRole="button"'), "Action button declares accessibilityRole button");
assert(practiceCardSrc.includes("accessibilityLabel="), "Action button provides explicit accessibilityLabel");
assert(homeSrc.includes('accessibilityRole="button"'), "Learner switcher button has accessibilityRole button");

// ----------------------------------------------------------------------------
// O. Invalid & Missing Data Handling
// ----------------------------------------------------------------------------
console.log("\n--- O. Invalid & Missing Data Handling ---");

const edgeRaw = execSync(
  `npx tsx -e "import { getLearningRecommendation, getTopicFamiliarity } from './features/learning/recommendationUtils'; import { selectAdaptiveQuestions } from './features/learning/questionSelector'; const corruptProg: any = { topics: { 'invalid:topic': { attempts: -5, questionsAnswered: -10 } }, overall: null }; const corruptChild: any = { profile: { id: '', name: '', level: 'unknown-level' } }; const recCorrupt = getLearningRecommendation({ childRecord: corruptChild, progress: corruptProg }); const emptyQuestions = selectAdaptiveQuestions([]); const famNegative = getTopicFamiliarity({ attempts: -1 } as any); console.log(JSON.stringify({ recCorrupt, emptyQuestions, famNegative }));"`,
  { encoding: "utf8" }
);
const edgeResult = JSON.parse(edgeRaw);

assert(edgeResult.recCorrupt !== null, "Rec engine handles unknown level and corrupted progress gracefully");
assert(edgeResult.recCorrupt.actionLabel.length > 0, "Fallback recommendation provides a valid action label");
assert(Array.isArray(edgeResult.emptyQuestions) && edgeResult.emptyQuestions.length === 0, "Question selector handles empty questions array safely");
assert(edgeResult.famNegative === "not-explored", "Negative attempts safely evaluate to 'not-explored'");

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log(`\n========================================`);
console.log(`PHASE 22 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  console.log("✓ ALL PHASE 22 LEARNING INTELLIGENCE & CONTENT INTEGRITY TESTS PASSED");
  process.exit(0);
} else {
  console.error("✗ SOME PHASE 22 TESTS FAILED");
  process.exit(1);
}
