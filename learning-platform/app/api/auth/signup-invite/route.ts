import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const BodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

// GET: look up a pending invitation by token (public — no auth required)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });

  const { data: inv } = await supabase
    .from('pending_invitations')
    .select('email, module_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!inv) return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
  if (new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired. Ask your instructor for a new one.' }, { status: 410 });
  }

  return NextResponse.json({ email: inv.email, moduleId: inv.module_id });
}

// POST: complete signup — create user, enroll, sign in, consume token
export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  const { token, password } = parsed.data;

  // Look up invitation
  const { data: inv } = await supabase
    .from('pending_invitations')
    .select('email, module_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!inv) return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
  if (new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired. Ask your instructor for a new one.' }, { status: 410 });
  }

  const { email, module_id } = inv;

  // Create user (auto-confirmed — invite email already proves ownership)
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    // If user already exists (race or re-attempt), proceed with enrollment
    if (!createError.message.toLowerCase().includes('already')) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }
  }

  // Resolve user id (either newly created or existing)
  let userId = created?.user?.id;
  if (!userId) {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    userId = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  }
  if (!userId) return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 });

  // Enroll
  await supabase
    .from('module_enrollments')
    .upsert({ module_id, user_id: userId }, { onConflict: 'module_id,user_id' });

  // Consume invitation
  await supabase.from('pending_invitations').delete().eq('token', token);

  // Sign in and return session so the client can set cookies
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return NextResponse.json({ error: signInError.message }, { status: 400 });

  return NextResponse.json({
    accessToken: session.session?.access_token,
    refreshToken: session.session?.refresh_token,
    moduleId: module_id,
  });
}
