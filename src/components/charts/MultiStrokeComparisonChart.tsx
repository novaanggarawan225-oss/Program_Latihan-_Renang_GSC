import React from 'react';
import { SwimResult, StrokeStyle } from '../../types';
import { formatSecondsToTime } from '../../utils/timeFormat';

interface MultiStrokeComparisonChartProps {
  athleteName: string;
  results: SwimResult[];
}

export const MultiStrokeComparisonChart: React.FC<MultiStrokeComparisonChartProps> = ({
  athleteName,
  results,
}) => {
  const strokes: StrokeStyle[] = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'];

  // Color mapping
  const strokeConfig: Record<StrokeStyle, { color: string; bg: string; badge: string; border: string }> = {
    Freestyle: { color: '#06b6d4', bg: 'bg-cyan-500/10', badge: 'text-cyan-400', border: 'border-cyan-500/30' },
    Backstroke: { color: '#3b82f6', bg: 'bg-blue-500/10', badge: 'text-blue-400', border: 'border-blue-500/30' },
    Breaststroke: { color: '#10b981', bg: 'bg-emerald-500/10', badge: 'text-emerald-400', border: 'border-emerald-500/30' },
    Butterfly: { color: '#f59e0b', bg: 'bg-amber-500/10', badge: 'text-amber-400', border: 'border-amber-500/30' },
    'Individual Medley': { color: '#8b5cf6', bg: 'bg-purple-500/10', badge: 'text-purple-400', border: 'border-purple-500/30' },
  };

  // Group by stroke for 50m distance (standard benchmark)
  const stats = strokes.map((stroke) => {
    const strokeResults = results
      .filter((r) => r.gaya === stroke && (r.jarak === '50 m' || r.jarak === '50m'))
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    if (strokeResults.length === 0) {
      return {
        stroke,
        hasData: false,
        count: 0,
        pb: 0,
        latest: 0,
        improvementSec: 0,
        improvementPct: 0,
        firstDate: '',
        latestDate: '',
        pbDate: '',
      };
    }

    const first = strokeResults[0];
    const latest = strokeResults[strokeResults.length - 1];
    const pbResult = strokeResults.reduce((min, cur) => (cur.waktuDetik < min.waktuDetik ? cur : min), strokeResults[0]);
    const diff = +(latest.waktuDetik - first.waktuDetik).toFixed(2);
    const pct = first.waktuDetik > 0 ? +((diff / first.waktuDetik) * 100).toFixed(1) : 0;

    return {
      stroke,
      hasData: true,
      count: strokeResults.length,
      pb: pbResult.waktuDetik,
      pbDate: pbResult.tanggal,
      latest: latest.waktuDetik,
      latestDate: latest.tanggal,
      first: first.waktuDetik,
      firstDate: first.tanggal,
      improvementSec: -diff, // positive means improved faster
      improvementPct: -pct,
    };
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Grafik 5: Perbandingan Semua Gaya (Benchmark 50m)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Komparasi Personal Best (PB), waktu terbaru, dan efektivitas perkembangan antar gaya renang atlet {athleteName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((item) => {
          const cfg = strokeConfig[item.stroke];
          return (
            <div
              key={item.stroke}
              className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${cfg.badge}`}>
                  50m {item.stroke}
                </span>
                <span className="text-[11px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                  {item.count} tes
                </span>
              </div>

              {item.hasData ? (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-400">Personal Best:</span>
                    <span className="font-mono-num font-bold text-xl text-white">
                      {formatSecondsToTime(item.pb)}s
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs text-slate-400 mb-2">
                    <span>Terbaru:</span>
                    <span className="font-mono-num font-semibold text-slate-200">
                      {formatSecondsToTime(item.latest)}s
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Total Progres:</span>
                    {item.improvementSec > 0 ? (
                      <span className="text-emerald-400 font-semibold font-mono-num">
                        +{item.improvementSec.toFixed(2)}s ({item.improvementPct > 0 ? `+${item.improvementPct}%` : ''})
                      </span>
                    ) : item.improvementSec < 0 ? (
                      <span className="text-amber-400 font-semibold font-mono-num">
                        {item.improvementSec.toFixed(2)}s
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono-num">Stabil</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-5 text-center text-slate-500 text-xs">
                  Belum ada data 50m {item.stroke}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visual Relative Speed Bar Chart */}
      <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
        <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Perbandingan Kecepatan PB Antar Gaya (Semakin pendek bar, semakin cepat detik waktu tempuh)
        </h5>
        <div className="space-y-3">
          {stats
            .filter((s) => s.hasData)
            .sort((a, b) => a.pb - b.pb)
            .map((s) => {
              const maxPb = Math.max(...stats.map((x) => x.pb || 1));
              const pctWidth = Math.max(25, (s.pb / (maxPb * 1.15)) * 100);
              const cfg = strokeConfig[s.stroke];

              return (
                <div key={s.stroke} className="flex items-center gap-3 text-xs">
                  <span className="w-24 text-slate-300 font-medium truncate">50m {s.stroke}</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-5 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold font-mono-num text-slate-950"
                      style={{
                        width: `${pctWidth}%`,
                        backgroundColor: cfg.color,
                      }}
                    >
                      {formatSecondsToTime(s.pb)}s
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
