import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DateRangeOption } from '../types/analytics';
import { HYBRID_EASE } from './MotionPrimitives';

interface DateRangePickerProps {
  value: DateRangeOption;
  onChange: (value: DateRangeOption) => void;
}

const OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const layoutGroupId = useId();
  const reduced = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label="Analytics date range"
      className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl hybrid-panel"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            onClick={() => onChange(opt.value)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer min-h-[32px] ${
              active
                ? 'text-[#181818]'
                : 'text-[#181818]/70 dark:text-[#f2efe9]/70 hover:text-[#181818] dark:hover:text-[#f2efe9]'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`dateRangePill-${layoutGroupId}`}
                transition={{ duration: 0.22, ease: HYBRID_EASE }}
                className="absolute inset-0 rounded-lg bg-[#A5A79B] shadow-sm -z-0"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
