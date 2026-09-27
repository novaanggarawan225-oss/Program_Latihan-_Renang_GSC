import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { StrokeStyle, Athlete, SwimResult } from '../../types';
import { formatSecondsToTime } from '../../utils/timeFormat';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Users,
  ArrowRightLeft,
  Trophy,
  Target,
  Zap,
  Activity,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface EventComparisonItem {
  event: string;
  stroke: StrokeStyle;
  distance: string;
  athleteATime: number | null;
  athleteBTime: number | null;
  athleteAFormatted: string;
  athleteBFormatted: string;
  diff: number | null;
  fasterAthlete: 'A' | 'B' | 'Equal' | 'None';
  gapPercentage: number | null;
}

const COMMON_EVENTS: { stroke: StrokeStyle; distance: string; label: string }[] = [
  { stroke: 'Freestyle', distance: '50 m', label: '50m Freestyle' },
  { stroke: 'Breaststroke', distance: '50 m', label: '50m Breaststroke' },
  { stroke: 'Butterfly', distance: '50 m', label: '50m Butterfly' },
  { stroke: 'Backstroke', distance: '50 m', label: '50m Backstroke' },
  { stroke: 'Freestyle', distance: '100 m', label: '100m Freestyle' },
  { stroke: 'Breaststroke', distance: '100 m', label: '100m Breaststroke' },
];

