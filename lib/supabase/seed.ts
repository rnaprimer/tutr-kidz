/**
 * Tutr Kidz - Development & Test Seed Strategy (Phase 13)
 *
 * Provides reproducible seed data for development and testing:
 * Parent -> Aarav (Class 2, Multiplication) and Anya (Class 1, Addition).
 */

import { getSupabaseClient } from './client';

export async function seedDevFamilyData(familyId: string): Promise<{
  aaravId: string;
  anyaId: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not available for seeding');
  }

  // 1. Create Aarav
  const { data: aarav, error: aaravErr } = await client
    .from('children')
    .insert({
      family_id: familyId,
      name: 'Aarav',
      level: 'class-2',
    })
    .select('id')
    .single();

  if (aaravErr || !aarav) {
    throw new Error(`Failed to seed Aarav: ${aaravErr?.message}`);
  }

  await client.from('child_preferences').insert({
    child_id: aarav.id,
    daily_question_goal: 10,
    show_all_levels: true,
  });

  const now = new Date().toISOString();

  // Aarav Multiplication progress
  await client.from('topic_progress').insert({
    child_id: aarav.id,
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
  });

  await client.from('quiz_attempts').insert({
    child_id: aarav.id,
    level: 'class-2',
    topic: 'multiplication',
    score: 4,
    total: 5,
    completed_at: now,
  });

  // 2. Create Anya
  const { data: anya, error: anyaErr } = await client
    .from('children')
    .insert({
      family_id: familyId,
      name: 'Anya',
      level: 'class-1',
    })
    .select('id')
    .single();

  if (anyaErr || !anya) {
    throw new Error(`Failed to seed Anya: ${anyaErr?.message}`);
  }

  await client.from('child_preferences').insert({
    child_id: anya.id,
    daily_question_goal: 5,
    show_all_levels: false,
  });

  // Anya Addition progress
  await client.from('topic_progress').insert({
    child_id: anya.id,
    level: 'class-1',
    topic: 'addition',
    attempts: 1,
    questions_answered: 5,
    correct_answers: 5,
    incorrect_answers: 0,
    best_score: 5,
    best_total: 5,
    last_score: 5,
    last_total: 5,
    last_played_at: now,
  });

  await client.from('quiz_attempts').insert({
    child_id: anya.id,
    level: 'class-1',
    topic: 'addition',
    score: 5,
    total: 5,
    completed_at: now,
  });

  return {
    aaravId: aarav.id,
    anyaId: anya.id,
  };
}
