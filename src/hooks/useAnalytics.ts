import { useState, useEffect, useCallback } from 'react';
import { AnalyticsDashboardResponse, DateRangeOption } from '../types/analytics';
import { fetchAnalyticsData } from '../services/analyticsApi';

export function useAnalytics(initialRange: DateRangeOption = '7d') {
  const [range, setRange] = useState<DateRangeOption>(initialRange);
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selectedRange: DateRangeOption) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalyticsData(selectedRange);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  return {
    range,
    setRange,
    data,
    loading,
    error,
    refresh: () => load(range),
  };
}
