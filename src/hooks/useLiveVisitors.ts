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
    staleTime: 60_000,
    // Controlled polling fallback only if Supabase Realtime WebSocket is unavailable
    refetchInterval: realtimeStatus === 'polling' ? 15_000 : false,
  });

  useEffect(() => {
    const unsubscribe = subscribeToTableChanges<LiveVisitor>(
      'live-visitors-realtime',
      'live_visitors',
      (payload) => {
        // Socket.IO-style instant in-place cache mutation without page reload or skeleton flash
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const incoming = payload.new;
          if (!incoming?.visitor_id) return;

          qc.setQueryData<LiveVisitor[]>(queryKey, (prev = []) => {
            const exists = prev.some((v) => v.visitor_id === incoming.visitor_id);
            const updated = exists
              ? prev.map((v) => (v.visitor_id === incoming.visitor_id ? incoming : v))
              : [incoming, ...prev];
            return [...updated].sort(
              (a, b) =>
                new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime()
            );
          });

          // Silently refresh active analytics summary in the background on new visitor arrival
          if (payload.eventType === 'INSERT') {
            void qc.invalidateQueries({
              queryKey: ['analytics', activeWorkspace.id],
              refetchType: 'active',
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.visitor_id;
          if (deletedId) {
            qc.setQueryData<LiveVisitor[]>(queryKey, (prev = []) =>
              prev.filter((v) => v.visitor_id !== deletedId)
            );
          }
        }
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
    loading: query.isLoading && !query.data,
    isFetching: query.isFetching,
    realtimeStatus,
    error: query.error && !query.data ? query.error.message : null,
    refresh: () => void query.refetch(),
    activeWindowSeconds: ACTIVE_WINDOW_SECONDS,
  };
}
