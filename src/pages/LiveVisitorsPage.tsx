import React from 'react';
import { Radio, RefreshCw, Monitor, Smartphone, Tablet, Globe } from 'lucide-react';
import { useLiveVisitors } from '../hooks/useLiveVisitors';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { formatRelativeTime, maskVisitorId } from '../utils/formatters';

function DeviceIcon({ type }: { type: 'Mobile' | 'Desktop' | 'Tablet' }) {
  if (type === 'Mobile') return <Smartphone size={14} />;
  if (type === 'Tablet') return <Tablet size={14} />;
  return <Monitor size={14} />;
}

export const LiveVisitorsPage: React.FC = () => {
  const { visitors, loading, error, refresh, activeWindowSeconds } = useLiveVisitors();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest opacity-65 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Realtime Heartbeat</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-0.5">
            Live Visitors ({visitors.length})
          </h2>
          <p className="text-xs opacity-70 mt-1">
            Showing active sessions with a heartbeat within the last {activeWindowSeconds} seconds.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 text-xs font-mono font-semibold hover:bg-[#A5A79B]/35 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && <LoadingPanel message="Connecting to live heartbeat stream..." />}
      {!loading && error && <ErrorStatePanel message={error} onRetry={refresh} />}

      {!loading && !error && visitors.length === 0 && (
        <EmptyStatePanel message="No active visitors on the portfolio right now." />
      )}

      {!loading && !error && visitors.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#A5A79B]/30 dark:border-white/10 text-[11px] font-mono uppercase opacity-70">
                  <th className="py-3.5 px-5">Visitor ID</th>
                  <th className="py-3.5 px-5">Current Page</th>
                  <th className="py-3.5 px-5">Device</th>
                  <th className="py-3.5 px-5">Country</th>
                  <th className="py-3.5 px-5 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A5A79B]/20 dark:divide-white/5 text-sm">
                {visitors.map((v) => (
                  <tr key={v.visitor_id} className="hover:bg-[#A5A79B]/10 dark:hover:bg-white/5">
                    <td className="py-3.5 px-5 font-mono text-xs flex items-center gap-2">
                      <Radio size={12} className="text-emerald-500 shrink-0" />
                      <span>{maskVisitorId(v.visitor_id)}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs">{v.current_page}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <DeviceIcon type={v.device_type} />
                        <span>{v.device_type}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Globe size={13} className="opacity-60" />
                        <span>{v.country}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs opacity-80">
                      {formatRelativeTime(v.last_active_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {visitors.map((v) => (
              <div
                key={v.visitor_id}
                className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold flex items-center gap-1.5">
                    <Radio size={12} className="text-emerald-500" />
                    {maskVisitorId(v.visitor_id)}
                  </span>
                  <span className="text-[11px] font-mono opacity-75">
                    {formatRelativeTime(v.last_active_at)}
                  </span>
                </div>
                <div className="text-xs font-mono bg-[#fdfcf9]/70 dark:bg-[#141414] px-2.5 py-1.5 rounded-lg border border-[#A5A79B]/25 dark:border-white/10 truncate">
                  {v.current_page}
                </div>
                <div className="flex items-center justify-between text-xs opacity-80 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <DeviceIcon type={v.device_type} />
                    {v.device_type}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe size={13} />
                    {v.country}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
