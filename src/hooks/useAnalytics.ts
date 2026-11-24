import { useState, useEffect, useCallback } from 'react';
import { AnalyticsDashboardResponse, DateRangeOption } from '../types/analytics';
import { fetchAnalyticsData } from '../services/analyticsApi';
import { SiteId, useSite } from '../context/SiteContext';

export function useAnalytics(initialRange: DateRangeOption = '7d') {
  const { site } = useSite();
  const [range, setRange] = useState<DateRangeOption>(initialRange);
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selectedRange: DateRangeOption, selectedSite: SiteId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalyticsData(selectedRange, selectedSite);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range, site);
  }, [range, site, load]);

  return {
    range,
    setRange,
    site,
    data,
    loading,
    error,
    refresh: () => load(range, site),
  };
}
