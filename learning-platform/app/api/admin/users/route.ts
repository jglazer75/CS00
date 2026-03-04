import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';

export async function GET(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });
  }

  // Authenticate caller
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email || !isAdminEmail(user.email, 'server')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // List all users via admin API (service role)
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data?.users ?? []).map((u) => ({ id: u.id, email: u.email ?? '' }));
  return NextResponse.json({ users });
}
