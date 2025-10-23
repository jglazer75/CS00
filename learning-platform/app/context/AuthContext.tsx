'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useSupabaseClient } from './SupabaseClientContext';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      if (!supabase) {
        if (isMounted) {
          setSession(null);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Failed to get Supabase session', error);
        setSession(null);
      } else {
        setSession(data.session ?? null);
      }
      setLoading(false);
    }

    initialize();

    if (!supabase) {
      return () => {
        isMounted = false;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => {
    async function handleSignOut() {
      if (!supabase) {
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign-out error', error);
      }
    }

    async function refresh() {
      if (!supabase) {
        setSession(null);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
    }

    return {
      session,
      user: session?.user ?? null,
      loading,
      signOut: handleSignOut,
      refreshSession: refresh,
    };
  }, [loading, session, supabase]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
