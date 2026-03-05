import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';
import { z } from 'zod';

const RequestSchema = z.object({
  moduleId: z.string().min(1),
  userId: z.string().uuid(),
});

async function getAuthedAdmin(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { error: 'Server unavailable', status: 500, supabase: null, user: null };

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401, supabase: null, user: null };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user?.email || !isAdminEmail(user.email, 'server')) {
    return { error: 'Forbidden', status: 403, supabase: null, user: null };
  }

  return { error: null, status: 200, supabase, user };
}

export async function POST(req: Request) {
  const { error, status, supabase, user } = await getAuthedAdmin(req);
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  const { moduleId, userId } = parsed.data;
  const { error: insertError } = await supabase
    .from('module_instructors')
    .upsert({ module_id: moduleId, user_id: userId, assigned_by: user.id }, { onConflict: 'module_id,user_id' });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { error, status, supabase } = await getAuthedAdmin(req);
  if (error || !supabase) {
    return NextResponse.json({ error }, { status });
  }

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  const { moduleId, userId } = parsed.data;
  const { error: deleteError } = await supabase
    .from('module_instructors')
    .delete()
    .eq('module_id', moduleId)
    .eq('user_id', userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
