import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  getCurrentParentUser,
  getCurrentParentSession,
  signInParent,
  signUpParent,
  signOutParent,
  resetParentPassword,
  onParentAuthStateChange,
} from '../../lib/supabase/auth';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { mapAuthError } from './authErrors';
import { syncNow } from '../sync/syncService';
import { AuthContextValue } from './authTypes';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      const activeSession = await getCurrentParentSession();
      const activeUser = await getCurrentParentUser();
      setSession(activeSession);
      setUser(activeUser);
    } catch {
      // offline fallback
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    // Listen to real-time auth changes
    const { unsubscribe } = onParentAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (event === 'SIGNED_IN' && newSession?.user) {
        // Trigger non-blocking cloud sync in background
        syncNow().catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshSession]);

  const signIn = useCallback(async (email: string, pass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await signInParent(email, pass);
      if (res.error) {
        const friendly = mapAuthError(res.error, 'signin');
        setError(friendly);
        return { success: false, error: friendly };
      }
      setUser(res.data?.user ?? null);
      setSession(res.data?.session ?? null);

      // Perform cloud sync upon successful login
      if (res.data?.user) {
        syncNow().catch(() => {});
      }

      return { success: true };
    } catch (err) {
      const friendly = mapAuthError(err as Error, 'signin');
      setError(friendly);
      return { success: false, error: friendly };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, pass: string, displayName?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await signUpParent(email, pass, displayName);
      if (res.error) {
        const friendly = mapAuthError(res.error, 'signup');
        setError(friendly);
        return { success: false, error: friendly };
      }
      setUser(res.data?.user ?? null);
      setSession(res.data?.session ?? null);

      // Perform initial cloud sync upon successful signup
      if (res.data?.user) {
        syncNow().catch(() => {});
      }

      return { success: true };
    } catch (err) {
      const friendly = mapAuthError(err as Error, 'signup');
      setError(friendly);
      return { success: false, error: friendly };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await signOutParent();
      if (res.error) {
        const friendly = mapAuthError(res.error, 'general');
        setError(friendly);
        return { success: false, error: friendly };
      }
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      const friendly = mapAuthError(err as Error, 'general');
      setError(friendly);
      return { success: false, error: friendly };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      const res = await resetParentPassword(email);
      if (res.error) {
        const friendly = mapAuthError(res.error, 'reset');
        return { success: false, error: friendly };
      }
      return { success: true };
    } catch (err) {
      const friendly = mapAuthError(err as Error, 'reset');
      return { success: false, error: friendly };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
