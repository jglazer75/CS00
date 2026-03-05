import { notFound, redirect } from 'next/navigation';
import { getAllModuleIds, getModulePages } from '@/lib/content';
import ModuleLandingClient from '@/app/components/ModuleLandingClient';
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

  const userClient = await getSupabaseUserClient();
  const { data: { user } } = await userClient.auth.getUser();

  let teamName: string | null = null;
  let teamRole: string | null = null;
  let moduleMetadata: Record<string, unknown> = {};

  if (user) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const isAdmin = user.email ? isAdminEmail(user.email, 'server') : false;
      if (!isAdmin) {
        const [{ data: profile }, { data: module }, { data: teamData }] = await Promise.all([
          supabase.from('profiles').select('is_instructor').eq('user_id', user.id).maybeSingle(),
          supabase.from('modules').select('is_public, metadata').eq('id', moduleId).maybeSingle(),
          supabase
            .from('team_members')
            .select('teams!inner(name, role, module_id)')
            .eq('user_id', user.id)
            .eq('teams.module_id', moduleId)
            .maybeSingle(),
        ]);

        // Also check module_instructors for per-module access
        const { data: moduleInstructor } = await supabase
          .from('module_instructors')
          .select('id')
          .eq('module_id', moduleId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile?.is_instructor && !moduleInstructor) {
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

        moduleMetadata = (module?.metadata as Record<string, unknown>) ?? {};

        if (teamData?.teams) {
          const teams = Array.isArray(teamData.teams) ? teamData.teams[0] : teamData.teams;
          teamName = (teams as { name?: string; role?: string })?.name ?? null;
          teamRole = (teams as { name?: string; role?: string })?.role ?? null;
        }
      } else {
        // Admin: still fetch module metadata for display
        const { data: module } = await supabase
          .from('modules')
          .select('metadata')
          .eq('id', moduleId)
          .maybeSingle();
        moduleMetadata = (module?.metadata as Record<string, unknown>) ?? {};
      }
    }
  }

  const pages = await getModulePages(moduleId);

  if (!pages || pages.length === 0) {
    notFound();
  }

  const slugs = pages.map((page) => page.slug);

  return (
    <ModuleLandingClient
      moduleId={moduleId}
      slugs={slugs}
      teamName={teamName}
      teamRole={teamRole}
      moduleMetadata={moduleMetadata}
    />
  );
}
