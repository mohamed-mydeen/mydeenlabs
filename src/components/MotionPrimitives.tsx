import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  animate,
} from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

/** Shared iOS/Ubuntu hybrid easing curve (snappy, natural deceleration, zero bounce). */
export const HYBRID_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const PAGE_TRANSITION = {
  duration: 0.22,
  ease: HYBRID_EASE,
};

/**
 * Wraps each route's content with a subtle GPU-accelerated fade + vertical slide.
 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={PAGE_TRANSITION}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Smooth numeric counter for KPI figures (supports integers and formatted strings).
 */
export const AnimatedNumber: React.FC<{
  value: number;
  formatter?: (n: number) => string;
}> = ({ value, formatter = (n) => Math.round(n).toLocaleString() }) => {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState<number>(reduced ? value : 0);
  const prevRef = useRef<number>(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const controls = animate(prevRef.current, value, {
      duration: 0.55,
      ease: HYBRID_EASE,
      onUpdate: (latest) => setDisplay(latest),
      onComplete: () => {
        prevRef.current = value;
      },
    });

    return () => controls.stop();
  }, [value, reduced]);

  return <>{formatter(display)}</>;
};

/**
 * Smooth horizontal progress bar with GPU transform/width animation.
 */
export const AnimatedProgressBar: React.FC<{
  percentage: number;
  variant?: 'primary' | 'sage';
  className?: string;
}> = ({ percentage, variant = 'primary', className = 'h-1.5' }) => {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div
      className={`${className} rounded-full bg-[#A5A79B]/25 dark:bg-white/10 overflow-hidden`}
    >
      <motion.div
        initial={{ scaleX: reduced ? clamped / 100 : 0 }}
        animate={{ scaleX: clamped / 100 }}
        transition={{ duration: 0.45, ease: HYBRID_EASE }}
        style={{ transformOrigin: 'left center' }}
        className={`h-full w-full rounded-full ${
          variant === 'primary'
            ? 'bg-[#181818] dark:bg-[#E8D2B5]'
            : 'bg-[#A5A79B]'
        }`}
      />
    </div>
  );
};

/**
 * Hybrid Glassmorphic Surface Card with subtle hover lift and clean borders.
 */
export const HybridCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}> = ({ children, className = '', interactive = false, onClick }) => {
  const reduced = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      whileHover={interactive && !reduced ? { y: -2 } : undefined}
      whileTap={interactive && !reduced ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.18, ease: HYBRID_EASE }}
      className={`hybrid-panel rounded-2xl transition-colors duration-200 ${
        interactive ? 'cursor-pointer hover:border-[#181818]/25 dark:hover:border-[#E8D2B5]/30' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/**
 * iOS-inspired smooth animated dropdown replacing native <select> elements.
 */
export function HybridSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (val: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`w-full min-h-[38px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#fdfcf9]/90 dark:bg-[#141414]/90 border text-xs font-mono transition-all cursor-pointer ${
          open
            ? 'border-[#181818] dark:border-[#E8D2B5] ring-2 ring-[#A5A79B]/25'
            : 'border-[#A5A79B]/45 dark:border-white/15 hover:border-[#181818]/40 dark:hover:border-white/30'
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          size={14}
          className={`opacity-65 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: HYBRID_EASE }}
            className="absolute right-0 left-0 sm:left-auto sm:min-w-[190px] mt-1.5 p-1.5 rounded-2xl bg-[#fdfcf9]/95 dark:bg-[#1c1c1c]/95 backdrop-blur-xl border border-[#A5A79B]/45 dark:border-white/15 shadow-[0_14px_34px_rgba(24,24,24,0.16)] dark:shadow-[0_14px_34px_rgba(0,0,0,0.5)] z-50 space-y-0.5"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#A5A79B]/35 dark:bg-[#E8D2B5]/15 font-semibold text-[#181818] dark:text-[#E8D2B5]'
                      : 'text-[#181818]/85 dark:text-[#f2efe9]/85 hover:bg-[#A5A79B]/20 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check
                      size={13}
                      className="text-[#181818] dark:text-[#E8D2B5] shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
