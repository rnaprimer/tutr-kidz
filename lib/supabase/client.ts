/**
 * Tutr Kidz - Supabase Client (Phase 13)
 *
 * Configures the official Supabase client using environment variables.
 * Safe fallback ensures the application runs seamlessly in offline/local-only mode
 * if credentials are missing or unconfigured.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Returns true if both Supabase URL and Anon Key are configured and valid.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-supabase-anon-key')) {
    return false;
  }
  try {
    const parsed = new URL(supabaseUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

let clientInstance: SupabaseClient<any, 'public', any> | null = null;

/**
 * Get or initialize the Supabase client.
 * Returns null if Supabase is not configured.
 */
export function getSupabaseClient(): SupabaseClient<any, 'public', any> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    } catch {
      clientInstance = null;
    }
  }

  return clientInstance;
}

/**
 * Convenience export for direct calls where configured.
 */
export const supabase = getSupabaseClient();
