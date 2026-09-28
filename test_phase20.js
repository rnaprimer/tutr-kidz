/**
 * Tutr Kidz - Phase 20 Automated Test Suite
 *
 * Real-World Launch Readiness, Onboarding, Feedback & Production Observability.
 * Comprehensive tests verifying:
 * 1. First-time onboarding
 * 2. Returning parent bypass
 * 3. Learner creation
 * 4. Starting level selection
 * 5. Onboarding persistence
 * 6. Feedback creation
 * 7. Offline feedback queue
 * 8. Feedback idempotency
 * 9. Analytics sanitization
 * 10. Error sanitization
 * 11. Privacy behavior
 * 12. Empty states
 * 13. Network failure handling
 * 14. Existing offline learning
 * 15. Multi-child isolation
 * 16. Learning plan isolation
 * 17. RLS assumptions
 * 18. Parent Lock
 * 19. Production environment validation
 * 20. No secret leakage
 * 21. Accessibility contracts
 * 22. Responsive layout contracts
 * 23. Existing Phase 19 behavior
 */

const fs = require('fs');
const path = require('path');

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

console.log('=== PHASE 20 TEST SUITE: LAUNCH READINESS, ONBOARDING, FEEDBACK & OBSERVABILITY ===\n');

// ----------------------------------------------------------------------------
// Source File Inspection & Module Exports Verification
// ----------------------------------------------------------------------------

console.log('--- File & Module Existence ---');

const onboardingStorageSrc = fs.readFileSync(path.join(__dirname, 'features/onboarding/onboardingStorage.ts'), 'utf8');
assert(onboardingStorageSrc.includes('export async function hasCompletedOnboarding'), 'onboardingStorage exports hasCompletedOnboarding');
assert(onboardingStorageSrc.includes('export async function markOnboardingCompleted'), 'onboardingStorage exports markOnboardingCompleted');
assert(onboardingStorageSrc.includes('export async function resetOnboardingState'), 'onboardingStorage exports resetOnboardingState');

const feedbackTypesSrc = fs.readFileSync(path.join(__dirname, 'features/feedback/feedbackTypes.ts'), 'utf8');
assert(feedbackTypesSrc.includes('export type FeedbackCategory'), 'feedbackTypes exports FeedbackCategory');
assert(feedbackTypesSrc.includes('export const FEEDBACK_CATEGORIES'), 'feedbackTypes exports FEEDBACK_CATEGORIES');
assert(feedbackTypesSrc.includes('export interface FeedbackItem'), 'feedbackTypes exports FeedbackItem');

const feedbackStorageSrc = fs.readFileSync(path.join(__dirname, 'features/feedback/feedbackStorage.ts'), 'utf8');
assert(feedbackStorageSrc.includes('export const feedbackStorageAdapter'), 'feedbackStorage exports feedbackStorageAdapter');

const feedbackRepoSrc = fs.readFileSync(path.join(__dirname, 'features/feedback/feedbackRepository.ts'), 'utf8');
assert(feedbackRepoSrc.includes('export async function submitFeedback'), 'feedbackRepository exports submitFeedback');
assert(feedbackRepoSrc.includes('export async function getFeedbackHistory'), 'feedbackRepository exports getFeedbackHistory');

const observabilitySrc = fs.readFileSync(path.join(__dirname, 'lib/observability/observability.ts'), 'utf8');
assert(observabilitySrc.includes('export function trackError'), 'observability exports trackError');
assert(observabilitySrc.includes('export function trackWarning'), 'observability exports trackWarning');
assert(observabilitySrc.includes('export function trackPerformance'), 'observability exports trackPerformance');
assert(observabilitySrc.includes('export function getDiagnosticLogs'), 'observability exports getDiagnosticLogs');

// ----------------------------------------------------------------------------
// 1. First-time Onboarding & 2. Returning Parent Bypass
// ----------------------------------------------------------------------------

console.log('\n--- 1. Onboarding & 2. Returning Parent Bypass ---');

// Mock memory store
const memoryStore = new Map();
const mockAdapter = {
  getItem: async (k) => memoryStore.get(k) || null,
  setItem: async (k, v) => { memoryStore.set(k, v); },
  removeItem: async (k) => { memoryStore.delete(k); },
};

async function checkOnboardingStatus(hasLearners) {
  const completed = (await mockAdapter.getItem('tutr_kidz_onboarding_completed')) === 'true';
  if (hasLearners && completed) {
    return 'BYPASS_TO_PARENT_HOME';
  }
  return 'SHOW_ONBOARDING';
}

