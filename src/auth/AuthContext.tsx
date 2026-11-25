import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  clearSensitiveSessionData,
} from '../services/supabaseClient';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: (reason?: 'manual' | 'timeout' | 'expired') => Promise<void>;
  verifySession: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Admin email is not confirmed in Supabase. Please confirm it in your Supabase dashboard.';
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (lower.includes('jwt expired') || lower.includes('session')) {
    return 'Your session has expired. Please sign in again.';
  }
  return 'Authentication failed. Please check your credentials and try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const performCleanSignOut = useCallback(async () => {
    try {
      const client = supabase;
      if (client) {
        await client.auth.signOut({ scope: 'global' }).catch(() => client.auth.signOut());
      }
    } finally {
      await clearSensitiveSessionData();
      setSession(null);
      setUser(null);
    }
  }, []);

  /**
   * Independently verifies the current session with Supabase Auth server
   * (does not blindly trust cached client session state).
   */
  const verifySession = useCallback(async (): Promise<boolean> => {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setSession(null);
        setUser(null);
        return false;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        await performCleanSignOut();
        return false;
      }

      setSession(sessionData.session);
      setUser(userData.user);
      return true;
    } catch {
      await performCleanSignOut();
      return false;
    }
  }, [performCleanSignOut]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    verifySession().finally(() => {
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !nextSession) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      setSession(nextSession);
      setUser(nextSession.user);
      setLoading(false);
    });

    // Re-verify session when tab/PWA regains focus or comes back online
    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void verifySession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrOnline);
    window.addEventListener('online', handleVisibilityOrOnline);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      window.removeEventListener('online', handleVisibilityOrOnline);
    };
  }, [verifySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return {
        error:
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: mapAuthError(error.message) };
    setSession(data.session);
    setUser(data.user);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await performCleanSignOut();
  }, [performCleanSignOut]);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) {
      return { error: 'Supabase is not configured.' };
    }
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) return { error: mapAuthError(error.message) };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) {
      return { error: 'Supabase is not configured.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: mapAuthError(error.message) };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signOut,
        verifySession,
        sendPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
