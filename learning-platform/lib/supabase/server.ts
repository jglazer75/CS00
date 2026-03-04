import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

let serverClient: SupabaseClient | undefined;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseServerClient(): SupabaseClient | null {
  const url = supabaseUrl;
  const serviceKey = supabaseServiceRoleKey;

  if (!url || !serviceKey) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return serverClient;
}

/**
 * Returns a cookie-based Supabase client for server components that need to
 * read the currently authenticated user from the session cookie.
 */
export async function getSupabaseUserClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
