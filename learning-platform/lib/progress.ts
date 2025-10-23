import { getSupabaseServerClient } from './supabase';

export type ModuleStateSummary = {
  moduleId: string;
  percentComplete: number;
  lastModulePageId: string | null;
};

export async function getUserModuleStates(userId: string): Promise<ModuleStateSummary[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('user_module_state')
    .select('module_id, percent_complete, last_module_page_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Unable to load module progress: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    moduleId: row.module_id,
    percentComplete: typeof row.percent_complete === 'number' ? row.percent_complete : 0,
    lastModulePageId: row.last_module_page_id ?? null,
  }));
}
