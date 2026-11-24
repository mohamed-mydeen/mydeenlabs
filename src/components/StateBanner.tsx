import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export const LoadingPanel: React.FC<{ message?: string }> = ({
  message = 'Loading real-time analytics...',
}) => (
  <div className="rounded-2xl bg-[#A5A79B]/15 dark:bg-[#1a1a1a] border border-[#A5A79B]/35 dark:border-white/10 p-10 flex flex-col items-center justify-center text-center">
    <div className="w-9 h-9 rounded-full border-2 border-[#A5A79B] border-t-[#181818] dark:border-t-[#E8D2B5] animate-spin mb-3" />
    <p className="text-xs font-mono uppercase tracking-wider text-[#181818]/75 dark:text-[#f2efe9]/75">
      {message}
    </p>
  </div>
);

export const EmptyStatePanel: React.FC<{ message?: string }> = ({
  message = 'No analytics data available yet.',
}) => (
  <div className="rounded-2xl bg-[#A5A79B]/15 dark:bg-[#1a1a1a] border border-[#A5A79B]/35 dark:border-white/10 p-10 flex flex-col items-center justify-center text-center">
    <div className="w-11 h-11 rounded-2xl bg-[#A5A79B]/25 dark:bg-white/5 border border-[#A5A79B]/40 dark:border-white/10 flex items-center justify-center mb-3">
      <Inbox size={20} className="text-[#181818] dark:text-[#E8D2B5]" />
    </div>
    <p className="text-sm font-semibold text-[#181818] dark:text-[#f2efe9]">
      {message}
    </p>
    <p className="text-xs text-[#181818]/65 dark:text-[#f2efe9]/60 mt-1 max-w-sm">
      Real visitor events will appear here automatically once traffic arrives on mydeen.vercel.app.
    </p>
  </div>
);

export const ErrorStatePanel: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = 'Unable to load analytics data. Please try again.',
  onRetry,
}) => (
  <div className="rounded-2xl bg-[#A5A79B]/15 dark:bg-[#1a1a1a] border border-red-500/30 p-8 flex flex-col items-center justify-center text-center">
    <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-3">
      <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
    </div>
    <p className="text-sm font-semibold text-[#181818] dark:text-[#f2efe9]">
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A5A79B] hover:bg-[#96988c] text-[#181818] text-xs font-semibold transition-colors cursor-pointer"
      >
        <RefreshCw size={13} />
        <span>Try Again</span>
      </button>
    )}
  </div>
);
