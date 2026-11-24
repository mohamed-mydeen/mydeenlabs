import React from 'react';
import { Monitor, Smartphone, Tablet, RefreshCw } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { DateRangePicker } from '../components/DateRangePicker';
import { StatCard } from '../components/StatCard';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { formatNumber } from '../utils/formatters';

export const DevicesPage: React.FC = () => {
  const { range, setRange, data, loading, error, refresh } = useAnalytics('7d');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest opacity-65">
            Client Environments
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Devices &amp; Browsers
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker value={range} onChange={setRange} />
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 hover:bg-[#A5A79B]/35 transition-colors cursor-pointer"
            aria-label="Refresh devices"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && <LoadingPanel />}
      {!loading && error && <ErrorStatePanel message={error} onRetry={refresh} />}
      {!loading && !error && data && !data.hasData && <EmptyStatePanel />}

      {!loading && !error && data && data.hasData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Mobile Visitors"
              value={formatNumber(data.devices.deviceTypes.mobile)}
              icon={Smartphone}
            />
            <StatCard
              label="Desktop Visitors"
              value={formatNumber(data.devices.deviceTypes.desktop)}
              icon={Monitor}
            />
            <StatCard
              label="Tablet Visitors"
              value={formatNumber(data.devices.deviceTypes.tablet)}
              icon={Tablet}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Browsers */}
            <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-5 space-y-3.5">
              <h3 className="text-base font-bold font-display">Browser Breakdown</h3>
              {data.devices.browsers.length === 0 ? (
                <p className="text-xs font-mono opacity-60">No analytics data available yet.</p>
              ) : (
                data.devices.browsers.map((b) => (
                  <div key={b.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{b.name}</span>
                      <span className="font-mono font-bold">
                        {formatNumber(b.visitors)} ({b.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#A5A79B]/25 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#181818] dark:bg-[#E8D2B5] rounded-full"
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Operating Systems */}
            <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-5 space-y-3.5">
              <h3 className="text-base font-bold font-display">Operating System Breakdown</h3>
              {data.devices.operatingSystems.length === 0 ? (
                <p className="text-xs font-mono opacity-60">No analytics data available yet.</p>
              ) : (
                data.devices.operatingSystems.map((os) => (
                  <div key={os.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{os.name}</span>
                      <span className="font-mono font-bold">
                        {formatNumber(os.visitors)} ({os.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#A5A79B]/25 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#A5A79B] rounded-full"
                        style={{ width: `${Math.min(100, os.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
