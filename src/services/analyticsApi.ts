import { AnalyticsDashboardResponse, DateRangeOption } from '../types/analytics';
import { SiteId } from '../context/SiteContext';
import { supabase } from './supabaseClient';

export async function fetchAnalyticsData(
  range: DateRangeOption,
  site: SiteId = 'mydeen.vercel.app'
): Promise<AnalyticsDashboardResponse> {
  if (!supabase) {
    throw new Error('Unable to load analytics data. Please try again.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(
    `/api/analytics?range=${encodeURIComponent(range)}&site=${encodeURIComponent(site)}`,
    {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || 'Unable to load analytics data. Please try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Unable to load analytics data. Please try again.');
  }

  return (await response.json()) as AnalyticsDashboardResponse;
}
