import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type DateRangeOption = 'today' | '7d' | '30d' | '90d';

const RANGE_DAYS: Record<DateRangeOption, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

async function runHogQL(
  host: string,
  projectId: string,
  apiKey: string,
  query: string
): Promise<unknown[][]> {
  const url = `${host.replace(/\/$/, '')}/api/projects/${projectId}/query/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`PostHog query failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const json = (await response.json()) as { results?: unknown[][] };
  return json.results ?? [];
}

function classifySource(domain: string): 'Direct' | 'Google' | 'LinkedIn' | 'GitHub' | 'Other' {
  const d = (domain || '').toLowerCase();
  if (!d || d === '$direct' || d === 'direct') return 'Direct';
  if (d.includes('google.')) return 'Google';
  if (d.includes('linkedin.com') || d.includes('lnkd.in')) return 'LinkedIn';
  if (d.includes('github.com') || d.includes('github.io')) return 'GitHub';
  return 'Other';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const posthogKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID;
  const posthogHost = process.env.POSTHOG_API_HOST || 'https://us.posthog.com';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(503).json({ error: 'Unable to load analytics data. Please try again.' });
  }

  // 1. Verify Admin JWT via Supabase Auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7).trim();

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }

  const allowedAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (
    allowedAdmins.length > 0 &&
    !allowedAdmins.includes((userData.user.email || '').toLowerCase())
  ) {
    return res.status(403).json({ error: 'Forbidden: admin access required.' });
  }

  if (!posthogKey || !posthogProjectId) {
    return res.status(503).json({
      error: 'PostHog API credentials are not configured on the server yet.',
    });
  }

  const rawRange = String(req.query.range || '7d') as DateRangeOption;
  const range: DateRangeOption = rawRange in RANGE_DAYS ? rawRange : '7d';
  const days = RANGE_DAYS[range];
  const intervalFilter =
    range === 'today'
      ? `timestamp >= toStartOfDay(now())`
      : `timestamp >= now() - INTERVAL ${days} DAY`;

  const rawSite = String(req.query.site || 'mydeen.vercel.app').trim();
  const ALLOWED_SITES = new Set(['mydeen.vercel.app', 'mydeenblog.vercel.app']);
  const siteFilter = ALLOWED_SITES.has(rawSite)
    ? `AND properties.$host = '${rawSite}'`
    : '';
  const whereClause = `${intervalFilter} ${siteFilter}`.trim();

  try {
    const [
      overviewRows,
      durationRows,
      seriesRows,
      pagesRows,
      sourcesRows,
      deviceTypeRows,
      browserRows,
      osRows,
      customEventsRows,
      liveRes,
    ] = await Promise.all([
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT count() AS pageviews, count(DISTINCT distinct_id) AS unique_visitors, count(DISTINCT properties.$session_id) AS sessions FROM events WHERE event = '$pageview' AND ${whereClause}`
      ),
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT avg(session_dur) FROM (SELECT properties.$session_id AS sid, dateDiff('second', min(timestamp), max(timestamp)) AS session_dur FROM events WHERE ${whereClause} AND properties.$session_id IS NOT NULL GROUP BY sid HAVING session_dur > 0)`
      ),
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT toString(toDate(timestamp)) AS d, count(DISTINCT distinct_id) AS visitors, count() AS views FROM events WHERE event = '$pageview' AND ${whereClause} GROUP BY d ORDER BY d ASC`
      ),
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT coalesce(nullIf(properties.$pathname, ''), '/') AS path, count() AS views, count(DISTINCT distinct_id) AS uniq FROM events WHERE event = '$pageview' AND ${whereClause} GROUP BY path ORDER BY views DESC LIMIT 20`
      ),
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT coalesce(nullIf(properties.$referring_domain, ''), '$direct') AS ref, count(DISTINCT distinct_id) AS visitors FROM events WHERE event = '$pageview' AND ${whereClause} GROUP BY ref ORDER BY visitors DESC LIMIT 20`
      ),
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT coalesce(nullIf(properties.$device_type, ''), 'Desktop') AS dtype, count(DISTINCT distinct_id) AS visitors FROM events WHERE event = '$pageview' AND ${whereClause} GROUP BY dtype`
      ),
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT coalesce(nullIf(properties.$browser, ''), 'Unknown') AS br, count(DISTINCT distinct_id) AS visitors FROM events WHERE event = '$pageview' AND ${whereClause} GROUP BY br ORDER BY visitors DESC LIMIT 10`
      ),
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT coalesce(nullIf(properties.$os, ''), 'Unknown') AS os_name, count(DISTINCT distinct_id) AS visitors FROM events WHERE event = '$pageview' AND ${whereClause} GROUP BY os_name ORDER BY visitors DESC LIMIT 10`
      ),
      runHogQL(
        posthogHost,
        posthogProjectId,
        posthogKey,
        `SELECT event, count() AS cnt FROM events WHERE event IN ('project_clicked', 'resume_downloaded', 'contact_clicked', 'github_clicked', 'linkedin_clicked') AND ${whereClause} GROUP BY event`
      ),
      supabaseAdmin
        .from('live_visitors')
        .select('visitor_id', { count: 'exact', head: true })
        .gte(
          'last_active_at',
          new Date(
            Date.now() - Number(process.env.LIVE_VISITOR_TIMEOUT_SECONDS || 90) * 1000
          ).toISOString()
        ),
    ]);

    const ov = overviewRows[0] ?? [0, 0, 0];
    const pageViews = Number(ov[0] ?? 0);
    const uniqueVisitors = Number(ov[1] ?? 0);
    const totalVisitors = Number(ov[2] ?? 0) || uniqueVisitors;
    const avgSessionDurationSeconds = Number(durationRows[0]?.[0] ?? 0) || 0;
    const liveVisitorsCount = liveRes.count ?? 0;

    const trafficSeries = seriesRows.map((r) => ({
      date: String(r[0]),
      visitors: Number(r[1] ?? 0),
      pageViews: Number(r[2] ?? 0),
    }));

    const pages = pagesRows.map((r) => ({
      path: String(r[0]),
      views: Number(r[1] ?? 0),
      uniqueVisitors: Number(r[2] ?? 0),
      avgTimeSeconds: avgSessionDurationSeconds,
    }));

    const totalSourceVisitors =
      sourcesRows.reduce((acc, r) => acc + Number(r[1] ?? 0), 0) || 1;
    const sources = sourcesRows.map((r) => {
      const rawRef = String(r[0]);
      const count = Number(r[1] ?? 0);
      const category = classifySource(rawRef);
      return {
        source: rawRef === '$direct' ? 'Direct' : rawRef,
        category,
        visitors: count,
        percentage: Math.round((count / totalSourceVisitors) * 100),
      };
    });

    let mobile = 0;
    let desktop = 0;
    let tablet = 0;
    for (const r of deviceTypeRows) {
      const dt = String(r[0]).toLowerCase();
      const cnt = Number(r[1] ?? 0);
      if (dt.includes('mobile')) mobile += cnt;
      else if (dt.includes('tablet')) tablet += cnt;
      else desktop += cnt;
    }

    const totalBrowsers =
      browserRows.reduce((acc, r) => acc + Number(r[1] ?? 0), 0) || 1;
    const browsers = browserRows.map((r) => {
      const cnt = Number(r[1] ?? 0);
      return {
        name: String(r[0]),
        visitors: cnt,
        percentage: Math.round((cnt / totalBrowsers) * 100),
      };
    });

    const totalOs =
      osRows.reduce((acc, r) => acc + Number(r[1] ?? 0), 0) || 1;
    const operatingSystems = osRows.map((r) => {
      const cnt = Number(r[1] ?? 0);
      return {
        name: String(r[0]),
        visitors: cnt,
        percentage: Math.round((cnt / totalOs) * 100),
      };
    });

    const customEvents = {
      project_clicked: 0,
      resume_downloaded: 0,
      contact_clicked: 0,
      github_clicked: 0,
      linkedin_clicked: 0,
    };
    for (const r of customEventsRows) {
      const name = String(r[0]) as keyof typeof customEvents;
      if (name in customEvents) {
        customEvents[name] = Number(r[1] ?? 0);
      }
    }

    return res.status(200).json({
      range,
      connected: true,
      hasData: pageViews > 0 || uniqueVisitors > 0,
      overview: {
        totalVisitors,
        uniqueVisitors,
        pageViews,
        avgSessionDurationSeconds,
        liveVisitors: liveVisitorsCount,
      },
      trafficSeries,
      pages,
      sources,
      devices: {
        deviceTypes: { mobile, desktop, tablet },
        browsers,
        operatingSystems,
      },
      customEvents,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Analytics API Error:', err);
    return res.status(502).json({
      error: 'Unable to load analytics data. Please try again.',
    });
  }
}
