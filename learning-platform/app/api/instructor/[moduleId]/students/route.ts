import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server unavailable' }, { status: 500 });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check authorization: admin, global instructor, or module-specific instructor
  const isAdmin = user.email ? isAdminEmail(user.email, 'server') : false;
  if (!isAdmin) {
    const [{ data: profile }, { data: moduleInstructor }] = await Promise.all([
      supabase.from('profiles').select('is_instructor').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('module_instructors')
        .select('id')
        .eq('module_id', moduleId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (!profile?.is_instructor && !moduleInstructor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Fetch enrolled student IDs for this module
  const { data: enrollments, error: enrollError } = await supabase
    .from('module_enrollments')
    .select('user_id')
    .eq('module_id', moduleId);

  if (enrollError) {
    return NextResponse.json({ error: enrollError.message }, { status: 500 });
  }

  const userIds = (enrollments ?? []).map((e) => e.user_id);
  if (userIds.length === 0) {
    return NextResponse.json({ students: [] });
  }

  // Resolve emails via admin API (service role)
  const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const students = authUsers.users
    .filter((u) => userIds.includes(u.id))
    .map((u) => ({ id: u.id, email: u.email ?? u.id }));

  return NextResponse.json({ students });
}
