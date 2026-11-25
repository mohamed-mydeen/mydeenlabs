import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LiveVisitor } from '../types/analytics';
import {
  RealtimeConnectionStatus,
  supabase,
  subscribeToTableChanges,
} from '../services/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import { QUERY_KEYS } from '../services/queryClient';

const ACTIVE_WINDOW_SECONDS = 90;

function isRecentlyActive(lastActiveIso: string): boolean {
  const diffSeconds = (Date.now() - new Date(lastActiveIso).getTime()) / 1000;
  return diffSeconds <= ACTIVE_WINDOW_SECONDS;
}

async function fetchActiveVisitors(): Promise<LiveVisitor[]> {
  if (!supabase) {
    throw new Error('Unable to load analytics data. Please try again.');
  }

  const cutoffIso = new Date(Date.now() - ACTIVE_WINDOW_SECONDS * 1000).toISOString();
  const { data, error } = await supabase
    .from('live_visitors')
    .select('visitor_id, current_page, device_type, browser, os, country, last_active_at')
    .gte('last_active_at', cutoffIso)
    .order('last_active_at', { ascending: false });

  if (error) {
    throw new Error('Unable to load analytics data. Please try again.');
  }

  return (data ?? []) as LiveVisitor[];
}

export function useLiveVisitors() {
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeConnectionStatus>('connecting');

  const queryKey = QUERY_KEYS.liveVisitors(activeWorkspace.id);

  const query = useQuery<LiveVisitor[], Error>({
    queryKey,
    queryFn: fetchActiveVisitors,
    staleTime: 15_000,
    // Controlled polling fallback if Supabase Realtime is unavailable
    refetchInterval: realtimeStatus === 'polling' ? 15_000 : false,
  });

  useEffect(() => {
    const unsubscribe = subscribeToTableChanges<LiveVisitor>(
      'live-visitors-realtime',
      'live_visitors',
      () => {
        void qc.invalidateQueries({ queryKey });
      },
      setRealtimeStatus
    );

    // Prune stale sessions every 10 seconds directly in cache
    const pruneInterval = window.setInterval(() => {
      qc.setQueryData<LiveVisitor[]>(queryKey, (prev) =>
        prev ? prev.filter((v) => isRecentlyActive(v.last_active_at)) : prev
      );
    }, 10_000);

    return () => {
      window.clearInterval(pruneInterval);
      unsubscribe();
    };
  }, [qc, activeWorkspace.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    visitors: query.data ?? [],
    loading: query.isLoading,
    isFetching: query.isFetching,
    realtimeStatus,
    error: query.error ? query.error.message : null,
    refresh: () => void query.refetch(),
    activeWindowSeconds: ACTIVE_WINDOW_SECONDS,
  };
}
