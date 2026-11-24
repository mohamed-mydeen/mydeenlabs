import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Radio, RefreshCw, Monitor, Smartphone, Tablet, Globe } from 'lucide-react';
import { useLiveVisitors } from '../hooks/useLiveVisitors';
import { EmptyStatePanel, ErrorStatePanel, LoadingPanel } from '../components/StateBanner';
import { HybridCard, HYBRID_EASE } from '../components/MotionPrimitives';
import { formatRelativeTime, maskVisitorId } from '../utils/formatters';

function DeviceIcon({ type }: { type: 'Mobile' | 'Desktop' | 'Tablet' }) {
  if (type === 'Mobile') return <Smartphone size={14} />;
  if (type === 'Tablet') return <Tablet size={14} />;
  return <Monitor size={14} />;
}

export const LiveVisitorsPage: React.FC = () => {
  const { visitors, loading, error, refresh, activeWindowSeconds } = useLiveVisitors();
  const reduced = useReducedMotion();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest opacity-65 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Supabase Realtime Heartbeat</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-0.5 tabular-nums">
            Live Visitors ({visitors.length})
          </h2>
          <p className="text-xs opacity-70 mt-1">
            Showing active sessions with a heartbeat within the last {activeWindowSeconds} seconds.
          </p>
        </div>

        <motion.button
          whileTap={reduced ? undefined : { scale: 0.95 }}
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl hybrid-panel text-xs font-mono font-semibold hover:border-[#181818]/30 dark:hover:border-[#E8D2B5]/30 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </motion.button>
      </div>

      {loading && <LoadingPanel message="Connecting to live heartbeat stream..." />}
      {!loading && error && <ErrorStatePanel message={error} onRetry={refresh} />}

      {!loading && !error && visitors.length === 0 && (
        <EmptyStatePanel message="No active visitors on the portfolio right now." />
      )}

      {!loading && !error && visitors.length > 0 && (
        <>
          {/* Desktop Table */}
          <HybridCard className="hidden md:block overflow-hidden">
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
                {visitors.map((v, idx) => (
                  <motion.tr
                    key={v.visitor_id}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.25), ease: HYBRID_EASE }}
                    className="hover:bg-[#A5A79B]/15 dark:hover:bg-white/5 transition-colors"
                  >
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
                    <td className="py-3.5 px-5 text-right font-mono text-xs opacity-80 tabular-nums">
                      {formatRelativeTime(v.last_active_at)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </HybridCard>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {visitors.map((v) => (
              <HybridCard key={v.visitor_id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold flex items-center gap-1.5">
                    <Radio size={12} className="text-emerald-500" />
                    {maskVisitorId(v.visitor_id)}
                  </span>
                  <span className="text-[11px] font-mono opacity-75 tabular-nums">
                    {formatRelativeTime(v.last_active_at)}
                  </span>
                </div>
                <div className="text-xs font-mono hybrid-inset px-2.5 py-1.5 rounded-lg truncate">
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
              </HybridCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