export const CompareAthletesSection: React.FC = () => {
  const { data, selectedAthleteId, getAthleteResults, getAthletePB, getAthleteTrainingLogs } = useData();
  const athletes = data.athletes;

  // Athlete A defaults to current selected athlete, Athlete B to second athlete or first different
  const [athleteAId, setAthleteAId] = useState<string>(selectedAthleteId || athletes[0]?.id || '');
  const [athleteBId, setAthleteBId] = useState<string>(() => {
    const other = athletes.find((a) => a.id !== (selectedAthleteId || athletes[0]?.id));
    return other ? other.id : athletes[1]?.id || athletes[0]?.id || '';
  });

  // Selected event for timeline progression
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);

  const athleteA = useMemo(() => athletes.find((a) => a.id === athleteAId), [athletes, athleteAId]);
  const athleteB = useMemo(() => athletes.find((a) => a.id === athleteBId), [athletes, athleteBId]);

  // Swap athletes
  const handleSwapAthletes = () => {
    const temp = athleteAId;
    setAthleteAId(athleteBId);
    setAthleteBId(temp);
  };

  // Compare PB across common events
  const pbComparisonData = useMemo(() => {
    if (!athleteA || !athleteB) return [];

    return COMMON_EVENTS.map(({ stroke, distance, label }) => {
      const pbA = getAthletePB(athleteA.id, stroke, distance);
      const pbB = getAthletePB(athleteB.id, stroke, distance);

      const timeA = pbA ? pbA.waktuDetik : null;
      const timeB = pbB ? pbB.waktuDetik : null;

      let diff: number | null = null;
      let fasterAthlete: 'A' | 'B' | 'Equal' | 'None' = 'None';
      let gapPercentage: number | null = null;

      if (timeA !== null && timeB !== null) {
        diff = +(timeA - timeB).toFixed(2);
        if (Math.abs(diff) < 0.01) {
          fasterAthlete = 'Equal';
          gapPercentage = 0;
        } else if (diff < 0) {
          fasterAthlete = 'A';
          gapPercentage = +((Math.abs(diff) / timeB) * 100).toFixed(1);
        } else {
          fasterAthlete = 'B';
          gapPercentage = +((Math.abs(diff) / timeA) * 100).toFixed(1);
        }
      }

      return {
        event: label,
        stroke,
        distance,
        athleteATime: timeA,
        athleteBTime: timeB,
        athleteAFormatted: pbA ? pbA.waktu : '-',
        athleteBFormatted: pbB ? pbB.waktu : '-',
        diff,
        fasterAthlete,
        gapPercentage,
      } as EventComparisonItem;
    }).filter((item) => item.athleteATime !== null || item.athleteBTime !== null);
  }, [athleteA, athleteB, getAthletePB]);

  // Selected event for timeline
  const activeEvent = COMMON_EVENTS[selectedEventIndex] || COMMON_EVENTS[0];

  // Timeline progression comparison for active event
  const timelineComparisonData = useMemo(() => {
    if (!athleteA || !athleteB) return [];

    const resultsA = getAthleteResults(athleteA.id, activeEvent.stroke, activeEvent.distance);
    const resultsB = getAthleteResults(athleteB.id, activeEvent.stroke, activeEvent.distance);

    const maxTrials = Math.max(resultsA.length, resultsB.length);
    const timelinePoints: {
      trialLabel: string;
      dateA?: string;
      dateB?: string;
      timeA?: number;
      timeB?: number;
      timeAFormatted?: string;
      timeBFormatted?: string;
      isPBA?: boolean;
      isPBB?: boolean;
    }[] = [];

    for (let i = 0; i < maxTrials; i++) {
      const resA = resultsA[i];
      const resB = resultsB[i];

      timelinePoints.push({
        trialLabel: `Sesi ${i + 1}`,
        dateA: resA ? resA.tanggal : undefined,
        dateB: resB ? resB.tanggal : undefined,
        timeA: resA ? resA.waktuDetik : undefined,
        timeB: resB ? resB.waktuDetik : undefined,
        timeAFormatted: resA ? resA.waktu : undefined,
        timeBFormatted: resB ? resB.waktu : undefined,
        isPBA: resA?.isPB,
        isPBB: resB?.isPB,
      });
    }

    return timelinePoints;
  }, [athleteA, athleteB, activeEvent, getAthleteResults]);

  // Calculate training volumes & stats comparison
  const statsComparison = useMemo(() => {
    if (!athleteA || !athleteB) return null;

    const logsA = getAthleteTrainingLogs(athleteA.id);
    const logsB = getAthleteTrainingLogs(athleteB.id);

    const swimLogsA = logsA.filter((l) => l.jenisLatihan === 'Renang');
    const swimLogsB = logsB.filter((l) => l.jenisLatihan === 'Renang');

    const totalVolumeA = swimLogsA.reduce((sum, l) => sum + (l.volumeMeter || 0), 0);
    const totalVolumeB = swimLogsB.reduce((sum, l) => sum + (l.volumeMeter || 0), 0);

    const resultsA = getAthleteResults(athleteA.id);
    const resultsB = getAthleteResults(athleteB.id);

    const pbCountA = resultsA.filter((r) => r.isPB).length;
    const pbCountB = resultsB.filter((r) => r.isPB).length;

    return {
      totalTrialsA: resultsA.length,
      totalTrialsB: resultsB.length,
      totalVolumeA,
      totalVolumeB,
      totalSessionsA: logsA.length,
      totalSessionsB: logsB.length,
      pbCountA,
      pbCountB,
    };
  }, [athleteA, athleteB, getAthleteTrainingLogs, getAthleteResults]);

  if (!athleteA || !athleteB) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
        Data atlet belum lengkap untuk komparasi.
      </div>
    );
  }

  const isSameAthlete = athleteA.id === athleteB.id;

  return (
    <div className="space-y-6">
      {/* Top Header Card & Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-white text-base">
                  Komparasi Atlet: Analisis Personal Best & Tren Progresi
                </h3>
                <p className="text-xs text-slate-400">
                  Visualisasi komparasi waktu renang berdampingan (side-by-side) untuk mengidentifikasi celah performa (*performance gaps*)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Swap Button */}
          <button
            onClick={handleSwapAthletes}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer self-start md:self-auto"
            title="Tukar Posisi Atlet A dan Atlet B"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tukar Posisi</span>
          </button>
        </div>

        {/* Dual Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Athlete A Card & Select */}
          <div className="bg-slate-950 p-4 rounded-xl border-2 border-cyan-500/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Atlet A (Cyan)
              </span>
              <span className="text-[11px] text-slate-400">{athleteA.kelompokUsia}</span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
                  athleteA.avatarColor || 'from-cyan-500 to-blue-600'
                } flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}
              >
                {athleteA.namaPanggilan.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Pilih Atlet Pertama
                </label>
                <select
                  value={athleteAId}
                  onChange={(e) => setAthleteAId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-500"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.namaLengkap} ({a.namaPanggilan}) - {a.nomorUtama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick stats mini row */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-900 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Gaya Utama</span>
                <span className="font-semibold text-slate-200 truncate block">{athleteA.gayaUtama}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TB / BB</span>
                <span className="font-semibold text-slate-200">
                  {athleteA.tinggiBadan ? `${athleteA.tinggiBadan}cm` : '-'} / {athleteA.beratBadan ? `${athleteA.beratBadan}kg` : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Klub</span>
                <span className="font-semibold text-slate-200 truncate block">{athleteA.klub}</span>
              </div>
            </div>
          </div>

          {/* Athlete B Card & Select */}
          <div className="bg-slate-950 p-4 rounded-xl border-2 border-emerald-500/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Atlet B (Emerald)
              </span>
              <span className="text-[11px] text-slate-400">{athleteB.kelompokUsia}</span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
                  athleteB.avatarColor || 'from-emerald-500 to-teal-600'
                } flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}
              >
                {athleteB.namaPanggilan.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Pilih Atlet Kedua
                </label>
                <select
                  value={athleteBId}
                  onChange={(e) => setAthleteBId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.namaLengkap} ({a.namaPanggilan}) - {a.nomorUtama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick stats mini row */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-900 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Gaya Utama</span>
                <span className="font-semibold text-slate-200 truncate block">{athleteB.gayaUtama}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TB / BB</span>
                <span className="font-semibold text-slate-200">
                  {athleteB.tinggiBadan ? `${athleteB.tinggiBadan}cm` : '-'} / {athleteB.beratBadan ? `${athleteB.beratBadan}kg` : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Klub</span>
                <span className="font-semibold text-slate-200 truncate block">{athleteB.klub}</span>
              </div>
            </div>
          </div>
        </div>

        {isSameAthlete && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              Anda memilih atlet yang sama untuk Atlet A dan Atlet B. Pilih atlet yang berbeda pada Atlet B untuk melihat komparasi celah performa.
            </span>
          </div>
        )}
      </div>

      {/* CHART 1: SIDE-BY-SIDE PERSONAL BEST (PB) COMPARISON (RECHARTS BAR CHART) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-6">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Perbandingan Personal Best (PB) Antar Nomor Renang
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Waktu terbaik dalam detik (detik lebih rendah = lebih cepat). Membantu pelatih memetakan kekuatan nomor masing-masing atlet.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" />
              <span className="text-slate-300 font-semibold">{athleteA.namaPanggilan}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-300 font-semibold">{athleteB.namaPanggilan}</span>
            </div>
          </div>
        </div>

        {pbComparisonData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pbComparisonData}
                margin={{ top: 15, right: 25, left: -5, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="event"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  unit="s"
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as EventComparisonItem;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                          <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
                          <div className="flex items-center justify-between gap-4 text-cyan-400">
                            <span>{athleteA.namaPanggilan} (PB):</span>
                            <span className="font-mono-num font-bold">
                              {item.athleteATime ? `${item.athleteATime.toFixed(2)}s` : 'Belum ada data'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-emerald-400">
                            <span>{athleteB.namaPanggilan} (PB):</span>
                            <span className="font-mono-num font-bold">
                              {item.athleteBTime ? `${item.athleteBTime.toFixed(2)}s` : 'Belum ada data'}
                            </span>
                          </div>
                          {item.diff !== null && (
                            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-4 text-slate-300">
                              <span>Selisih (Gap):</span>
                              <span
                                className={`font-mono-num font-bold ${
                                  item.fasterAthlete === 'A'
                                    ? 'text-cyan-400'
                                    : item.fasterAthlete === 'B'
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {item.fasterAthlete === 'Equal'
                                  ? 'Waktu Sama'
                                  : `${Math.abs(item.diff).toFixed(2)}s (${
                                      item.fasterAthlete === 'A' ? athleteA.namaPanggilan : athleteB.namaPanggilan
                                    } lebih cepat ${item.gapPercentage}%)`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value) => {
                    if (value === 'athleteATime') return `${athleteA.namaPanggilan} (PB)`;
                    if (value === 'athleteBTime') return `${athleteB.namaPanggilan} (PB)`;
                    return value;
                  }}
                />
                <Bar
                  dataKey="athleteATime"
                  name="athleteATime"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey="athleteBTime"
                  name="athleteBTime"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            Belum ada catatan waktu renang yang tercatat untuk kedua atlet ini.
          </div>
        )}
      </div>

      {/* CHART 2: TIME PROGRESSION & TREND OVER TIME (RECHARTS LINE CHART) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Progresi Catatan Waktu Sesi ke Sesi (Progression Line)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Grafik garis perkembangan waktu tiap uji coba (time trial) untuk membandingkan laju adaptasi dan konsistensi
            </p>
          </div>

          {/* Event filter pill selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {COMMON_EVENTS.slice(0, 4).map((evt, idx) => (
              <button
                key={evt.label}
                onClick={() => setSelectedEventIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedEventIndex === idx
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {evt.label}
              </button>
            ))}
          </div>
        </div>

        {timelineComparisonData.length > 0 ? (
          <div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timelineComparisonData}
                  margin={{ top: 15, right: 25, left: -5, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="trialLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    unit="s"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const dataPt = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                            <p className="font-bold text-white border-b border-slate-800 pb-1">
                              {label} — {activeEvent.label}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4 text-cyan-400">
                                <span className="flex items-center gap-1">
                                  {athleteA.namaPanggilan}:
                                  {dataPt.isPBA && (
                                    <span className="px-1 py-0.2 text-[9px] bg-cyan-500/20 rounded font-black text-cyan-300">
                                      PB
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono-num font-bold">
                                  {dataPt.timeA ? `${dataPt.timeA.toFixed(2)}s` : 'Tidak ikut tes'}
                                </span>
                              </div>
                              {dataPt.dateA && (
                                <p className="text-[10px] text-slate-500 pl-2">Tanggal: {dataPt.dateA}</p>
                              )}

                              <div className="flex items-center justify-between gap-4 text-emerald-400 pt-1 border-t border-slate-900">
                                <span className="flex items-center gap-1">
                                  {athleteB.namaPanggilan}:
                                  {dataPt.isPBB && (
                                    <span className="px-1 py-0.2 text-[9px] bg-emerald-500/20 rounded font-black text-emerald-300">
                                      PB
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono-num font-bold">
                                  {dataPt.timeB ? `${dataPt.timeB.toFixed(2)}s` : 'Tidak ikut tes'}
                                </span>
                              </div>
                              {dataPt.dateB && (
                                <p className="text-[10px] text-slate-500 pl-2">Tanggal: {dataPt.dateB}</p>
                              )}
                            </div>

                            {dataPt.timeA && dataPt.timeB && (
                              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                                <span>Selisih:</span>
                                <span className="font-mono-num font-bold text-amber-300">
                                  {Math.abs(dataPt.timeA - dataPt.timeB).toFixed(2)}s
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      if (value === 'timeA') return `${athleteA.namaPanggilan} (${activeEvent.label})`;
                      if (value === 'timeB') return `${athleteB.namaPanggilan} (${activeEvent.label})`;
                      return value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="timeA"
                    name="timeA"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ fill: '#06b6d4', r: 4 }}
                    activeDot={{ r: 6, fill: '#38bdf8' }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="timeB"
                    name="timeB"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6, fill: '#34d399' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              * Kurva menunjukkan tren waktu dari sesi ke sesi (garis menurun mengindikasikan atlet mencatatkan waktu yang semakin cepat).
            </p>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            Belum ada riwayat hasil renang untuk nomor {activeEvent.label} pada kedua atlet.
          </div>
        )}
      </div>

      {/* PERFORMANCE GAPS TABLE & HEAD-TO-HEAD MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Head to Head Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                Matriks Komparasi Waktu & Celah Performa (Gaps)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Kalkulasi selisih waktu mutlak dan persentase keunggulan per nomor lomba
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Nomor Lomba</th>
                  <th className="pb-3 font-semibold text-cyan-400">{athleteA.namaPanggilan} (PB)</th>
                  <th className="pb-3 font-semibold text-emerald-400">{athleteB.namaPanggilan} (PB)</th>
                  <th className="pb-3 font-semibold text-right">Selisih (Gap)</th>
                  <th className="pb-3 font-semibold text-center">Keunggulan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pbComparisonData.map((item) => (
                  <tr key={item.event} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-medium text-slate-200">{item.event}</td>
                    <td className="py-3 font-mono-num font-bold text-cyan-400">
                      {item.athleteAFormatted !== '-' ? `${item.athleteAFormatted}s` : '-'}
                    </td>
                    <td className="py-3 font-mono-num font-bold text-emerald-400">
                      {item.athleteBFormatted !== '-' ? `${item.athleteBFormatted}s` : '-'}
                    </td>
                    <td className="py-3 font-mono-num font-bold text-right">
                      {item.diff !== null ? (
                        <span
                          className={
                            item.fasterAthlete === 'A'
                              ? 'text-cyan-400'
                              : item.fasterAthlete === 'B'
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }
                        >
                          {Math.abs(item.diff).toFixed(2)}s
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            ({item.gapPercentage}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {item.fasterAthlete === 'A' ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                          {athleteA.namaPanggilan} +
                        </span>
                      ) : item.fasterAthlete === 'B' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          {athleteB.namaPanggilan} +
                        </span>
                      ) : item.fasterAthlete === 'Equal' ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                          Imbang
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Perlu Data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Coach Performance Gap Insights */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-white text-base">Identifikasi Celah Pelatih</h4>
            </div>

            <div className="space-y-4 text-xs">
              {/* Insight 1: Gaya Utama */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Karakteristik & Profil Gaya
                </span>
                <p className="text-slate-300 leading-relaxed">
                  <strong className="text-cyan-400">{athleteA.namaPanggilan}</strong> berfokus pada{' '}
                  <span className="text-white font-semibold">{athleteA.nomorUtama}</span>, sedangkan{' '}
                  <strong className="text-emerald-400">{athleteB.namaPanggilan}</strong> mengutamakan{' '}
                  <span className="text-white font-semibold">{athleteB.nomorUtama}</span>.
                </p>
              </div>

              {/* Insight 2: Volume Latihan */}
              {statsComparison && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Komparasi Volume Latihan
                  </span>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Total Sesi Log:</span>
                    <span className="font-semibold">
                      <span className="text-cyan-400">{statsComparison.totalSessionsA} sesi</span> vs{' '}
                      <span className="text-emerald-400">{statsComparison.totalSessionsB} sesi</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Volume Meter:</span>
                    <span className="font-semibold">
                      <span className="text-cyan-400">{statsComparison.totalVolumeA.toLocaleString()}m</span> vs{' '}
                      <span className="text-emerald-400">{statsComparison.totalVolumeB.toLocaleString()}m</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Total Rekor PB:</span>
                    <span className="font-semibold">
                      <span className="text-cyan-400">{statsComparison.pbCountA} PB</span> vs{' '}
                      <span className="text-emerald-400">{statsComparison.pbCountB} PB</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Insight 3: Rekomendasi Taktis Pelatih */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Rekomendasi Penutupan Celah
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      Gunakan keunggulan teknik atlet yang lebih cepat sebagai model pembelajaran video visual untuk rekan setim.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>
                      Jaga motivasi positif: fokuskan evaluasi pada perkembangan personal (*self-improvement*) daripada persaingan semata.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Alat bantu coaching untuk perancangan simulasi relay dan target interval latihan.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
