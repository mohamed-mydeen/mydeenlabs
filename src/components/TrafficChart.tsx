import React, { useState } from 'react';
import { TrafficPoint } from '../types/analytics';
import { formatNumber } from '../utils/formatters';

interface TrafficChartProps {
  series: TrafficPoint[];
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ series }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!series || series.length === 0) {
    return (
      <div className="h-56 sm:h-64 flex items-center justify-center rounded-xl border border-dashed border-[#A5A79B]/40 dark:border-white/10 text-xs font-mono text-[#181818]/65 dark:text-[#f2efe9]/60">
        No analytics data available yet.
      </div>
    );
  }

  const maxVal = Math.max(
    1,
    ...series.map((p) => Math.max(p.pageViews, p.visitors))
  );

  const width = 700;
  const height = 220;
  const padX = 24;
  const padY = 20;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const points = series.map((item, idx) => {
    const x =
      series.length === 1
        ? width / 2
        : padX + (idx / (series.length - 1)) * usableW;
    const yViews = padY + usableH - (item.pageViews / maxVal) * usableH;
    const yVisitors = padY + usableH - (item.visitors / maxVal) * usableH;
    return { x, yViews, yVisitors, item };
  });

  const viewsPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yViews.toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${viewsPath} L ${points[points.length - 1].x.toFixed(1)} ${(height - padY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`
      : '';

  const visitorsPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yVisitors.toFixed(1)}`)
    .join(' ');

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-[#181818]/80 dark:text-[#f2efe9]/80">
            <span className="w-2.5 h-2.5 rounded-full bg-[#181818] dark:bg-[#E8D2B5]" />
            <span>Page Views</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#181818]/80 dark:text-[#f2efe9]/80">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A5A79B]" />
            <span>Visitors</span>
          </span>
        </div>

        {activePoint && (
          <div className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#A5A79B]/25 dark:bg-white/10 text-[#181818] dark:text-[#E8D2B5]">
            {activePoint.item.date}: {formatNumber(activePoint.item.visitors)} visitors &bull;{' '}
            {formatNumber(activePoint.item.pageViews)} views
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-60 select-none"
          preserveAspectRatio="none"
        >
          {/* Horizontal guide lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padY + usableH * ratio;
            return (
              <line
                key={idx}
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area fill */}
          {areaPath && (
            <path d={areaPath} fill="#A5A79B" fillOpacity={0.22} />
          )}

          {/* Page views line */}
          {viewsPath && (
            <path
              d={viewsPath}
              fill="none"
              className="stroke-[#181818] dark:stroke-[#E8D2B5]"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Visitors line */}
          {visitorsPath && (
            <path
              d={visitorsPath}
              fill="none"
              stroke="#A5A79B"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive hover targets */}
          {points.map((p, idx) => (
            <g
              key={p.item.date}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(idx)}
              className="cursor-pointer"
            >
              <rect
                x={p.x - 14}
                y={0}
                width={28}
                height={height}
                fill="transparent"
              />
              <circle
                cx={p.x}
                cy={p.yViews}
                r={hoveredIdx === idx ? 5 : 3}
                className="fill-[#181818] dark:fill-[#E8D2B5]"
              />
              <circle
                cx={p.x}
                cy={p.yVisitors}
                r={hoveredIdx === idx ? 5 : 3}
                fill="#A5A79B"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Date axis labels */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#181818]/60 dark:text-[#f2efe9]/60 px-2 mt-1">
        <span>{series[0]?.date}</span>
        {series.length > 2 && (
          <span className="hidden sm:inline">
            {series[Math.floor(series.length / 2)]?.date}
          </span>
        )}
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
};
