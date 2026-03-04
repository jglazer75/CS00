import { getAllModuleIds, getPageData, getModulePages, getModuleStructure } from '@/lib/content';
import ModulePageClient from '@/app/components/ModulePageClient';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseUserClient } from '@/lib/supabase/serverUser';
import { isAdminEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const moduleIds = await getAllModuleIds();
  const paths = [];

  for (const { params } of moduleIds) {
    const { moduleId } = params;
    const pages = await getModulePages(moduleId);
    for (const page of pages) {
      paths.push({
        moduleId: moduleId,
        slug: page.slug,
      });
    }
  }

  return paths;
}

export default async function Page({ params }) {
  const { moduleId, slug } = params;

  const userClient = await getSupabaseUserClient();
  const { data: { user } } = await userClient.auth.getUser();

  const userRoles = [];

  if (user) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const isAdmin = user.email ? isAdminEmail(user.email, 'server') : false;

      if (isAdmin) {
        userRoles.push('Instructor');
      } else {
        // Single profile query used for both access control and role derivation
        const [{ data: profile }, { data: module }, { data: teamData }] = await Promise.all([
          supabase.from('profiles').select('is_instructor').eq('user_id', user.id).maybeSingle(),
          supabase.from('modules').select('is_public').eq('id', moduleId).maybeSingle(),
          supabase
            .from('team_members')
            .select('teams!inner(role, module_id)')
            .eq('user_id', user.id)
            .eq('teams.module_id', moduleId)
            .maybeSingle(),
        ]);

        if (profile?.is_instructor) {
          userRoles.push('Instructor');
        } else {
          // Access control: must be enrolled or module must be public
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

        const teamRole = teamData?.teams?.role;
        if (teamRole) userRoles.push(teamRole);
      }
    }
  }

  const pageData = await getPageData(moduleId, slug);
  const navData = await getModuleStructure(moduleId, userRoles);

  return <ModulePageClient moduleId={moduleId} slug={slug} navData={navData} pageData={pageData} />;
}
