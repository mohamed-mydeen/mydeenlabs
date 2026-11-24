import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  isLive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  isLive = false,
}) => {
  return (
    <div className="rounded-2xl bg-[#A5A79B]/20 dark:bg-[#1a1a1a] border border-[#A5A79B]/40 dark:border-white/10 p-4 sm:p-5 transition-all hover:border-[#A5A79B]/70 dark:hover:border-[#A5A79B]/40">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#181818]/70 dark:text-[#f2efe9]/70 flex items-center gap-1.5 truncate">
          {isLive && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
          <span className="truncate">{label}</span>
        </span>
        <div className="w-8 h-8 rounded-xl bg-[#A5A79B]/25 dark:bg-white/5 border border-[#A5A79B]/40 dark:border-white/10 flex items-center justify-center shrink-0">
          <Icon size={15} className="text-[#181818] dark:text-[#E8D2B5]" />
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#181818] dark:text-[#f2efe9] leading-none">
        {value}
      </div>

      {sublabel && (
        <p className="text-[11px] font-mono text-[#181818]/65 dark:text-[#f2efe9]/60 mt-2 truncate">
          {sublabel}
        </p>
      )}
    </div>
  );
};
