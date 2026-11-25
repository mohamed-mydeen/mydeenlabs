import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShieldAlert, LogOut, Clock } from 'lucide-react';
import { HYBRID_EASE } from './MotionPrimitives';

interface InactivityModalProps {
  open: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onSignOut: () => void;
}

export const InactivityModal: React.FC<InactivityModalProps> = ({
  open,
  secondsRemaining,
  onStayLoggedIn,
  onSignOut,
}) => {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inactivity-title"
        >
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: HYBRID_EASE }}
            className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-[#E8D2B5] dark:bg-[#1a1a1a] border border-[#A5A79B]/50 dark:border-white/15 shadow-2xl p-6 space-y-4"
          >
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#181818]/20 dark:bg-white/20 mx-auto -mt-1 mb-2" />

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] flex items-center justify-center shrink-0">
                <ShieldAlert size={19} />
              </div>
              <div>
                <h3
                  id="inactivity-title"
                  className="text-lg font-bold font-display leading-tight"
                >
                  Session Expiring Soon
                </h3>
                <p className="text-xs opacity-75 mt-1">
                  For your security, Mydeen Analytics automatically signs out after inactivity.
                </p>
              </div>
            </div>

            <div className="hybrid-inset rounded-xl p-3.5 flex items-center justify-between text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 opacity-75">
                <Clock size={14} />
                <span>Auto-logout in</span>
              </span>
              <span className="text-base font-bold tabular-nums">
                {secondsRemaining}s
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <motion.button
                type="button"
                whileTap={reduced ? undefined : { scale: 0.98 }}
                onClick={onStayLoggedIn}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Stay Logged In
              </motion.button>
              <motion.button
                type="button"
                whileTap={reduced ? undefined : { scale: 0.98 }}
                onClick={onSignOut}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#A5A79B]/30 hover:bg-[#A5A79B]/45 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
