import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { HYBRID_EASE } from '../components/MotionPrimitives';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (title: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const reduced = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, variant: ToastVariant = 'info') => {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, variant }]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-20 lg:bottom-5 right-4 z-[75] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: HYBRID_EASE }}
              className="pointer-events-auto hybrid-panel rounded-xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5 text-xs font-medium"
            >
              {t.variant === 'success' && (
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              {t.variant === 'error' && (
                <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0" />
              )}
              {t.variant === 'info' && (
                <Info size={15} className="text-[#181818] dark:text-[#E8D2B5] shrink-0" />
              )}
              <span className="flex-1">{t.title}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
