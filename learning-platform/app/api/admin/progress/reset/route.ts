import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';
import { z } from 'zod';

const RequestSchema = z.object({
  userId: z.string().uuid(),
  moduleId: z.string().min(1),
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
  if (authError || !user?.email || !isAdminEmail(user.email, 'server')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  const { userId, moduleId } = parsed.data;

  const [progressResult, stateResult] = await Promise.all([
    supabase
      .from('user_module_progress')
      .delete()
      .eq('user_id', userId)
      .eq('module_id', moduleId),
    supabase
      .from('user_module_state')
      .delete()
      .eq('user_id', userId)
      .eq('module_id', moduleId),
  ]);

  if (progressResult.error) {
    return NextResponse.json({ error: progressResult.error.message }, { status: 500 });
  }
  if (stateResult.error) {
    return NextResponse.json({ error: stateResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
