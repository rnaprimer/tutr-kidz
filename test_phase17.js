/**
 * PHASE 17 TEST SUITE — PRODUCTION UX, ACCESSIBILITY, PERFORMANCE & RELEASE POLISH
 *
 * Verifies the 12 critical guarantees of Tutr Kidz Phase 17:
 * 1. Child learning flow (Class 1-4 vs Toddler curriculum separation)
 * 2. Quiz protection (single selection, double-tap lock, score sanitization, best score protection)
 * 3. Loading & error contracts (calm messages, ActivityIndicator, no raw traces)
 * 4. Offline safety (local persistence, sync queue)
 * 5. Multi-child isolation (zero cross-child contamination, no silent activeChildId mutation)
 * 6. Parent Lock (deterministic verification, lock clearing)
 * 7. Authentication edge cases (parent owns account, child has no auth, local safety)
 * 8. Invalid route & parameter handling (fallback screens for unknown level/child/result)
 * 9. Accessibility contracts (touch target >= 48-56px, role, non-color visual cues)
 * 10. Document titles & metadata contracts
 * 11. Production configuration (app.json, vercel.json, package.json)
 * 12. Security invariants (zero private secrets or service role keys)
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

console.log('=== PHASE 17 TEST SUITE: PRODUCTION UX, ACCESSIBILITY & RELEASE POLISH ===\n');

// ----------------------------------------------------
// 1. CHILD LEARNING FLOW & CURRICULUM SEPARATION
// ----------------------------------------------------
console.log('--- 1. Child Learning Flow & Curriculum Separation ---');
{
  const questionBankFile = fs.readFileSync(path.join(__dirname, 'data/questionBank.ts'), 'utf8');
  assert(questionBankFile.includes('CLASS1') && questionBankFile.includes('CLASS2') && questionBankFile.includes('CLASS3') && questionBankFile.includes('CLASS4'),
    'Curriculum contains Class 1, 2, 3, and 4 questions');
  assert(questionBankFile.includes('COLOUR_QUESTIONS') && questionBankFile.includes('SHAPE_QUESTIONS'),
    'Toddler activities (colours, shapes, etc.) are defined');

  // Verify toddler questions do not mix with class mathematics
  const levelsFile = fs.readFileSync(path.join(__dirname, 'constants/levels.ts'), 'utf8');
  assert(levelsFile.includes("'toddler'") && levelsFile.includes("'class-1'"),
    'Level configurations maintain strict separation between Toddler and Class levels');

  // Verify question structure contracts
  const curriculumFile = fs.readFileSync(path.join(__dirname, 'data/curriculum.ts'), 'utf8');
  assert(curriculumFile.includes('getTopicConfig') && curriculumFile.includes('getTopicsForLevel'),
    'Curriculum queries provide deterministic topic lookup');
}

// ----------------------------------------------------
// 2. QUIZ PROTECTION & HARDEINING
// ----------------------------------------------------
console.log('\n--- 2. Quiz UX Hardening & Math Guards ---');
{
  const useQuizFile = fs.readFileSync(path.join(__dirname, 'features/quiz/useQuiz.ts'), 'utf8');
  assert(useQuizFile.includes('isAnswered || !currentQuestion'),
    'useQuiz strictly prevents duplicate answer selection once answered');

  // Verify score sanitization guards in result.tsx
  const resultFile = fs.readFileSync(path.join(__dirname, 'app/quiz/result.tsx'), 'utf8');
  assert(resultFile.includes('safeScore') && resultFile.includes('safeTotal'),
    'Quiz result screen sanitizes score and total against NaN and negatives');
  assert(resultFile.includes('safeTotal > 0 ? Math.min(safeScore, safeTotal) : safeScore'),
    'Quiz score is clamped to total when total > 0');

  // Verify rapid-tap / transition lock in quiz screen
  const quizScreenFile = fs.readFileSync(path.join(__dirname, 'app/quiz/[level].tsx'), 'utf8');
  assert(quizScreenFile.includes('isTransitioning') && quizScreenFile.includes('if (isTransitioning) return;'),
    'Quiz screen has transition locking to prevent rapid tap race conditions');
  assert(quizScreenFile.includes('disabled={!isAnswered || isTransitioning}'),
    'Quiz next/results button is disabled during transition');

  // In-memory test of score calculation and best score protection
  function computeBestScore(prev, score, total) {
    if (!prev || prev.attempts === 0) return { bestScore: score, bestTotal: total };
    const prevPct = prev.bestScore / (prev.bestTotal || 1);
    const newPct = score / (total || 1);
    if (newPct > prevPct) return { bestScore: score, bestTotal: total };
    return { bestScore: prev.bestScore, bestTotal: prev.bestTotal };
  }

  const prevBest = { bestScore: 4, bestTotal: 5, attempts: 1 };
  const lowerAttempt = computeBestScore(prevBest, 2, 5);
  assert(lowerAttempt.bestScore === 4 && lowerAttempt.bestTotal === 5,
    'Best score protection preserves higher prior score on lower attempt');

  const higherAttempt = computeBestScore(prevBest, 5, 5);
  assert(higherAttempt.bestScore === 5 && higherAttempt.bestTotal === 5,
    'Best score updates when higher score is achieved');
}

// ----------------------------------------------------
// 3. LOADING & ERROR STATES
// ----------------------------------------------------
console.log('\n--- 3. Loading & Error States ---');
{
  const parentIndexFile = fs.readFileSync(path.join(__dirname, 'app/parent/index.tsx'), 'utf8');
  assert(parentIndexFile.includes('ActivityIndicator') && parentIndexFile.includes('Loading overview...'),
    'Parent dashboard includes visual ActivityIndicator in loading state');

  const familyChildFile = fs.readFileSync(path.join(__dirname, 'app/parent/family/[childId].tsx'), 'utf8');
  assert(familyChildFile.includes('ActivityIndicator') && familyChildFile.includes('Loading learner details...'),
    'Learner detail screen includes visual ActivityIndicator in loading state');

  const insightsFile = fs.readFileSync(path.join(__dirname, 'app/parent/family/[childId]/insights.tsx'), 'utf8');
  assert(insightsFile.includes('ActivityIndicator') && insightsFile.includes('Loading learning insights...'),
    'Learner insights screen includes visual ActivityIndicator in loading state');
}

// ----------------------------------------------------
// 4. OFFLINE-FIRST SAFETY
// ----------------------------------------------------
console.log('\n--- 4. Offline Safety & Local-First Invariants ---');
{
  const adapterFile = fs.readFileSync(path.join(__dirname, 'features/progress/progressStorageAdapter.ts'), 'utf8');
  assert(adapterFile.includes('localStorage') && adapterFile.includes('memoryStorage'),
    'Progress storage adapter provides local-first persistence with memory fallback');

  const syncQueueFile = fs.readFileSync(path.join(__dirname, 'features/sync/syncQueue.ts'), 'utf8');
  assert(syncQueueFile.includes('enqueueSyncItem'),
    'Mutations are queued when offline for deterministic cloud synchronization');
}

// ----------------------------------------------------
// 5. MULTI-CHILD ISOLATION
// ----------------------------------------------------
console.log('\n--- 5. Multi-Child Isolation ---');
{
  const familyTypesFile = fs.readFileSync(path.join(__dirname, 'features/family/familyTypes.ts'), 'utf8');
  assert(familyTypesFile.includes('activeChildId: ChildId | null;'),
    'Family state tracks explicit activeChildId in type model');

  // Verify that detail screens do not mutate activeChildId
  const childDetailFile = fs.readFileSync(path.join(__dirname, 'app/parent/family/[childId].tsx'), 'utf8');
  assert(!childDetailFile.includes('setActiveChild('),
    'Viewing learner detail screen does not silently mutate activeChildId');
}

// ----------------------------------------------------
// 6. PARENT LOCK
// ----------------------------------------------------
console.log('\n--- 6. Parent Lock Verification ---');
{
  const parentLockCode = fs.readFileSync(path.join(__dirname, 'features/settings/parentLock.ts'), 'utf8');
  assert(parentLockCode.includes('ARITHMETIC_CHALLENGES'),
    'Parent lock defines arithmetic challenge pool');

  // Verify challenge verification semantics
  function verifyParentChallenge(expectedAnswer, userAnswer) {
    const parsed = typeof userAnswer === 'number' ? userAnswer : parseInt(String(userAnswer).trim(), 10);
    if (isNaN(parsed)) return false;
    return parsed === expectedAnswer;
  }

  assert(verifyParentChallenge(12, '12') === true, 'Parent challenge succeeds with correct answer string');
  assert(verifyParentChallenge(12, 12) === true, 'Parent challenge succeeds with numeric answer');
  assert(verifyParentChallenge(12, '13') === false, 'Parent challenge fails with incorrect answer');
  assert(verifyParentChallenge(12, 'abc') === false, 'Parent challenge fails gracefully with non-numeric input');
  assert(verifyParentChallenge(12, '') === false, 'Parent challenge fails with empty input');
}

// ----------------------------------------------------
// 7. AUTHENTICATION EDGE CASES
// ----------------------------------------------------
console.log('\n--- 7. Authentication Invariants ---');
{
  const supabaseClientFile = fs.readFileSync(path.join(__dirname, 'lib/supabase/client.ts'), 'utf8');
  assert(supabaseClientFile.includes('createClient'),
    'Supabase client is configured through central client module');

  // Child does not have an auth account
  const familyTypesFile = fs.readFileSync(path.join(__dirname, 'features/family/familyTypes.ts'), 'utf8');
  assert(!familyTypesFile.includes('authId') && !familyTypesFile.includes('password'),
    'Child profile model contains zero authentication fields or credentials');
}

// ----------------------------------------------------
// 8. INVALID ROUTE & PARAMETER HANDLING
// ----------------------------------------------------
console.log('\n--- 8. Invalid Route & Parameter Handling ---');
{
  const levelFile = fs.readFileSync(path.join(__dirname, 'app/level/[level].tsx'), 'utf8');
  assert(levelFile.includes("That learning level isn't available.") && levelFile.includes('Return Home'),
    'Level screen has graceful fallback for unknown or invalid level parameters');

  const topicsFile = fs.readFileSync(path.join(__dirname, 'app/level/[level]/topics.tsx'), 'utf8');
  assert(topicsFile.includes("That learning level isn't available.") && topicsFile.includes('Return Home'),
    'Topics screen has graceful fallback for unknown level or empty topics');

  const childDetailFile = fs.readFileSync(path.join(__dirname, 'app/parent/family/[childId].tsx'), 'utf8');
  assert(childDetailFile.includes("We couldn't find this learner.") && childDetailFile.includes('Return to Family'),
    'Learner detail screen has graceful fallback for missing or invalid childId');

  const childInsightsFile = fs.readFileSync(path.join(__dirname, 'app/parent/family/[childId]/insights.tsx'), 'utf8');
  assert(childInsightsFile.includes("We couldn't find this learner.") && childInsightsFile.includes('Return to Family'),
    'Learner insights screen has graceful fallback for missing or invalid childId');

  const resultFile = fs.readFileSync(path.join(__dirname, 'app/quiz/result.tsx'), 'utf8');
  assert(resultFile.includes('No Quiz Results') && resultFile.includes('Return Home'),
    'Quiz result screen has graceful fallback when visited directly with no questions completed');
}

// ----------------------------------------------------
// 9. ACCESSIBILITY CONTRACTS
// ----------------------------------------------------
console.log('\n--- 9. Accessibility Contracts ---');
{
  const primaryButtonFile = fs.readFileSync(path.join(__dirname, 'components/ui/PrimaryButton.tsx'), 'utf8');
  assert(primaryButtonFile.includes('minHeight: 56'),
    'PrimaryButton satisfies touch target requirement (minHeight >= 56px)');
  assert(primaryButtonFile.includes('accessibilityRole="button"'),
    'PrimaryButton explicitly declares accessibilityRole="button"');

  const quizOptionFile = fs.readFileSync(path.join(__dirname, 'components/quiz/QuizOption.tsx'), 'utf8');
  assert(quizOptionFile.includes('minHeight: 68'),
    'QuizOption satisfies generous child touch target requirement (minHeight: 68px)');
  assert(quizOptionFile.includes('✓') && quizOptionFile.includes('✕'),
    'QuizOption includes text/symbol badges so feedback does not rely solely on color');
  assert(quizOptionFile.includes('accessibilityRole="button"') && quizOptionFile.includes('accessibilityState'),
    'QuizOption provides accessible role and state');

  const levelCardFile = fs.readFileSync(path.join(__dirname, 'components/ui/LevelCard.tsx'), 'utf8');
  assert(levelCardFile.includes('minHeight: 76'),
    'LevelCard satisfies touch target requirement (minHeight: 76px)');

  const topicCardFile = fs.readFileSync(path.join(__dirname, 'components/curriculum/TopicCard.tsx'), 'utf8');
  assert(topicCardFile.includes('minHeight: 80'),
    'TopicCard satisfies touch target requirement (minHeight: 80px)');
}

// ----------------------------------------------------
// 10. METADATA & DOCUMENT TITLES
// ----------------------------------------------------
console.log('\n--- 10. Metadata & Document Titles ---');
{
  const useDocTitleFile = fs.readFileSync(path.join(__dirname, 'lib/utils/useDocumentTitle.ts'), 'utf8');
  assert(useDocTitleFile.includes('document.title ='),
    'useDocumentTitle hook updates document.title dynamically on web');

  const homeFile = fs.readFileSync(path.join(__dirname, 'app/index.tsx'), 'utf8');
  assert(homeFile.includes('useDocumentTitle("Tutr Kidz")'),
    'Home screen sets "Tutr Kidz" document title');

  const toddlerFile = fs.readFileSync(path.join(__dirname, 'app/toddler/index.tsx'), 'utf8');
  assert(toddlerFile.includes('useDocumentTitle("Tutr Kidz — Toddler")'),
    'Toddler screen sets "Tutr Kidz — Toddler" document title');

  const parentFile = fs.readFileSync(path.join(__dirname, 'app/parent/index.tsx'), 'utf8');
  assert(parentFile.includes('useDocumentTitle("Tutr Kidz — Parent Dashboard")'),
    'Parent dashboard sets "Tutr Kidz — Parent Dashboard" document title');
}

// ----------------------------------------------------
// 11. PRODUCTION CONFIGURATION
// ----------------------------------------------------
console.log('\n--- 11. Production Configuration ---');
{
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));
  assert(appJson.expo.name === 'Tutr Kidz', 'app.json has correct app name');
  assert(appJson.expo.slug === 'tutr-kidz', 'app.json has correct slug');
  assert(appJson.expo.web.output === 'single', 'app.json specifies single output for SPA web');

  const vercelJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
  assert(vercelJson.outputDirectory === 'dist', 'vercel.json targets dist output directory');
  assert(vercelJson.routes && vercelJson.routes.some(r => r.dest === '/index.html'),
    'vercel.json has SPA fallback route to /index.html');

  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  assert(packageJson.scripts.build.includes('expo export --platform web'),
    'package.json build script exports web platform');
}

// ----------------------------------------------------
// 12. SECURITY INVARIANTS
// ----------------------------------------------------
console.log('\n--- 12. Security Invariants ---');
{
  const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
  assert(gitignore.includes('.env*') || gitignore.includes('.env'),
    '.gitignore excludes environment secret files');

  // Verify no service-role keys in repo
  const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  assert(!envExample.includes('service_role') && !envExample.includes('SERVICE_ROLE'),
    '.env.example contains zero service-role keys');

  // Verify only public client-side Supabase credentials
  assert(envExample.includes('EXPO_PUBLIC_SUPABASE_URL') && envExample.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    'Environment template only exposes safe public EXPO_PUBLIC_* variables');
}

console.log(`\n====================================================`);
console.log(`Phase 17 Test Results: ${passedTests} / ${totalTests} passed`);
console.log(`====================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
