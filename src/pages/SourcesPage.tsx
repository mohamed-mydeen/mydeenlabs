import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RefreshCw, Share2 } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { DateRangePicker } from '../components/DateRangePicker';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { AnimatedProgressBar, HybridCard } from '../components/MotionPrimitives';
import { formatNumber } from '../utils/formatters';

export const SourcesPage: React.FC = () => {
  const { range, setRange, data, loading, error, refresh } = useAnalytics('7d');
  const reduced = useReducedMotion();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest opacity-65">
            Referrer Attribution
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Traffic Sources
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker value={range} onChange={setRange} />
          <motion.button
            whileTap={reduced ? undefined : { scale: 0.94 }}
            onClick={refresh}
            disabled={loading}
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl hybrid-panel hover:border-[#181818]/30 dark:hover:border-[#E8D2B5]/30 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Refresh sources"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {loading && <LoadingPanel />}
      {!loading && error && <ErrorStatePanel message={error} onRetry={refresh} />}
      {!loading && !error && data && data.sources.length === 0 && <EmptyStatePanel />}

      {!loading && !error && data && data.sources.length > 0 && (
        <HybridCard className="p-4 sm:p-6 space-y-4">
          {data.sources.map((src) => (
            <div key={src.source} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Share2 size={14} className="opacity-65 shrink-0" />
                  <span className="font-semibold truncate">{src.source}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#A5A79B]/25 dark:bg-white/10 opacity-80 shrink-0">
                    {src.category}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold shrink-0 tabular-nums">
                  {formatNumber(src.visitors)} visitors ({src.percentage}%)
                </span>
              </div>
              <AnimatedProgressBar
                percentage={src.percentage}
                variant="primary"
                className="h-2"
              />
            </div>
          ))}
        </HybridCard>
      )}
    </div>
  );
};
