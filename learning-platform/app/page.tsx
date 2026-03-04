import { getSupabaseServerClient } from '@/lib/supabase/server';
import DashboardClient from './components/DashboardClient';

export default async function Home() {
  const supabase = getSupabaseServerClient();
  const moduleLinks: { id: string; href: string; title: string; description: string }[] = [];

  if (supabase) {
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title, description')
      .eq('is_active', true)
      .order('id');

    for (const mod of modules ?? []) {
      moduleLinks.push({
        id: mod.id,
        href: `/modules/${mod.id}`,
        title: mod.title ?? mod.id,
        description: mod.description ?? '',
      });
    }
  }

  return <DashboardClient moduleLinks={moduleLinks} />;
}
