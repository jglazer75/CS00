import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | undefined;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseServerClient(): SupabaseClient {
  const url = supabaseUrl;
  const serviceKey = supabaseServiceRoleKey;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase server credentials. Define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
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