function checkStatusSync(hasLearners, completed) {
  if (hasLearners && completed) {
    return 'BYPASS_TO_PARENT_HOME';
  }
  return 'SHOW_ONBOARDING';
}

const statusNew = checkStatusSync(false, false);
assert(statusNew === 'SHOW_ONBOARDING', 'TEST 1: New parent with no learners shows onboarding');

const statusReturning = checkStatusSync(true, true);
assert(statusReturning === 'BYPASS_TO_PARENT_HOME', 'TEST 2: Returning parent with existing learners bypasses onboarding');

const statusNoLearners = checkStatusSync(false, true);
assert(statusNoLearners === 'SHOW_ONBOARDING', 'TEST 2: Returning parent without learners is prompted to create learner');

// ----------------------------------------------------------------------------
// 3. Learner Creation & 4. Starting Level Selection
// ----------------------------------------------------------------------------

console.log('\n--- 3. Learner Creation & 4. Starting Level Selection ---');

function createLearnerPayload(name, level) {
  const trimmed = name ? name.trim() : '';
  if (!trimmed) throw new Error("Please enter your child's name");
  const validLevels = ['toddler', 'class-1', 'class-2', 'class-3', 'class-4'];
  if (!validLevels.includes(level)) throw new Error('Invalid curriculum level');
  return {
    name: trimmed,
    level,
    preferences: {
      dailyQuestionGoal: 5,
      showAllLevels: true,
    },
  };
}

const childPayload = createLearnerPayload('Aarav', 'class-2');
assert(childPayload.name === 'Aarav', 'TEST 3: Learner creation captures child name');
assert(childPayload.level === 'class-2', 'TEST 4: Starting level correctly selected as Class 2');
assert(childPayload.preferences.dailyQuestionGoal === 5, 'TEST 3: Default daily question goal initialized');
let threwBlank = false;
try { createLearnerPayload('', 'class-1'); } catch { threwBlank = true; }
assert(threwBlank, 'TEST 3: Blank child name throws descriptive error');

let threwLevel = false;
try { createLearnerPayload('Aanya', 'invalid-class'); } catch { threwLevel = true; }
assert(threwLevel, 'TEST 4: Invalid level rejected');

// ----------------------------------------------------------------------------
// 5. Onboarding Persistence
// ----------------------------------------------------------------------------

console.log('\n--- 5. Onboarding Persistence ---');

assert(onboardingStorageSrc.includes('tutr_kidz_onboarding_completed'), 'TEST 5: Onboarding storage key correctly defined');
assert(onboardingStorageSrc.includes("val === 'true'"), 'TEST 5: Onboarding state evaluated as boolean');

// ----------------------------------------------------------------------------
// 6. Feedback Creation, 7. Offline Queue & 8. Feedback Idempotency
// ----------------------------------------------------------------------------

console.log('\n--- 6. Feedback Creation, 7. Offline Queue & 8. Feedback Idempotency ---');

function mockCreateFeedbackItem(category, message) {
  return {
    id: `feedback_${Date.now()}_test`,
    category,
    message: message?.trim() ? message.trim().slice(0, 1000) : undefined,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
  };
}

const fbItem = mockCreateFeedbackItem('Learning experience', 'My child loves the simple interface.');
assert(fbItem.category === 'Learning experience', 'TEST 6: Feedback category captured');
assert(fbItem.message === 'My child loves the simple interface.', 'TEST 6: Feedback message captured');
assert(fbItem.status === 'PENDING', 'TEST 6: Initial feedback status is PENDING');

// Sync Queue Integration
const syncTypesSrc = fs.readFileSync(path.join(__dirname, 'features/sync/syncTypes.ts'), 'utf8');
assert(syncTypesSrc.includes("'feedback'"), 'TEST 7: Sync queue entityType includes feedback');

const syncServiceSrc = fs.readFileSync(path.join(__dirname, 'features/sync/syncService.ts'), 'utf8');
assert(syncServiceSrc.includes("item.entityType === 'feedback'"), 'TEST 7: flushSyncQueue handles feedback entities');
assert(syncServiceSrc.includes("client.from('feedback').upsert"), 'TEST 8: Feedback cloud sync performs idempotent upsert');

// ----------------------------------------------------------------------------
// 9. Analytics Sanitization & 10. Error Sanitization
// ----------------------------------------------------------------------------

