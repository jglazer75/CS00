import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseUserClient } from '@/lib/supabase/serverUser';
import { isAdminEmail } from '@/lib/auth';

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const userClient = await getSupabaseUserClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    redirect('/');
  }

  const isAdmin = user.email ? isAdminEmail(user.email, 'server') : false;
  if (!isAdmin) {
    const [{ data: profile }, { data: instructorRows }] = await Promise.all([
      supabase.from('profiles').select('is_instructor').eq('user_id', user.id).maybeSingle(),
      supabase.from('module_instructors').select('module_id').eq('user_id', user.id).limit(1),
    ]);

    const hasAccess = profile?.is_instructor || (instructorRows && instructorRows.length > 0);
    if (!hasAccess) {
      redirect('/');
    }
  }

  return <>{children}</>;
}
