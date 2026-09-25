/**
 * Tutr Kidz - Live Supabase Backend Integration Verification
 *
 * Verifies live PostgreSQL schema, Auth, RLS, Trigger, and multi-tenant isolation.
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Read environment variables from .env
const envRaw = fs.readFileSync('.env', 'utf8');
const env = {};
envRaw.split('\n').forEach((line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const url = env['EXPO_PUBLIC_SUPABASE_URL'];
const key = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!url || !key) {
  console.error('ERROR: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be in .env');
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runLiveVerification() {
  console.log('=== LIVE SUPABASE BACKEND INTEGRATION VERIFICATION ===\n');
  console.log(`Connecting to: ${url}\n`);

  const anonClient = createClient(url, key);

  // --------------------------------------------------------------------------
  // 1. VERIFY DATABASE TABLES EXIST IN POSTGREST SCHEMA CACHE
  // --------------------------------------------------------------------------
  console.log('--- 1. Verifying Database Tables ---');
  const tables = [
    'profiles',
    'families',
    'children',
    'child_preferences',
    'topic_progress',
    'quiz_attempts',
    'family_settings',
  ];

  for (const table of tables) {
    const { error } = await anonClient.from(table).select('*').limit(1);
    if (error && error.code === 'PGRST205') {
      throw new Error(`Table "${table}" not found in schema cache. Error: ${error.message}`);
    }
    assert(!error || error.code !== 'PGRST205', `Table "${table}" is accessible in PostgreSQL`);
  }

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATION & AUTOMATIC PROVISIONING (PARENT A)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Testing Auth Registration & Trigger (Parent A) ---');
  const emailA = 'parent.a@tutrkidz.test';
  const passwordA = 'TestPass123!Safe';

  const clientA = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Try sign in first (if already seeded)
  let signInARes = await clientA.auth.signInWithPassword({ email: emailA, password: passwordA });

  if (signInARes.error) {
    // Attempt signUp
    const signUpARes = await anonClient.auth.signUp({
      email: emailA,
      password: passwordA,
      options: { data: { display_name: 'Parent A' } },
    });

    if (signUpARes.error) {
      if (signUpARes.error.message.includes('rate limit')) {
        console.error('\nNOTE: Supabase Auth "Confirm email" is enabled and rate-limited.');
        console.error('To proceed, in Supabase Dashboard: Authentication -> Providers -> Email -> uncheck "Confirm email" and save.');
        console.error('OR run the test user seed SQL provided in the assistant message.\n');
      }
      throw new Error(`Parent A registration failed: ${signUpARes.error.message}`);
    }

    // Sign in with the newly registered user
    signInARes = await clientA.auth.signInWithPassword({ email: emailA, password: passwordA });
    if (signInARes.error) {
      throw new Error(`Sign in failed after signup: ${signInARes.error.message}`);
    }
  }

  const userA = signInARes.data.user;
  assert(userA !== null, `Parent A authenticated successfully (ID: ${userA.id})`);

  // --------------------------------------------------------------------------
  // 3. VERIFY PROVISIONING TRIGGER (profiles, families, family_settings)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Verifying Automatic Provisioning (Trigger handle_new_user) ---');
  // 3.1 Check profile
  const { data: profileA } = await clientA
    .from('profiles')
    .select('*')
    .eq('id', userA.id)
    .maybeSingle();

  assert(profileA !== null, 'Trigger automatically created "profiles" row');
  console.log(`  Profile display_name: "${profileA?.display_name}"`);

  // 3.2 Check family
  const { data: familyA } = await clientA
    .from('families')
    .select('*')
    .eq('owner_id', userA.id)
    .maybeSingle();

  assert(familyA !== null, 'Trigger automatically created "families" row');
  const familyAId = familyA.id;
  assert(familyA.owner_id === userA.id, `Family owner_id matches userA id`);

  // 3.3 Check family_settings
  const { data: settingsA } = await clientA
    .from('family_settings')
    .select('*')
    .eq('family_id', familyAId)
    .maybeSingle();

  assert(settingsA !== null, 'Trigger automatically created "family_settings" row');
  assert(settingsA.daily_question_goal_enabled === true, 'Default daily_question_goal_enabled is true');
  assert(settingsA.default_daily_question_goal === 5, 'Default default_daily_question_goal is 5');
  assert(settingsA.session_question_count === 5, 'Default session_question_count is 5');

  // --------------------------------------------------------------------------
  // 4. PARENT A CREATES & READS CHILD & PREFERENCES
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Testing Child Creation & Preferences (Parent A) ---');
  // Check if Aarav already exists from previous run
  let { data: existingAarav } = await clientA
    .from('children')
    .select('*')
    .eq('family_id', familyAId)
    .eq('name', 'Aarav')
    .maybeSingle();

  let childAarav = existingAarav;
  if (!childAarav) {
    const { data: newChild, error: childErr } = await clientA
      .from('children')
      .insert({
        family_id: familyAId,
        name: 'Aarav',
        level: 'class-2',
      })
      .select('*')
      .single();

    if (childErr || !newChild) {
      throw new Error(`Failed to create child Aarav: ${childErr?.message}`);
    }
    childAarav = newChild;
  }
  assert(childAarav.name === 'Aarav' && childAarav.level === 'class-2', 'Parent A child "Aarav" created/retrieved');

  // Preferences
  await clientA.from('child_preferences').upsert(
    {
      child_id: childAarav.id,
      daily_question_goal: 10,
      show_all_levels: true,
    },
    { onConflict: 'child_id' }
  );

  const { data: prefA } = await clientA
    .from('child_preferences')
    .select('*')
    .eq('child_id', childAarav.id)
    .single();

  assert(prefA?.daily_question_goal === 10, 'Aarav daily_question_goal is 10');
  assert(prefA?.show_all_levels === true, 'Aarav show_all_levels is true');

  // --------------------------------------------------------------------------
  // 5. RECORD QUIZ ATTEMPT & TOPIC PROGRESS FOR AARAV
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Testing Quiz Attempt & Topic Progress (Parent A) ---');
  const now = new Date().toISOString();
  const { data: attemptA, error: attemptErr } = await clientA
    .from('quiz_attempts')
    .insert({
      child_id: childAarav.id,
      level: 'class-2',
      topic: 'multiplication',
      score: 4,
      total: 5,
      completed_at: now,
    })
    .select('*')
    .single();

  assert(!attemptErr && attemptA?.score === 4, 'Quiz attempt recorded for Aarav (4/5 Multiplication)');

  const { data: progressA, error: progressErr } = await clientA
    .from('topic_progress')
    .upsert(
      {
        child_id: childAarav.id,
        level: 'class-2',
        topic: 'multiplication',
        attempts: 1,
        questions_answered: 5,
        correct_answers: 4,
        incorrect_answers: 1,
        best_score: 4,
        best_total: 5,
        last_score: 4,
        last_total: 5,
        last_played_at: now,
      },
      { onConflict: 'child_id,level,topic' }
    )
    .select('*')
    .single();

  assert(!progressErr && progressA?.questions_answered === 5, 'Topic progress updated for Aarav');

  // --------------------------------------------------------------------------
  // 6. MULTI-TENANT RLS ISOLATION (PARENT B)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Testing Row Level Security (RLS) Isolation (Parent B) ---');
  const emailB = 'parent.b@tutrkidz.test';
  const passwordB = 'TestPass456!Safe';

  const clientB = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let signInBRes = await clientB.auth.signInWithPassword({ email: emailB, password: passwordB });
  if (signInBRes.error) {
    const signUpBRes = await anonClient.auth.signUp({
      email: emailB,
      password: passwordB,
      options: { data: { display_name: 'Parent B' } },
    });
    if (signUpBRes.error) {
      throw new Error(`Parent B signup error: ${signUpBRes.error.message}`);
    }
    signInBRes = await clientB.auth.signInWithPassword({ email: emailB, password: passwordB });
  }

  const userB = signInBRes.data.user;
  assert(userB !== null, `Parent B authenticated successfully (ID: ${userB.id})`);

  // Parent B attempts to SELECT Parent A's family
  const { data: bReadFamA } = await clientB
    .from('families')
    .select('*')
    .eq('id', familyAId);
  assert(!bReadFamA || bReadFamA.length === 0, 'RLS: Parent B CANNOT read Parent A family');

  // Parent B attempts to SELECT Parent A's child (Aarav)
  const { data: bReadChildA } = await clientB
    .from('children')
    .select('*')
    .eq('id', childAarav.id);
  assert(!bReadChildA || bReadChildA.length === 0, 'RLS: Parent B CANNOT read Parent A child');

  // Parent B attempts to SELECT Parent A's quiz attempts
  const { data: bReadAttempts } = await clientB
    .from('quiz_attempts')
    .select('*')
    .eq('child_id', childAarav.id);
  assert(!bReadAttempts || bReadAttempts.length === 0, 'RLS: Parent B CANNOT read Parent A quiz attempts');

  // Parent B attempts to SELECT Parent A's topic progress
  const { data: bReadProgress } = await clientB
    .from('topic_progress')
    .select('*')
    .eq('child_id', childAarav.id);
  assert(!bReadProgress || bReadProgress.length === 0, 'RLS: Parent B CANNOT read Parent A topic progress');

  // Parent B attempts to UPDATE Parent A's child
  const { data: bUpdateChild } = await clientB
    .from('children')
    .update({ name: 'Hacked By B' })
    .eq('id', childAarav.id)
    .select('*');
  assert(!bUpdateChild || bUpdateChild.length === 0, 'RLS: Parent B CANNOT update Parent A child');

  // Parent B attempts to DELETE Parent A's child
  const { data: bDeleteChild } = await clientB
    .from('children')
    .delete()
    .eq('id', childAarav.id)
    .select('*');
  assert(!bDeleteChild || bDeleteChild.length === 0, 'RLS: Parent B CANNOT delete Parent A child');

  // Verify Parent A's child remains completely intact
  const { data: verifyChildA } = await clientA
    .from('children')
    .select('name')
    .eq('id', childAarav.id)
    .single();
  assert(verifyChildA?.name === 'Aarav', 'Parent A child "Aarav" remains completely secure and untouched');

  console.log('\n=== ALL LIVE SUPABASE BACKEND INTEGRATION CHECKS PASSED ===\n');
}

runLiveVerification().catch((err) => {
  console.error('\nBackend Integration Verification Result:\n', err.message);
  process.exit(1);
});
