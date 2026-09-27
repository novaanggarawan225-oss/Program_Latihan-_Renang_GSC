import React, { useState } from 'react';
import { SwimResult, TargetWaktu } from '../../types';
import { formatSecondsToTime } from '../../utils/timeFormat';

interface SwimProgressChartProps {
  title: string;
  results: SwimResult[];
  target?: TargetWaktu;
  strokeColor?: string;
  height?: number;
}

export const SwimProgressChart: React.FC<SwimProgressChartProps> = ({
  title,
  results,
  target,
  strokeColor = '#06b6d4', // cyan-500
  height = 240,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!results || results.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center">
        <h4 className="font-semibold text-slate-300 text-sm mb-2">{title}</h4>
        <div className="py-10 text-slate-500 text-xs flex flex-col items-center gap-2">
          <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Belum ada catatan waktu untuk nomor ini
        </div>
      </div>
    );
  }

  // Sorted by date
  const sorted = [...results].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  const times = sorted.map((r) => r.waktuDetik);
  const minTime = Math.min(...times, target ? target.waktuTargetDetik : Infinity);
  const maxTime = Math.max(...times);
  const pbTime = Math.min(...times);
  const avgTime = +(times.reduce((acc, t) => acc + t, 0) / times.length).toFixed(2);
  const latestTime = times[times.length - 1];

  // SVG viewBox settings
  const width = 640;
  const paddingX = 45;
  const paddingY = 35;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Add margin to Y axis
  const yPaddingVal = (maxTime - minTime) * 0.15 || 0.5;
  const yMin = Math.max(0, minTime - yPaddingVal);
  const yMax = maxTime + yPaddingVal;
  const yRange = yMax - yMin || 1;

  // Coordinate mapper (lower time is higher on chart? Or lower is bottom? In swimming, faster is lower number, but we can plot standard time or inverted. Usually lower seconds is faster/better so we draw y inverted or standard. Standard time: Y starts at bottom with yMin, top with yMax. Let's do standard so 26s is below 28s, with clear labels)
  const getX = (index: number) => {
    if (sorted.length === 1) return paddingX + graphWidth / 2;
    return paddingX + (index / (sorted.length - 1)) * graphWidth;
  };

  const getY = (timeVal: number) => {
    // Inverted so faster (smaller time) is towards the TOP (better performance visually)
    // Or standard: smaller is lower. Let's make faster (lower seconds) higher on the graph for intuitive "climbing performance" or standard seconds.
    // Let's make lower time higher up:
    // val == yMin -> top (paddingY)
    // val == yMax -> bottom (height - paddingY)
    return paddingY + ((timeVal - yMin) / yRange) * graphHeight;
  };

  const points = sorted.map((r, i) => `${getX(i)},${getY(r.waktuDetik)}`).join(' ');

  // Average line Y
  const avgY = getY(avgTime);
  // Target line Y
  const targetY = target ? getY(target.waktuTargetDetik) : null;
  // PB line Y
  const pbY = getY(pbTime);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: strokeColor }} />
            {title}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {sorted.length} kali pengujian • Terakhir: <span className="text-cyan-400 font-semibold font-mono-num">{formatSecondsToTime(latestTime)}s</span>
          </p>
        </div>

        {/* Legend Badges */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            PB: <strong className="text-emerald-400 font-mono-num">{formatSecondsToTime(pbTime)}s</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-0.5 bg-blue-400 border-t border-dashed border-blue-400" />
            Rata-rata: <strong className="text-blue-300 font-mono-num">{formatSecondsToTime(avgTime)}s</strong>
          </span>
          {target && (
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-0.5 bg-amber-400 border-t border-dashed border-amber-400" />
              Target: <strong className="text-amber-400 font-mono-num">{target.waktuTarget}s</strong>
            </span>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[260px] overflow-visible">
          {/* Background Grid Lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + graphHeight / 2} x2={width - paddingX} y2={paddingY + graphHeight / 2} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#334155" />

          {/* Average Line */}
          <line
            x1={paddingX}
            y1={avgY}
            x2={width - paddingX}
            y2={avgY}
            stroke="#60a5fa"
            strokeDasharray="4 4"
            strokeWidth="1.5"
            opacity={0.6}
          />
          <text x={width - paddingX + 4} y={avgY + 3} fill="#93c5fd" fontSize="9" fontWeight="bold">
            Avg
          </text>

          {/* Target Line if present */}
          {targetY !== null && (
            <>
              <line
                x1={paddingX}
                y1={targetY}
                x2={width - paddingX}
                y2={targetY}
                stroke="#f59e0b"
                strokeDasharray="5 3"
                strokeWidth="1.5"
                opacity={0.8}
              />
              <text x={paddingX - 4} y={targetY + 3} textAnchor="end" fill="#f59e0b" fontSize="9" fontWeight="bold">
                Target {target?.waktuTarget}s
              </text>
            </>
          )}

          {/* PB Line */}
          <line
            x1={paddingX}
            y1={pbY}
            x2={width - paddingX}
            y2={pbY}
            stroke="#10b981"
            strokeDasharray="2 4"
            strokeWidth="1.2"
            opacity={0.5}
          />

          {/* Main Line Progress */}
          {sorted.length > 1 && (
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          )}

          {/* Gradient area underneath */}
          {sorted.length > 1 && (
            <polygon
              fill={`url(#grad-${title.replace(/\s+/g, '')})`}
              opacity="0.25"
              points={`${getX(0)},${height - paddingY} ${points} ${getX(sorted.length - 1)},${height - paddingY}`}
            />
          )}

          {/* Defs for gradient */}
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Data Points */}
          {sorted.map((r, i) => {
            const cx = getX(i);
            const cy = getY(r.waktuDetik);
            const isLatest = i === sorted.length - 1;
            const isCurrentPB = r.waktuDetik === pbTime;

            return (
              <g
                key={r.id}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Glow ring for PB or latest */}
                {(isCurrentPB || isLatest) && (
                  <circle cx={cx} cy={cy} r={isCurrentPB ? 9 : 7} fill={isCurrentPB ? '#10b981' : strokeColor} opacity="0.3" />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isCurrentPB ? 5.5 : 4}
                  fill={isCurrentPB ? '#10b981' : strokeColor}
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* Date label at bottom */}
                <text
                  x={cx}
                  y={height - paddingY + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {r.tanggal.slice(5)}
                </text>

                {/* Time label above point */}
                <text
                  x={cx}
                  y={cy - 9}
                  textAnchor="middle"
                  fill={isCurrentPB ? '#34d399' : '#e2e8f0'}
                  fontSize="10"
                  fontWeight={isCurrentPB ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {r.waktu}s
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover detail tooltip */}
        {hoveredIndex !== null && sorted[hoveredIndex] && (
          <div className="absolute top-2 right-4 bg-slate-950/95 border border-cyan-500/40 rounded-lg p-2.5 shadow-xl text-xs z-10 pointer-events-none min-w-[160px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 mb-1 border-b border-slate-800">
              <span>{sorted[hoveredIndex].tanggal}</span>
              <span className="text-cyan-400 font-semibold">{sorted[hoveredIndex].jenisTes}</span>
            </div>
            <div className="font-mono-num font-bold text-base text-white">
              {sorted[hoveredIndex].waktu} detik
              {sorted[hoveredIndex].isPB && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
                  PB
                </span>
              )}
            </div>
            {sorted[hoveredIndex].selisihSebelumnya !== undefined && sorted[hoveredIndex].selisihSebelumnya !== 0 && (
              <div className="text-[11px] text-slate-300 mt-1">
                Selisih: {sorted[hoveredIndex].selisihSebelumnya! < 0 ? (
                  <span className="text-emerald-400 font-semibold">{sorted[hoveredIndex].selisihSebelumnya}s</span>
                ) : (
                  <span className="text-amber-400 font-semibold">+{sorted[hoveredIndex].selisihSebelumnya}s</span>
                )}
              </div>
            )}
            {sorted[hoveredIndex].catatanTeknik && (
              <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">
                Teknik: {sorted[hoveredIndex].catatanTeknik}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
