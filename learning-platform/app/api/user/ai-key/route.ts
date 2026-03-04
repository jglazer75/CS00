import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { encryptApiKey } from '@/lib/ai/crypto';
import { z } from 'zod';

const RequestSchema = z.object({
  providerName: z.string().min(1),
  apiKey: z.string().min(1),
});

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { providerName, apiKey } = parsed.data;

  let encryptedKey: string;
  try {
    encryptedKey = encryptApiKey(apiKey);
  } catch (err) {
    console.error('Encryption failed:', err);
    return NextResponse.json({ error: 'Encryption unavailable' }, { status: 500 });
  }

  const { error } = await supabase
    .from('user_ai_providers')
    .upsert(
      {
        user_id: user.id,
        provider_name: providerName,
        encrypted_api_key: encryptedKey,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, provider_name' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
