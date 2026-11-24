import React from 'react';
import {
  Users,
  UserCheck,
  Eye,
  Clock,
  Radio,
  RefreshCw,
  MousePointerClick,
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLiveVisitors } from '../hooks/useLiveVisitors';
import { StatCard } from '../components/StatCard';
import { TrafficChart } from '../components/TrafficChart';
import { DateRangePicker } from '../components/DateRangePicker';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { formatDuration, formatNumber } from '../utils/formatters';

export const OverviewPage: React.FC = () => {
  const { range, setRange, data, loading, error, refresh } = useAnalytics('7d');
  const { visitors: liveVisitors } = useLiveVisitors();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest opacity-65">
            Portfolio Telemetry
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Overview
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker value={range} onChange={setRange} />
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 hover:bg-[#A5A79B]/35 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh analytics"
            aria-label="Refresh analytics"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && <LoadingPanel />}

      {!loading && error && <ErrorStatePanel message={error} onRetry={refresh} />}

      {!loading && !error && data && (
        <>
          {/* 5 Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <StatCard
              label="Total Visitors"
              value={formatNumber(data.overview.totalVisitors)}
              icon={Users}
            />
            <StatCard
              label="Unique Visitors"
              value={formatNumber(data.overview.uniqueVisitors)}
              icon={UserCheck}
            />
            <StatCard
              label="Page Views"
              value={formatNumber(data.overview.pageViews)}
              icon={Eye}
            />
            <StatCard
              label="Avg Duration"
              value={formatDuration(data.overview.avgSessionDurationSeconds)}
              icon={Clock}
            />
            <StatCard
              label="Live Visitors"
              value={formatNumber(liveVisitors.length)}
              sublabel="Active in last 90s"
              icon={Radio}
              isLive
            />
          </div>

          {!data.hasData ? (
            <EmptyStatePanel />
          ) : (
            <>
              {/* Visitor Traffic Chart */}
              <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 sm:p-6">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-bold font-display">
                    Visitor Traffic
                  </h3>
                  <p className="text-xs opacity-65">
                    Real daily visitors and page views recorded on mydeen.vercel.app
                  </p>
                </div>
                <TrafficChart series={data.trafficSeries} />
              </div>

              {/* Custom Portfolio Interactions */}
              <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MousePointerClick size={16} />
                  <h3 className="text-base font-bold font-display">
                    Key Portfolio Actions
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { key: 'project_clicked', label: 'Projects Clicked', val: data.customEvents.project_clicked },
                    { key: 'resume_downloaded', label: 'Resume Downloads', val: data.customEvents.resume_downloaded },
                    { key: 'contact_clicked', label: 'Contact Clicks', val: data.customEvents.contact_clicked },
                    { key: 'github_clicked', label: 'GitHub Clicks', val: data.customEvents.github_clicked },
                    { key: 'linkedin_clicked', label: 'LinkedIn Clicks', val: data.customEvents.linkedin_clicked },
                  ].map((ev) => (
                    <div
                      key={ev.key}
                      className="p-3 rounded-xl bg-[#fdfcf9]/70 dark:bg-[#141414] border border-[#A5A79B]/30 dark:border-white/10"
                    >
                      <p className="text-[10px] font-mono uppercase opacity-65 truncate">
                        {ev.label}
                      </p>
                      <p className="text-xl font-bold font-display mt-1">
                        {formatNumber(ev.val)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 3-Column Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Visited Pages */}
                <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 sm:p-5">
                  <h3 className="text-base font-bold font-display mb-3">
                    Top Visited Pages
                  </h3>
                  {data.pages.length === 0 ? (
                    <p className="text-xs font-mono opacity-60">No analytics data available yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.pages.slice(0, 5).map((p) => (
                        <div
                          key={p.path}
                          className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-[#A5A79B]/20 dark:border-white/5 last:border-0"
                        >
                          <span className="font-mono truncate">{p.path}</span>
                          <span className="font-mono font-bold shrink-0">
                            {formatNumber(p.views)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Traffic Sources Overview */}
                <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 sm:p-5">
                  <h3 className="text-base font-bold font-display mb-3">
                    Traffic Sources
                  </h3>
                  {data.sources.length === 0 ? (
                    <p className="text-xs font-mono opacity-60">No analytics data available yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.sources.slice(0, 5).map((s) => (
                        <div key={s.source} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium truncate">{s.source}</span>
                            <span className="font-mono opacity-75">
                              {formatNumber(s.visitors)} ({s.percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#A5A79B]/25 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-[#181818] dark:bg-[#E8D2B5] rounded-full"
                              style={{ width: `${Math.min(100, s.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Device Breakdown */}
                <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 sm:p-5">
                  <h3 className="text-base font-bold font-display mb-3">
                    Device Breakdown
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Desktop', count: data.devices.deviceTypes.desktop },
                      { label: 'Mobile', count: data.devices.deviceTypes.mobile },
                      { label: 'Tablet', count: data.devices.deviceTypes.tablet },
                    ].map((d) => {
                      const total =
                        data.devices.deviceTypes.desktop +
                          data.devices.deviceTypes.mobile +
                          data.devices.deviceTypes.tablet || 1;
                      const pct = Math.round((d.count / total) * 100);
                      return (
                        <div key={d.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{d.label}</span>
                            <span className="font-mono opacity-75">
                              {formatNumber(d.count)} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#A5A79B]/25 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-[#A5A79B] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
