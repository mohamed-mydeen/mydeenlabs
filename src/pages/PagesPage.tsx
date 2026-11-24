import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FileText, RefreshCw } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { DateRangePicker } from '../components/DateRangePicker';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { HybridCard, HYBRID_EASE } from '../components/MotionPrimitives';
import { formatDuration, formatNumber } from '../utils/formatters';

export const PagesPage: React.FC = () => {
  const { range, setRange, data, loading, error, refresh } = useAnalytics('7d');
  const reduced = useReducedMotion();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest opacity-65">
            Navigation Telemetry
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Pages
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker value={range} onChange={setRange} />
          <motion.button
            whileTap={reduced ? undefined : { scale: 0.94 }}
            onClick={refresh}
            disabled={loading}
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl hybrid-panel hover:border-[#181818]/30 dark:hover:border-[#E8D2B5]/30 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Refresh pages"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {loading && <LoadingPanel />}
      {!loading && error && <ErrorStatePanel message={error} onRetry={refresh} />}
      {!loading && !error && data && data.pages.length === 0 && <EmptyStatePanel />}

      {!loading && !error && data && data.pages.length > 0 && (
        <>
          {/* Desktop Table */}
          <HybridCard className="hidden md:block overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#A5A79B]/30 dark:border-white/10 text-[11px] font-mono uppercase opacity-70">
                  <th className="py-3.5 px-5">Page Path</th>
                  <th className="py-3.5 px-5 text-right">Total Views</th>
                  <th className="py-3.5 px-5 text-right">Unique Visitors</th>
                  <th className="py-3.5 px-5 text-right">Avg Time on Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A5A79B]/20 dark:divide-white/5 text-sm">
                {data.pages.map((page, idx) => (
                  <motion.tr
                    key={page.path}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(idx * 0.025, 0.2), ease: HYBRID_EASE }}
                    className="hover:bg-[#A5A79B]/15 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono text-xs flex items-center gap-2">
                      <FileText size={13} className="opacity-60 shrink-0" />
                      <span>{page.path}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold tabular-nums">
                      {formatNumber(page.views)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                      {formatNumber(page.uniqueVisitors)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono opacity-80 tabular-nums">
                      {formatDuration(page.avgTimeSeconds)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </HybridCard>

          {/* Mobile List */}
          <div className="md:hidden space-y-3">
            {data.pages.map((page) => (
              <HybridCard key={page.path} className="p-4 space-y-2">
                <div className="font-mono text-xs font-bold flex items-center gap-2 truncate">
                  <FileText size={13} className="shrink-0 opacity-70" />
                  <span className="truncate">{page.path}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#A5A79B]/25 dark:border-white/10 text-xs">
                  <div>
                    <span className="block text-[10px] font-mono opacity-60">Views</span>
                    <span className="font-mono font-bold tabular-nums">{formatNumber(page.views)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono opacity-60">Unique</span>
                    <span className="font-mono font-bold tabular-nums">{formatNumber(page.uniqueVisitors)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono opacity-60">Avg Time</span>
                    <span className="font-mono font-bold tabular-nums">{formatDuration(page.avgTimeSeconds)}</span>
                  </div>
                </div>
              </HybridCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
