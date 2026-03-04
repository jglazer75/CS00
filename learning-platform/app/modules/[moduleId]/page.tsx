import { notFound, redirect } from 'next/navigation';
import { getAllModuleIds, getModulePages } from '@/lib/content';
import ModuleRedirectClient from '@/app/components/ModuleRedirectClient';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseUserClient } from '@/lib/supabase/serverUser';
import { isAdminEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type ModuleParams = {
  params: {
    moduleId: string;
  };
};

export async function generateStaticParams() {
  const moduleIds = await getAllModuleIds();
  return moduleIds.map(({ params }) => params);
}

export default async function ModuleIndexPage({ params }: ModuleParams) {
  const { moduleId } = params;

  // Access control
  const userClient = await getSupabaseUserClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (user) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      // Check if admin/instructor — they always pass
      const isAdmin = user.email ? isAdminEmail(user.email, 'server') : false;
      if (!isAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_instructor')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile?.is_instructor) {
          const { data: module } = await supabase
            .from('modules')
            .select('is_public')
            .eq('id', moduleId)
            .maybeSingle();

          if (!module?.is_public) {
            const { data: enrollment } = await supabase
              .from('module_enrollments')
              .select('id')
              .eq('module_id', moduleId)
              .eq('user_id', user.id)
              .maybeSingle();

            if (!enrollment) {
              redirect('/');
            }
          }
        }
      }
    }
  }

  const pages = await getModulePages(moduleId);

  if (!pages || pages.length === 0) {
    notFound();
  }

  const slugs = pages.map((page) => page.slug);

  return <ModuleRedirectClient moduleId={moduleId} slugs={slugs} />;
}