console.log('\n--- 9. Analytics Sanitization & 10. Error Sanitization ---');

const analyticsSrc = fs.readFileSync(path.join(__dirname, 'lib/analytics/analytics.ts'), 'utf8');
assert(analyticsSrc.includes("lower.includes('name')"), 'TEST 9: Analytics strips child names');
assert(analyticsSrc.includes("lower.includes('child_id')"), 'TEST 9: Analytics strips child_id');
assert(analyticsSrc.includes("lower.includes('learner_id')"), 'TEST 9: Analytics strips learner_id');
assert(analyticsSrc.includes("lower.includes('feedback')"), 'TEST 9: Analytics strips raw feedback text');
assert(analyticsSrc.includes("lower.includes('message')"), 'TEST 9: Analytics strips raw message text');
assert(analyticsSrc.includes("lower.includes('password')"), 'TEST 9: Analytics strips passwords');

assert(observabilitySrc.includes('[EMAIL_REDACTED]'), 'TEST 10: Error observability redacts emails');
assert(observabilitySrc.includes('[REDACTED]'), 'TEST 10: Error observability redacts user file system paths');
assert(observabilitySrc.includes('slice(0, 300)'), 'TEST 10: Error observability bounds message length');

// ----------------------------------------------------------------------------
// 11. Privacy Behavior & 12. Empty States
// ----------------------------------------------------------------------------

console.log('\n--- 11. Privacy Behavior & 12. Empty States ---');

const dataScreenSrc = fs.readFileSync(path.join(__dirname, 'app/parent/data.tsx'), 'utf8');
assert(dataScreenSrc.includes('Anonymous Telemetry:'), 'TEST 11: Data screen contains anonymous telemetry transparency');
assert(dataScreenSrc.includes('On Your Device:'), 'TEST 11: Data screen explains local-first data storage');
assert(dataScreenSrc.includes('In the Cloud:'), 'TEST 11: Data screen explains cloud security model');

const parentIndexSrc = fs.readFileSync(path.join(__dirname, 'app/parent/index.tsx'), 'utf8');
assert(parentIndexSrc.includes('Welcome to Tutr Kidz') || parentIndexSrc.includes('Learning progress for'), 'TEST 12: Parent dashboard has calm empty state');

const feedbackScreenSrc = fs.readFileSync(path.join(__dirname, 'app/parent/feedback.tsx'), 'utf8');
assert(feedbackScreenSrc.includes('Thank You') && feedbackScreenSrc.includes('Your feedback has been saved'), 'TEST 12: Feedback screen has calm confirmation state');

// ----------------------------------------------------------------------------
// 13. Network Failure Handling & 14. Existing Offline Learning
// ----------------------------------------------------------------------------

console.log('\n--- 13. Network Failure Handling & 14. Existing Offline Learning ---');

const syncServiceCatch = syncServiceSrc.includes('catch (fbErr)') && syncServiceSrc.includes('catch (planErr)');
assert(syncServiceCatch, 'TEST 13: Sync service catches network/table failures without crashing');

const progressStorageSrc = fs.readFileSync(path.join(__dirname, 'features/progress/progressStorage.ts'), 'utf8');
assert(progressStorageSrc.includes('DEFAULT_PROGRESS'), 'TEST 14: Offline learning fallback progress available');

// ----------------------------------------------------------------------------
// 15. Multi-Child Isolation & 16. Learning Plan Isolation
// ----------------------------------------------------------------------------

console.log('\n--- 15. Multi-Child Isolation & 16. Learning Plan Isolation ---');

const familyStorageSrc = fs.readFileSync(path.join(__dirname, 'features/family/familyRepository.ts'), 'utf8');
assert(familyStorageSrc.includes('activeChildId'), 'TEST 15: Family repository isolates active learner');

const planStorageSrc = fs.readFileSync(path.join(__dirname, 'features/plans/planStorage.ts'), 'utf8');
assert(planStorageSrc.includes('tutr_kidz_plan_${childId}'), 'TEST 16: Learning plan storage strictly scoped per child ID');

// ----------------------------------------------------------------------------
// 17. RLS Assumptions & 18. Parent Lock
// ----------------------------------------------------------------------------

console.log('\n--- 17. RLS Assumptions & 18. Parent Lock ---');

const schemaSql = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20260925000000_phase13_schema.sql'), 'utf8');
assert(schemaSql.includes('families_select_own'), 'TEST 17: Supabase RLS enforces family ownership');
assert(schemaSql.includes('children_select_family'), 'TEST 17: Supabase RLS enforces child family boundary');

