import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsDashboardResponse, DateRangeOption } from '../types/analytics';
import { fetchAnalyticsData } from '../services/analyticsApi';
import { useSite } from '../context/SiteContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { QUERY_KEYS } from '../services/queryClient';

export function useAnalytics(initialRange: DateRangeOption = '7d') {
  const { site } = useSite();
  const { activeWorkspace } = useWorkspace();
  const [range, setRange] = useState<DateRangeOption>(initialRange);

  const query = useQuery<AnalyticsDashboardResponse, Error>({
    queryKey: QUERY_KEYS.analytics(range, site, activeWorkspace.id),
    queryFn: () => fetchAnalyticsData(range, site),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  return {
    range,
    setRange,
    site,
    data: query.data ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? query.error.message : null,
    refresh: () => void query.refetch(),
  };
}
