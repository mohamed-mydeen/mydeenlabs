import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { HYBRID_EASE } from './MotionPrimitives';

export const LoadingPanel: React.FC<{ message?: string }> = ({
  message = 'Loading real-time analytics...',
}) => (
  <div className="space-y-4">
    {/* Skeleton KPI Row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {[0, 1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="hybrid-panel rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-md skeleton-shimmer" />
            <div className="w-8 h-8 rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-7 w-20 rounded-lg skeleton-shimmer" />
        </div>
      ))}
    </div>

    {/* Skeleton Main Surface */}
    <div className="hybrid-panel rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
      <div className="w-full max-w-md space-y-3 mb-4">
        <div className="h-3 w-3/4 mx-auto rounded-md skeleton-shimmer" />
        <div className="h-3 w-1/2 mx-auto rounded-md skeleton-shimmer" />
      </div>
      <p className="text-[11px] font-mono uppercase tracking-wider text-[#181818]/65 dark:text-[#f2efe9]/65">
        {message}
      </p>
    </div>
  </div>
);

export const EmptyStatePanel: React.FC<{ message?: string }> = ({
  message = 'No analytics data available yet.',
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: HYBRID_EASE }}
      className="hybrid-panel rounded-2xl p-10 flex flex-col items-center justify-center text-center"
    >
      <div className="w-11 h-11 rounded-2xl bg-[#A5A79B]/25 dark:bg-white/5 border border-[#A5A79B]/40 dark:border-white/10 flex items-center justify-center mb-3">
        <Inbox size={20} className="text-[#181818] dark:text-[#E8D2B5]" />
      </div>
      <p className="text-sm font-semibold text-[#181818] dark:text-[#f2efe9]">
        {message}
      </p>
      <p className="text-xs text-[#181818]/65 dark:text-[#f2efe9]/60 mt-1 max-w-sm">
        Real visitor events will appear here automatically once traffic arrives on mydeen.vercel.app.
      </p>
    </motion.div>
  );
};

export const ErrorStatePanel: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = 'Unable to load analytics data. Please try again.',
  onRetry,
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: HYBRID_EASE }}
      className="hybrid-panel rounded-2xl border-red-500/35 p-8 flex flex-col items-center justify-center text-center"
    >
      <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-3">
        <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
      </div>
      <p className="text-sm font-semibold text-[#181818] dark:text-[#f2efe9]">
        {message}
      </p>
      {onRetry && (
        <motion.button
          whileTap={reduced ? undefined : { scale: 0.96 }}
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A5A79B] hover:bg-[#96988c] text-[#181818] text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
        >
          <RefreshCw size={13} />
          <span>Try Again</span>
        </motion.button>
      )}
    </motion.div>
  );
};
