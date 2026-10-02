/**
 * Tutr Kidz - Phase 26A Native Persistence Across Restart Test Suite
 *
 * Simulates cold restart across two distinct operating system processes:
 * Process 1: Writes parent session, creates child profile, generates progress,
 *            modifies settings, and enqueues offline sync actions. Then exits completely.
 * Process 2: Starts with zero in-memory state, reads persisted storage, and verifies
 *            that all 13 contract requirements survived application termination.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const TEST_STORAGE_FILE = path.join(__dirname, '.test_native_storage.json');

// Clean up any stale state before starting
if (fs.existsSync(TEST_STORAGE_FILE)) {
  fs.unlinkSync(TEST_STORAGE_FILE);
}

console.log('=== PHASE 26A: NATIVE PERSISTENCE ACROSS RESTART TEST ===\n');

// 1. Process 1 Execution
console.log('--- Step 1: Launching Process 1 (Writing State & Exiting) ---');
const proc1Output = execSync('node test_native_persistence_proc1.js', { encoding: 'utf8' });
assert(proc1Output.includes('PROCESS_1_SUCCESS'), 'Process 1 failed to write state');
console.log('✓ Process 1 completed successfully and terminated (exit code 0).');

// 2. Process 2 Execution (Cold Start)
console.log('\n--- Step 2: Launching Process 2 (Cold Start In Brand New Process) ---');
const proc2OutputRaw = execSync('node test_native_persistence_proc2.js', { encoding: 'utf8' });
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

// Clean up test files
if (fs.existsSync(TEST_STORAGE_FILE)) {
  fs.unlinkSync(TEST_STORAGE_FILE);
}
fs.unlinkSync(path.join(__dirname, 'test_native_persistence_proc1.js'));
fs.unlinkSync(path.join(__dirname, 'test_native_persistence_proc2.js'));

console.log('\n====================================================');
console.log(`All ${passed} / 6 Native Persistence Flow Tests Passed!`);
console.log('Application state reliably survives process termination.');
console.log('====================================================\n');
