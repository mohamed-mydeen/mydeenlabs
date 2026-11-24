import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { DateRangePicker } from '../components/DateRangePicker';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { formatDuration, formatNumber } from '../utils/formatters';

export const PagesPage: React.FC = () => {
  const { range, setRange, data, loading, error, refresh } = useAnalytics('7d');

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
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 hover:bg-[#A5A79B]/35 transition-colors cursor-pointer"
            aria-label="Refresh pages"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && <LoadingPanel />}
      {!loading && error && <ErrorStatePanel message={error} onRetry={refresh} />}
      {!loading && !error && data && data.pages.length === 0 && <EmptyStatePanel />}

      {!loading && !error && data && data.pages.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 overflow-hidden">
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
                {data.pages.map((page) => (
                  <tr key={page.path} className="hover:bg-[#A5A79B]/10 dark:hover:bg-white/5">
                    <td className="py-3.5 px-5 font-mono text-xs flex items-center gap-2">
                      <FileText size={13} className="opacity-60 shrink-0" />
                      <span>{page.path}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold">
                      {formatNumber(page.views)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono">
                      {formatNumber(page.uniqueVisitors)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono opacity-80">
                      {formatDuration(page.avgTimeSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden space-y-3">
            {data.pages.map((page) => (
              <div
                key={page.path}
                className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 space-y-2"
              >
                <div className="font-mono text-xs font-bold flex items-center gap-2 truncate">
                  <FileText size={13} className="shrink-0 opacity-70" />
                  <span className="truncate">{page.path}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#A5A79B]/25 dark:border-white/10 text-xs">
                  <div>
                    <span className="block text-[10px] font-mono opacity-60">Views</span>
                    <span className="font-mono font-bold">{formatNumber(page.views)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono opacity-60">Unique</span>
                    <span className="font-mono font-bold">{formatNumber(page.uniqueVisitors)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono opacity-60">Avg Time</span>
                    <span className="font-mono font-bold">{formatDuration(page.avgTimeSeconds)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
