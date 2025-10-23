'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { useSupabaseClient } from '../context/SupabaseClientContext';

type ModulePageMap = Map<string, string>; // slug -> module_page_id
type IdToSlugMap = Map<string, string>;

type ProgressStatus = 'idle' | 'loading' | 'unauthenticated' | 'ready' | 'error';

type ProgressState = {
  completedSlugs: string[];
  lastVisitedSlug?: string;
  percentComplete: number;
};

type HookResult = {
  status: ProgressStatus;
  completedSlugs: string[];
  percentComplete: number;
  lastVisitedSlug?: string;
  isProcessing: boolean;
  error?: string;
  markPageVisited: (slug: string) => Promise<void>;
  markPageCompleted: (slug: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const INITIAL_STATE: ProgressState = {
  completedSlugs: [],
  percentComplete: 0,
};

const ON_CONFLICT_PROGRESS = 'user_id,module_page_id';
const ON_CONFLICT_MODULE_STATE = 'user_id,module_id';

export function useModuleProgress(moduleId: string, slugs: string[]): HookResult {
  const supabase = useSupabaseClient();
  const [status, setStatus] = useState<ProgressStatus>('idle');
  const [state, setState] = useState<ProgressState>(INITIAL_STATE);
  const [userId, setUserId] = useState<string | null>(null);
  const [pageMap, setPageMap] = useState<ModulePageMap>(new Map());
  const [idToSlug, setIdToSlug] = useState<IdToSlugMap>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const [refreshNonce, setRefreshNonce] = useState(0);

  const totalPages = slugs.length;
  const slugsKey = useMemo(() => slugs.join('|'), [slugs]);

  useEffect(() => {
    let cancelled = false;

    async function initialize(client: SupabaseClient) {
      setStatus('loading');
      setError(undefined);

      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        if (!cancelled) {
          setStatus('error');
          setError(sessionError.message);
        }
        return;
      }

      const session = sessionData.session;
      if (!session) {
        if (!cancelled) {
          setStatus('unauthenticated');
          setState(INITIAL_STATE);
          setUserId(null);
        }
        return;
      }

      const currentUserId = session.user.id;
      setUserId(currentUserId);

      const { data: modulePages, error: modulePagesError } = await client
        .from('module_pages')
        .select('id, slug, sort_order')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (modulePagesError) {
        if (!cancelled) {
          setStatus('error');
          setError(modulePagesError.message);
        }
        return;
      }

      const slugToId = new Map<string, string>();
      const localIdToSlug = new Map<string, string>();
      modulePages.forEach((page) => {
        slugToId.set(page.slug, page.id);
        localIdToSlug.set(page.id, page.slug);
      });

      setPageMap(slugToId);
      setIdToSlug(localIdToSlug);

      const { data: progressRows, error: progressError } = await client
        .from('user_module_progress')
        .select('module_page_id, status, completed_at, last_viewed_at')
        .eq('module_id', moduleId);

      if (progressError) {
        if (!cancelled) {
          setStatus('error');
          setError(progressError.message);
        }
        return;
      }

      const { data: moduleStateRow, error: moduleStateError } = await client
        .from('user_module_state')
        .select('last_module_page_id, percent_complete')
        .eq('module_id', moduleId)
        .maybeSingle();

      if (moduleStateError && moduleStateError.code !== 'PGRST116') {
        if (!cancelled) {
          setStatus('error');
          setError(moduleStateError.message);
        }
        return;
      }

      const completedSlugs = new Set<string>();
      progressRows?.forEach((row) => {
        if (row.status === 'completed' || row.completed_at) {
          const slug = localIdToSlug.get(row.module_page_id);
          if (slug) {
            completedSlugs.add(slug);
          }
        }
      });

      const lastVisitedSlug = moduleStateRow?.last_module_page_id
        ? localIdToSlug.get(moduleStateRow.last_module_page_id)
        : undefined;

      const percentComplete =
        typeof moduleStateRow?.percent_complete === 'number'
          ? moduleStateRow.percent_complete
          : computePercent(completedSlugs.size, totalPages);

      if (!cancelled) {
        setState({
          completedSlugs: Array.from(completedSlugs),
          lastVisitedSlug,
          percentComplete,
        });
        setStatus('ready');
      }
    }

    initialize(supabase).catch((err: Error | PostgrestError) => {
      if (!cancelled) {
        setStatus('error');
        setError(err.message);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [moduleId, refreshNonce, slugsKey, supabase, totalPages]);

  const updateModuleState = useCallback(
    async (client: SupabaseClient, modulePageId: string, completedCount: number) => {
      if (!userId) {
        return;
      }

      const percentComplete = computePercent(completedCount, totalPages);

      const { error: upsertError } = await client
        .from('user_module_state')
        .upsert(
          {
            user_id: userId,
            module_id: moduleId,
            last_module_page_id: modulePageId,
            percent_complete: percentComplete,
          },
          { onConflict: ON_CONFLICT_MODULE_STATE }
        );

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      setState((prev) => ({
        completedSlugs: prev.completedSlugs,
        lastVisitedSlug: idToSlug.get(modulePageId) ?? prev.lastVisitedSlug,
        percentComplete,
      }));
    },
    [idToSlug, moduleId, totalPages, userId]
  );

  const markPageVisited = useCallback(
    async (slug: string) => {
      if (!userId) {
        return;
      }

      const modulePageId = pageMap.get(slug);
      if (!modulePageId) {
        console.warn(`Unable to record visit for slug "${slug}" because it is not synced.`);
        return;
      }

      setError(undefined);

      const now = new Date().toISOString();
      const { error: upsertError } = await supabase
        .from('user_module_progress')
        .upsert(
          {
            user_id: userId,
            module_id: moduleId,
            module_page_id: modulePageId,
            status: 'in_progress',
            last_viewed_at: now,
            completed_at: null,
          },
          { onConflict: ON_CONFLICT_PROGRESS }
        );

      if (upsertError) {
        setError(upsertError.message);
      } else {
        setState((prev) => ({
          completedSlugs: prev.completedSlugs,
          lastVisitedSlug: slug,
          percentComplete: prev.percentComplete,
        }));

        try {
          await updateModuleState(supabase, modulePageId, getCompletedCount(state.completedSlugs));
        } catch (moduleStateError) {
          setError((moduleStateError as Error).message);
        }
      }
    },
    [moduleId, pageMap, state.completedSlugs, supabase, updateModuleState, userId]
  );

  const markPageCompleted = useCallback(
    async (slug: string) => {
      if (!userId) {
        return;
      }

      const modulePageId = pageMap.get(slug);
      if (!modulePageId) {
        console.warn(`Unable to mark completion for slug "${slug}" because it is not synced.`);
        return;
      }

      setIsProcessing(true);
      setError(undefined);

      const now = new Date().toISOString();

      const { error: upsertError } = await supabase
        .from('user_module_progress')
        .upsert(
          {
            user_id: userId,
            module_id: moduleId,
            module_page_id: modulePageId,
            status: 'completed',
            last_viewed_at: now,
            completed_at: now,
          },
          { onConflict: ON_CONFLICT_PROGRESS }
        );

      if (upsertError) {
        setError(upsertError.message);
        setIsProcessing(false);
        return;
      }

      setState((prev) => {
        const nextCompleted = new Set(prev.completedSlugs);
        nextCompleted.add(slug);

        return {
          completedSlugs: Array.from(nextCompleted),
          lastVisitedSlug: slug,
          percentComplete: computePercent(nextCompleted.size, totalPages),
        };
      });

      try {
        await updateModuleState(supabase, modulePageId, getCompletedCount([...state.completedSlugs, slug]));
      } catch (moduleStateError) {
        setError((moduleStateError as Error).message);
      } finally {
        setIsProcessing(false);
      }
    },
    [moduleId, pageMap, state.completedSlugs, supabase, totalPages, updateModuleState, userId]
  );

  const refresh = useCallback(async () => {
    if (status === 'loading') {
      return;
    }

    setStatus('loading');
    setError(undefined);
    setRefreshNonce((prev) => prev + 1);
  }, [status]);

  return {
    status,
    completedSlugs: state.completedSlugs,
    percentComplete: state.percentComplete,
    lastVisitedSlug: state.lastVisitedSlug,
    isProcessing,
    error,
    markPageVisited,
    markPageCompleted,
    refresh,
  };
}

function computePercent(completedCount: number, total: number) {
  if (!total || total <= 0) {
    return 0;
  }

  const raw = (completedCount / total) * 100;
  return Math.min(100, Math.round(raw * 100) / 100);
}

function getCompletedCount(completedSlugs: string[]) {
  return new Set(completedSlugs).size;
}
