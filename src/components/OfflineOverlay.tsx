import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { HYBRID_EASE } from './MotionPrimitives';

interface OfflineOverlayProps {
  onReconnect?: () => void;
}

/**
 * Prevents displaying cached private dashboard data when offline.
 * Re-verifies authentication session once connectivity is restored.
 */
export const OfflineOverlay: React.FC<OfflineOverlayProps> = ({ onReconnect }) => {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const reduced = useReducedMotion();

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      onReconnect?.();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [onReconnect]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] bg-[#E8D2B5]/95 dark:bg-[#141414]/95 backdrop-blur-xl flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="offline-title"
        >
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: HYBRID_EASE }}
            className="w-full max-w-md hybrid-panel rounded-2xl p-7 text-center space-y-4 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] flex items-center justify-center mx-auto">
              <WifiOff size={22} />
            </div>

            <div className="space-y-1.5">
              <h2 id="offline-title" className="text-xl font-bold font-display">
                You&apos;re Offline
              </h2>
              <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
                An active internet connection is required to access live analytics and private dashboard data. Private records are never stored for offline viewing.
              </p>
            </div>

            <motion.button
              type="button"
              whileTap={reduced ? undefined : { scale: 0.97 }}
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Check Connection</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
