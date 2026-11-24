import React from 'react';
import { DateRangeOption } from '../types/analytics';

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
  return (
    <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              active
                ? 'bg-[#A5A79B] text-[#181818] shadow-xs'
                : 'text-[#181818]/75 dark:text-[#f2efe9]/75 hover:text-[#181818] dark:hover:text-[#f2efe9]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
