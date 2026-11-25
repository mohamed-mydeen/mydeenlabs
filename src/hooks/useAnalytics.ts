import { useEffect } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnalyticsDashboardResponse, DateRangeOption } from '../types/analytics';
import { fetchAnalyticsData } from '../services/analyticsApi';
import { useSite } from '../context/SiteContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { QUERY_KEYS } from '../services/queryClient';

const ALL_RANGES: DateRangeOption[] = ['today', '7d', '30d', '90d'];

export function useAnalytics(_initialRange?: DateRangeOption) {
  const { site, range, setRange } = useSite();
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery<AnalyticsDashboardResponse, Error>({
    queryKey: QUERY_KEYS.analytics(range, site, activeWorkspace.id),
    queryFn: () => fetchAnalyticsData(range, site),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  });

  // Warm the remaining date ranges silently in the background once the active range resolves,
  // so switching 7d -> 30d -> Today -> 7d renders instantaneously with zero loading flicker.
  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;

    const others = ALL_RANGES.filter((r) => r !== range);
    others.forEach((r) => {
      const key = QUERY_KEYS.analytics(r, site, activeWorkspace.id);
      if (!qc.getQueryData(key)) {
        void qc.prefetchQuery({
          queryKey: key,
          queryFn: () => fetchAnalyticsData(r, site),
          staleTime: 5 * 60_000,
        });
      }
    });
  }, [query.data, query.isPlaceholderData, range, site, activeWorkspace.id, qc]);

  return {
    range,
    setRange,
    site,
    data: query.data ?? null,
    // Only show full-page skeleton on initial cold load when zero data is available
    loading: query.isLoading && !query.data,
    isFetching: query.isFetching,
    error: query.error && !query.data ? query.error.message : null,
    refresh: () => void query.refetch(),
  };
}
