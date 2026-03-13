import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';
import { z } from 'zod';

const BodySchema = z.object({ email: z.string().email() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });

  // Auth
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Must be admin or module owner
  const isAdmin = user.email ? isAdminEmail(user.email, 'server') : false;
  if (!isAdmin) {
    const { data: mod } = await supabase
      .from('modules')
      .select('owner_user_id, title')
      .eq('id', moduleId)
      .maybeSingle();
    if (!mod || mod.owner_user_id !== user.id) {
      // Also allow module instructors
      const { data: instr } = await supabase
        .from('module_instructors')
        .select('id')
        .eq('module_id', moduleId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!instr) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  // Fetch module title for email
  const { data: mod } = await supabase
    .from('modules')
    .select('title')
    .eq('id', moduleId)
    .maybeSingle();
  const moduleTitle = mod?.title ?? 'a module';

  // Check if user already exists
  const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
  const existing = existingUsers.find((u) => u.email?.toLowerCase() === email);

  if (existing) {
    // User exists — just enroll them
    const { error: enrollError } = await supabase
      .from('module_enrollments')
      .upsert(
        { module_id: moduleId, user_id: existing.id, enrolled_by: user.id },
        { onConflict: 'module_id,user_id' }
      );
    if (enrollError) return NextResponse.json({ error: enrollError.message }, { status: 500 });
    return NextResponse.json({ result: 'enrolled', email });
  }

  // New user — create/replace pending invitation
  await supabase.from('pending_invitations').delete().eq('email', email).eq('module_id', moduleId);
  const { data: inv, error: invError } = await supabase
    .from('pending_invitations')
    .insert({ email, module_id: moduleId, invited_by: user.id })
    .select('token')
    .single();
  if (invError || !inv) return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });

  // Send invite email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const signupUrl = `${siteUrl}/signup?invite=${inv.token}`;

  const resend = new Resend(resendKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'noreply@cs-00.vercel.app';

  const { error: emailError } = await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: `You've been invited to ${moduleTitle}`,
    html: `
      <p>You've been invited to join <strong>${moduleTitle}</strong>.</p>
      <p>Click the link below to create your account and get started:</p>
      <p><a href="${signupUrl}">Create your account</a></p>
      <p>This link expires in 7 days.</p>
      <p style="color:#888;font-size:0.85em;">If you weren't expecting this, you can ignore this email.</p>
    `,
  });

  if (emailError) return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });

  return NextResponse.json({ result: 'invited', email });
}
