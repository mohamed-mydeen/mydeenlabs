import { useState, useEffect, useCallback } from 'react';
import { LiveVisitor } from '../types/analytics';
import { supabase } from '../services/supabaseClient';

const ACTIVE_WINDOW_SECONDS = 90;

function isRecentlyActive(lastActiveIso: string): boolean {
  const diffSeconds = (Date.now() - new Date(lastActiveIso).getTime()) / 1000;
  return diffSeconds <= ACTIVE_WINDOW_SECONDS;
}

export function useLiveVisitors() {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLive = useCallback(async () => {
    if (!supabase) {
      setError('Unable to load analytics data. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const cutoffIso = new Date(Date.now() - ACTIVE_WINDOW_SECONDS * 1000).toISOString();
      const { data, error: queryError } = await supabase
        .from('live_visitors')
        .select('visitor_id, current_page, device_type, browser, os, country, last_active_at')
        .gte('last_active_at', cutoffIso)
        .order('last_active_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setVisitors((data ?? []) as LiveVisitor[]);
      setError(null);
    } catch {
      setError('Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();

    const client = supabase;
    if (!client) return;

    const channel = client
      .channel('live-visitors-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_visitors' },
        () => {
          fetchLive();
        }
      )
      .subscribe();

    // Prune stale sessions every 10 seconds so inactive visitors disappear promptly
    const pruneInterval = setInterval(() => {
      setVisitors((prev) => prev.filter((v) => isRecentlyActive(v.last_active_at)));
    }, 10000);

    return () => {
      clearInterval(pruneInterval);
      client.removeChannel(channel);
    };
  }, [fetchLive]);

  return {
    visitors,
    loading,
    error,
    refresh: fetchLive,
    activeWindowSeconds: ACTIVE_WINDOW_SECONDS,
  };
}
