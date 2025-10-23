'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';

const SupabaseClientContext = createContext<SupabaseClient | null>(null);

export function SupabaseClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);

  return <SupabaseClientContext.Provider value={client}>{children}</SupabaseClientContext.Provider>;
}

export function useSupabaseClient() {
  const client = useContext(SupabaseClientContext);

  if (!client) {
    throw new Error('useSupabaseClient must be used within a SupabaseClientProvider.');
  }

  return client;
}
