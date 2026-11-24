import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AnimatedNumber, HYBRID_EASE } from './MotionPrimitives';

interface StatCardProps {
  label: string;
  value: string;
  numericValue?: number;
  formatter?: (n: number) => string;
  sublabel?: string;
  icon: LucideIcon;
  isLive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  numericValue,
  formatter,
  sublabel,
  icon: Icon,
  isLive = false,
}) => {
  const reduced = useReducedMotion();

  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ duration: 0.18, ease: HYBRID_EASE }}
      className="hybrid-panel rounded-2xl p-4 sm:p-5 transition-colors duration-200 hover:border-[#181818]/25 dark:hover:border-[#E8D2B5]/30"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#181818]/70 dark:text-[#f2efe9]/70 flex items-center gap-1.5 truncate">
          {isLive && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          <span className="truncate">{label}</span>
        </span>
        <div className="w-8 h-8 rounded-xl bg-[#A5A79B]/25 dark:bg-white/5 border border-[#A5A79B]/40 dark:border-white/10 flex items-center justify-center shrink-0">
          <Icon size={15} className="text-[#181818] dark:text-[#E8D2B5]" />
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#181818] dark:text-[#f2efe9] leading-none tabular-nums">
        {typeof numericValue === 'number' ? (
          <AnimatedNumber value={numericValue} formatter={formatter} />
        ) : (
          value
        )}
      </div>

      {sublabel && (
        <p className="text-[11px] font-mono text-[#181818]/65 dark:text-[#f2efe9]/60 mt-2 truncate">
          {sublabel}
        </p>
      )}
    </motion.div>
  );
};
