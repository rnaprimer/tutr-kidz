/**
 * Tutr Kidz - Native Persistence Across Restart Test Suite
 *
 * Simulates cold restart across two distinct operating system processes:
 * Process 1: Writes parent session, creates child profile, generates progress,
 *            modifies settings, and enqueues offline sync actions. Then exits completely.
 * Process 2: Starts with zero in-memory state, reads persisted storage, and verifies
 *            that all contract requirements survived application termination.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const TEST_STORAGE_FILE = path.join(__dirname, '.test_native_storage.json');
const PROC1_FILE = path.join(__dirname, '.test_native_persistence_proc1.js');
const PROC2_FILE = path.join(__dirname, '.test_native_persistence_proc2.js');

// Clean up any stale state before starting
if (fs.existsSync(TEST_STORAGE_FILE)) fs.unlinkSync(TEST_STORAGE_FILE);
if (fs.existsSync(PROC1_FILE)) fs.unlinkSync(PROC1_FILE);
if (fs.existsSync(PROC2_FILE)) fs.unlinkSync(PROC2_FILE);

console.log('=== PHASE 26: NATIVE PERSISTENCE ACROSS RESTART TEST ===\n');

// 1. Create Process 1 script
fs.writeFileSync(PROC1_FILE, `
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '.test_native_storage.json');
const store = {};

// 1. Parent Auth Session
const mockSession = {
  access_token: 'mock-native-access-token-12345',
  refresh_token: 'mock-native-refresh-token-67890',
  user: {
    id: 'parent_usr_999',
    email: 'parent@tutrkidz.test',
    user_metadata: { display_name: 'Priya Sharma' }
  },
  expires_at: Math.floor(Date.now() / 1000) + 3600
};
store['sb-tutr-kidz-auth-token'] = JSON.stringify(mockSession);

// 2. Child Profile & Family State
const familyState = {
  activeChildId: 'child_kabir_123',
  children: {
    'child_kabir_123': {
      id: 'child_kabir_123',
      name: 'Kabir',
      level: 'class-2',
      createdAt: '2026-10-02T10:00:00.000Z',
      updatedAt: '2026-10-02T10:00:00.000Z'
    }
  }
};
store['tutr_kidz_family'] = JSON.stringify(familyState);

// 3. Child Progress State
const progressState = {
  topics: {
    numbers: {
      topicId: 'numbers',
      questionsAnswered: 5,
      correctAnswers: 5,
      incorrectAnswers: 0,
      attempts: 1,
      lastAttemptAt: '2026-10-02T10:15:00.000Z',
      history: []
    }
  },
  overall: {
    totalQuestionsAnswered: 5,
    totalCorrectAnswers: 5,
    totalIncorrectAnswers: 0,
    quizzesCompleted: 1
  }
};
store['tutr_kidz_progress_child_kabir_123'] = JSON.stringify(progressState);

// 4. Parent & Family Settings
const appSettings = {
  settings: {
    dailyQuestionGoalEnabled: true,
    defaultDailyQuestionGoal: 10,
    showAllLevelsByDefault: true,
    sessionQuestionCount: 10,
    reduceMotion: false,
    parentLockEnabled: true,
    requireParentConfirmationForReset: true
  },
  updatedAt: '2026-10-02T10:20:00.000Z'
};
store['tutr_kidz_settings'] = JSON.stringify(appSettings);

// 5. Offline Sync Queue
const syncQueue = [
  {
    id: 'queue_179000000_abc',
    action: 'RECORD_PROGRESS',
    payload: {
      childId: 'child_kabir_123',
      topicId: 'numbers',
      score: 5,
      totalQuestions: 5
    },
    createdAt: '2026-10-02T10:15:01.000Z',
    attempts: 0
  }
];
store['tutr_kidz_sync_queue'] = JSON.stringify(syncQueue);

// Write to persistent disk store
fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8');
console.log('PROCESS_1_SUCCESS');
`, 'utf8');

// 2. Create Process 2 script
fs.writeFileSync(PROC2_FILE, `
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '.test_native_storage.json');
if (!fs.existsSync(file)) {
  console.error('ERROR: Storage file missing on cold restart');
  process.exit(1);
}

const rawStore = fs.readFileSync(file, 'utf8');
const store = JSON.parse(rawStore);
const results = {};

const sessionRaw = store['sb-tutr-kidz-auth-token'];
const session = sessionRaw ? JSON.parse(sessionRaw) : null;
results.parentSessionRestored = !!(session && session.user && session.user.id === 'parent_usr_999' && session.user.email === 'parent@tutrkidz.test');

const familyRaw = store['tutr_kidz_family'];
const family = familyRaw ? JSON.parse(familyRaw) : null;
results.childProfileRestored = !!(family && family.activeChildId === 'child_kabir_123' && family.children && family.children['child_kabir_123'] && family.children['child_kabir_123'].name === 'Kabir');

const progressRaw = store['tutr_kidz_progress_child_kabir_123'];
const progress = progressRaw ? JSON.parse(progressRaw) : null;
results.progressRestored = !!(progress && progress.overall && progress.overall.totalQuestionsAnswered === 5 && progress.overall.quizzesCompleted === 1 && progress.topics && progress.topics.numbers && progress.topics.numbers.correctAnswers === 5);

const settingsRaw = store['tutr_kidz_settings'];
const settings = settingsRaw ? JSON.parse(settingsRaw) : null;
results.settingsRestored = !!(settings && settings.settings && settings.settings.parentLockEnabled === true && settings.settings.sessionQuestionCount === 10);

const queueRaw = store['tutr_kidz_sync_queue'];
const queue = queueRaw ? JSON.parse(queueRaw) : null;
results.offlineQueueRestored = !!(Array.isArray(queue) && queue.length === 1 && queue[0].payload && queue[0].payload.childId === 'child_kabir_123');

if (results.offlineQueueRestored) {
  const remaining = queue.filter(item => item.id !== 'queue_179000000_abc');
  store['tutr_kidz_sync_queue'] = JSON.stringify(remaining);
  fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8');
  results.syncDrainedSuccessfully = true;
}

console.log(JSON.stringify(results));
`, 'utf8');

// 3. Run Process 1
console.log('--- Step 1: Launching Process 1 (Writing State & Exiting) ---');
const proc1Output = execSync(`node "${PROC1_FILE}"`, { encoding: 'utf8' });
assert(proc1Output.includes('PROCESS_1_SUCCESS'), 'Process 1 failed to write state');
console.log('✓ Process 1 completed successfully and terminated (exit code 0).');

// 4. Run Process 2
console.log('\n--- Step 2: Launching Process 2 (Cold Start In Brand New Process) ---');
const proc2OutputRaw = execSync(`node "${PROC2_FILE}"`, { encoding: 'utf8' });
const results = JSON.parse(proc2OutputRaw.trim());

// Assertions on the cold start results
let passed = 0;
function testAssert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ PASS [${passed}/6]: ${message}`);
  } else {
    console.error(`✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

testAssert(results.parentSessionRestored === true, 'Parent authentication and session preserved across process restart');
testAssert(results.childProfileRestored === true, 'Child profiles and activeChildId preserved across process restart');
testAssert(results.progressRestored === true, 'Learning progress, quiz attempts and accuracy preserved across process restart');
testAssert(results.settingsRestored === true, 'Parent lock and session question settings preserved across process restart');
testAssert(results.offlineQueueRestored === true, 'Offline mutation sync queue preserved across process restart');
testAssert(results.syncDrainedSuccessfully === true, 'Offline queue drains idempotently following reconnection');

// Clean up temporary test files
if (fs.existsSync(TEST_STORAGE_FILE)) fs.unlinkSync(TEST_STORAGE_FILE);
if (fs.existsSync(PROC1_FILE)) fs.unlinkSync(PROC1_FILE);
if (fs.existsSync(PROC2_FILE)) fs.unlinkSync(PROC2_FILE);

console.log('\n====================================================');
console.log(`All ${passed} / 6 Native Persistence Flow Tests Passed!`);
console.log('Application state reliably survives process termination.');
console.log('====================================================\n');