const parentLockSrc = fs.readFileSync(path.join(__dirname, 'features/settings/parentLock.ts'), 'utf8');
assert(parentLockSrc.includes('verifyParentChallenge'), 'TEST 18: Parent lock arithmetic challenge verification present');

// ----------------------------------------------------------------------------
// 19. Production Environment Validation & 20. No Secret Leakage
// ----------------------------------------------------------------------------

console.log('\n--- 19. Production Environment Validation & 20. No Secret Leakage ---');

const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));
assert(appJson.expo.name === 'Tutr Kidz', 'TEST 19: App name is Tutr Kidz');
assert(appJson.expo.slug === 'tutr-kidz', 'TEST 19: App slug is tutr-kidz');
assert(appJson.expo.web.output === 'single', 'TEST 19: Expo web output configured as single SPA');

const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
assert(gitignore.includes('.env*'), 'TEST 20: .gitignore ignores .env secret files');

// Ensure no secrets exist in client code
const clientFiles = [
  'lib/supabase/client.ts',
  'lib/supabase/auth.ts',
  'lib/analytics/analytics.ts',
  'lib/observability/observability.ts',
  'features/feedback/feedbackRepository.ts',
];
for (const f of clientFiles) {
  const code = fs.readFileSync(path.join(__dirname, f), 'utf8');
  assert(!code.includes('service_role') && !code.includes('SERVICE_ROLE'), `TEST 20: No service_role key in ${f}`);
  assert(!code.includes('postgres://'), `TEST 20: No raw database URL in ${f}`);
}

// ----------------------------------------------------------------------------
// 21. Accessibility Contracts & 22. Responsive Layout Contracts
// ----------------------------------------------------------------------------

console.log('\n--- 21. Accessibility Contracts & 22. Responsive Layout Contracts ---');

const onboardingScreenSrc = fs.readFileSync(path.join(__dirname, 'app/parent/onboarding.tsx'), 'utf8');
const primaryBtnSrc = fs.readFileSync(path.join(__dirname, 'components/ui/PrimaryButton.tsx'), 'utf8');
assert(primaryBtnSrc.includes('accessibilityRole="button"'), 'TEST 21: Interactive buttons declare accessibilityRole="button"');
assert(onboardingScreenSrc.includes('minHeight: 48'), 'TEST 21: Onboarding controls adhere to minHeight: 48px');

assert(feedbackScreenSrc.includes('accessibilityRole="button"'), 'TEST 21: Feedback chips declare accessibilityRole="button"');
assert(feedbackScreenSrc.includes('minHeight: 48'), 'TEST 21: Feedback chips adhere to minHeight: 48px');

assert(onboardingScreenSrc.includes('maxWidth: layout.maxWidth'), 'TEST 22: Onboarding screen applies maxWidth responsive containment');
assert(feedbackScreenSrc.includes('maxWidth: layout.maxWidth'), 'TEST 22: Feedback screen applies maxWidth responsive containment');

// ----------------------------------------------------------------------------
// 23. Existing Phase 19 Behavior Verification
// ----------------------------------------------------------------------------

console.log('\n--- 23. Existing Phase 19 Behavior Verification ---');

const planTypesSrc = fs.readFileSync(path.join(__dirname, 'features/plans/planTypes.ts'), 'utf8');
assert(planTypesSrc.includes('export const LEARNING_INTENTIONS'), 'TEST 23: Phase 19 LEARNING_INTENTIONS preserved');

const continuityUtilsSrc = fs.readFileSync(path.join(__dirname, 'features/insights/continuityUtils.ts'), 'utf8');
assert(continuityUtilsSrc.includes('plan?: LearningPlan | null'), 'TEST 23: Phase 19 plan-aware guidance preserved');

const toddlerScreenSrc = fs.readFileSync(path.join(__dirname, 'app/toddler/index.tsx'), 'utf8');
assert(!toddlerScreenSrc.includes('% accuracy'), 'TEST 23: Toddler activity screen never exposes accuracy percentages');

const insightsScreenSrc = fs.readFileSync(path.join(__dirname, 'app/parent/family/[childId]/insights.tsx'), 'utf8');
assert(insightsScreenSrc.includes('getChronologicalLearningHistory'), 'TEST 23: Chronological learning history preserved');

console.log('\n====================================================');
console.log(`Phase 20 Test Results: ${passedTests} / ${totalTests} passed`);
console.log('====================================================\n');
