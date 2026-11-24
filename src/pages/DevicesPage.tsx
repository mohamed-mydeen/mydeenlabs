import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Monitor, Smartphone, Tablet, RefreshCw } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { DateRangePicker } from '../components/DateRangePicker';
import { StatCard } from '../components/StatCard';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { AnimatedProgressBar, HybridCard } from '../components/MotionPrimitives';
import { formatNumber } from '../utils/formatters';

export const DevicesPage: React.FC = () => {
  const { range, setRange, data, loading, error, refresh } = useAnalytics('7d');
  const reduced = useReducedMotion();

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
          <motion.button
            whileTap={reduced ? undefined : { scale: 0.94 }}
            onClick={refresh}
            disabled={loading}
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl hybrid-panel hover:border-[#181818]/30 dark:hover:border-[#E8D2B5]/30 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Refresh devices"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </motion.button>
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
              numericValue={data.devices.deviceTypes.mobile}
              formatter={formatNumber}
              icon={Smartphone}
            />
            <StatCard
              label="Desktop Visitors"
              value={formatNumber(data.devices.deviceTypes.desktop)}
              numericValue={data.devices.deviceTypes.desktop}
              formatter={formatNumber}
              icon={Monitor}
            />
            <StatCard
              label="Tablet Visitors"
              value={formatNumber(data.devices.deviceTypes.tablet)}
              numericValue={data.devices.deviceTypes.tablet}
              formatter={formatNumber}
              icon={Tablet}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Browsers */}
            <HybridCard className="p-5 space-y-3.5">
              <h3 className="text-base font-bold font-display">Browser Breakdown</h3>
              {data.devices.browsers.length === 0 ? (
                <p className="text-xs font-mono opacity-60">No analytics data available yet.</p>
              ) : (
                data.devices.browsers.map((b) => (
                  <div key={b.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{b.name}</span>
                      <span className="font-mono font-bold tabular-nums">
                        {formatNumber(b.visitors)} ({b.percentage}%)
                      </span>
                    </div>
                    <AnimatedProgressBar percentage={b.percentage} variant="primary" />
                  </div>
                ))
              )}
            </HybridCard>

            {/* Operating Systems */}
            <HybridCard className="p-5 space-y-3.5">
              <h3 className="text-base font-bold font-display">Operating System Breakdown</h3>
              {data.devices.operatingSystems.length === 0 ? (
                <p className="text-xs font-mono opacity-60">No analytics data available yet.</p>
              ) : (
                data.devices.operatingSystems.map((os) => (
                  <div key={os.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{os.name}</span>
                      <span className="font-mono font-bold tabular-nums">
                        {formatNumber(os.visitors)} ({os.percentage}%)
                      </span>
                    </div>
                    <AnimatedProgressBar percentage={os.percentage} variant="sage" />
                  </div>
                ))
              )}
            </HybridCard>
          </div>
        </>
      )}
    </div>
  );
};
