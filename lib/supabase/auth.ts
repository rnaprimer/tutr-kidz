/**
 * Tutr Kidz - Supabase Authentication Service (Phase 13)
 *
 * Provides parent account authentication, session management, and automatic
 * profile/family provisioning.
 */

import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';
import { DbFamily, DbProfile, DbFamilySettings } from './types';

export interface AuthResult<T = void> {
  data: T | null;
  error: string | null;
}

export interface ParentAccountBundle {
  profile: DbProfile;
  family: DbFamily;
  settings: DbFamilySettings;
}

/**
 * Sign up a new parent account with email and password.
 */
export async function signUpParent(
  email: string,
  pass: string,
  displayName?: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Cloud backend is not configured.' };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (data.user) {
      // Ensure profile and family exist defensively
      await ensureUserProfileAndFamily(data.user.id, data.user.email ?? email, displayName);
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown signup error' };
  }
}

/**
 * Sign in existing parent with email and password.
 */
export async function signInParent(
  email: string,
  pass: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Cloud backend is not configured.' };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (data.user) {
      await ensureUserProfileAndFamily(data.user.id, data.user.email ?? email);
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown sign-in error' };
  }
}

/**
 * Sign out the currently authenticated parent.
 */
export async function signOutParent(): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: null };
  }

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown sign-out error' };
  }
}

/**
 * Send password reset email to the parent.
 */
export async function resetParentPassword(email: string): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Cloud backend is not configured.' };
  }

  try {
    const { error } = await client.auth.resetPasswordForEmail(email);
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Get current authenticated user, if any.
 */
export async function getCurrentParentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Get current active session, if any.
 */
export async function getCurrentParentSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return null;
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Subscribe to auth state changes.
 */
export function onParentAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  const client = getSupabaseClient();
  if (!client) {
    return { unsubscribe: () => {} };
  }

  const { data } = client.auth.onAuthStateChange(callback);
  return {
    unsubscribe: () => {
      data.subscription.unsubscribe();
    },
  };
}

/**
 * Ensures that the authenticated user has a Profile, Family, and FamilySettings.
 * Idempotent and safe to run multiple times.
 */
export async function ensureUserProfileAndFamily(
  userId: string,
  email: string,
  displayName?: string
): Promise<ParentAccountBundle | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Fetch or create Profile
    const { data: profileData, error: profileErr } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    let profile = profileData as DbProfile | null;

    if (!profile) {
      const name = displayName || email.split('@')[0];
      const { data: newProfile, error: insertProfErr } = await client
        .from('profiles')
        .insert({
          id: userId,
          display_name: name,
        })
        .select('*')
        .single();

      if (insertProfErr) {
        console.warn('Failed to insert profile:', insertProfErr);
      }
      profile = newProfile as DbProfile;
    }

    // 2. Fetch or create Family
    const { data: familyData } = await client
      .from('families')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    let family = familyData as DbFamily | null;

    if (!family) {
      const { data: newFam, error: insertFamErr } = await client
        .from('families')
        .insert({
          owner_id: userId,
        })
        .select('*')
        .single();

      if (insertFamErr) {
        console.warn('Failed to insert family:', insertFamErr);
      }
      family = newFam as DbFamily;
    }

    // 3. Fetch or create Family Settings
    let settings: DbFamilySettings | null = null;
    if (family) {
      const { data: settingsData } = await client
        .from('family_settings')
        .select('*')
        .eq('family_id', family.id)
        .maybeSingle();

      settings = settingsData as DbFamilySettings | null;

      if (!settings) {
        const { data: newSettings } = await client
          .from('family_settings')
          .insert({
            family_id: family.id,
            daily_question_goal_enabled: true,
            default_daily_question_goal: 5,
            show_all_levels_by_default: true,
            session_question_count: 5,
            reduce_motion: false,
            parent_lock_enabled: false,
            require_parent_confirmation_for_reset: true,
          })
          .select('*')
          .single();

        settings = newSettings as DbFamilySettings;
      }
    }

    if (profile && family && settings) {
      return { profile, family, settings };
    }

    return null;
  } catch (err) {
    console.warn('Error provisioning user profile and family:', err);
    return null;
  }
}
