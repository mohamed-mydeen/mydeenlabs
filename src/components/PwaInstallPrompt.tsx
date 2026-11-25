import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Download, Share, X } from 'lucide-react';
import { HYBRID_EASE } from './MotionPrimitives';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

/**
 * Shows an install prompt only when the browser supports installation
 * (Android/Desktop Chrome via beforeinstallprompt, or iOS Safari Add to Home Screen).
 */
export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('mydeen-pwa-prompt-dismissed') === '1';
    } catch {
      return false;
    }
  });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (isStandaloneMode()) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (isIosSafari()) {
      setShowIosGuide(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (dismissed || isStandaloneMode() || (!deferredPrompt && !showIosGuide)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('mydeen-pwa-prompt-dismissed', '1');
    } catch {
      // Ignore
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.22, ease: HYBRID_EASE }}
        className="hybrid-panel rounded-2xl p-3.5 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] flex items-center justify-center font-display font-bold text-xs shrink-0">
            /m
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">Install Mydeen App</p>
            {deferredPrompt ? (
              <p className="text-[11px] opacity-70 truncate">
                Add to your device for standalone app access.
              </p>
            ) : (
              <p className="text-[11px] opacity-70 flex items-center gap-1 flex-wrap">
                <span>Tap</span>
                <Share size={12} className="inline shrink-0" />
                <span>then &ldquo;Add to Home Screen&rdquo;.</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {deferredPrompt && (
            <motion.button
              type="button"
              whileTap={reduced ? undefined : { scale: 0.96 }}
              onClick={handleInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold cursor-pointer"
            >
              <Download size={13} />
              <span>Install</span>
            </motion.button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 opacity-60 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss install prompt"
          >
            <X size={15} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
