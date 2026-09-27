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
  ReferenceLine,
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
  Calendar,
  Clock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Award,
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
  { stroke: 'Freestyle', distance: '200 m', label: '200m Freestyle' },
];

export const AthleteComparisonView: React.FC = () => {
  const { data, selectedAthleteId, getAthleteResults, getAthletePB, getAthleteTrainingLogs } = useData();
  const athletes = data.athletes;

  // Selected athletes
  const [athleteAId, setAthleteAId] = useState<string>(selectedAthleteId || athletes[0]?.id || '');
  const [athleteBId, setAthleteBId] = useState<string>(() => {
    const other = athletes.find((a) => a.id !== (selectedAthleteId || athletes[0]?.id));
    return other ? other.id : athletes[1]?.id || athletes[0]?.id || '';
  });

  // Selected event for timeline race progression
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);
  const currentEvent = COMMON_EVENTS[selectedEventIndex] || COMMON_EVENTS[0];

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
      } else if (timeA !== null) {
        fasterAthlete = 'A';
      } else if (timeB !== null) {
        fasterAthlete = 'B';
      }

      return {
        event: label,
        stroke,
        distance,
        athleteATime: timeA,
        athleteBTime: timeB,
        athleteAFormatted: timeA ? formatSecondsToTime(timeA) : '-',
        athleteBFormatted: timeB ? formatSecondsToTime(timeB) : '-',
        diff,
        fasterAthlete,
        gapPercentage,
      } as EventComparisonItem;
    });
  }, [athleteA, athleteB, getAthletePB]);

  // Chart data for PB BarChart
  const barChartData = useMemo(() => {
    return pbComparisonData
      .filter((item) => item.athleteATime !== null || item.athleteBTime !== null)
      .map((item) => ({
        event: item.event,
        [athleteA?.namaPanggilan || 'Atlet A']: item.athleteATime || 0,
        [athleteB?.namaPanggilan || 'Atlet B']: item.athleteBTime || 0,
        formattedA: item.athleteAFormatted,
        formattedB: item.athleteBFormatted,
        diff: item.diff,
        faster: item.fasterAthlete,
      }));
  }, [pbComparisonData, athleteA, athleteB]);

  // Race Time Progression Over Time for selected event
  const timelineComparisonData = useMemo(() => {
    if (!athleteA || !athleteB) return { chartPoints: [], statsA: null, statsB: null };

    const resultsA = getAthleteResults(athleteA.id)
      .filter((r) => r.gaya === currentEvent.stroke && r.jarak === currentEvent.distance)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    const resultsB = getAthleteResults(athleteB.id)
      .filter((r) => r.gaya === currentEvent.stroke && r.jarak === currentEvent.distance)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    // Calculate progression stats
    const computeStats = (results: SwimResult[]) => {
      if (results.length === 0) return null;
      const initialTime = results[0].waktuDetik;
      const latestTime = results[results.length - 1].waktuDetik;
      const bestTime = Math.min(...results.map((r) => r.waktuDetik));
      const totalImprovement = +(initialTime - latestTime).toFixed(2);
      const bestImprovement = +(initialTime - bestTime).toFixed(2);
      const percentImprovement = +((totalImprovement / initialTime) * 100).toFixed(1);

      return {
        initialTime,
        latestTime,
        bestTime,
        totalImprovement,
        bestImprovement,
        percentImprovement,
        count: results.length,
      };
    };

    const statsA = computeStats(resultsA);
    const statsB = computeStats(resultsB);

    // Merge sessions chronologically
    const allDates = Array.from(
      new Set([...resultsA.map((r) => r.tanggal), ...resultsB.map((r) => r.tanggal)])
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let runningBestA: number | null = null;
    let runningBestB: number | null = null;

    const chartPoints = allDates.map((date) => {
      const matchA = resultsA.filter((r) => r.tanggal === date);
      const matchB = resultsB.filter((r) => r.tanggal === date);

      const timeA = matchA.length > 0 ? Math.min(...matchA.map((r) => r.waktuDetik)) : null;
      const timeB = matchB.length > 0 ? Math.min(...matchB.map((r) => r.waktuDetik)) : null;

      if (timeA !== null) {
        runningBestA = runningBestA === null ? timeA : Math.min(runningBestA, timeA);
      }
      if (timeB !== null) {
        runningBestB = runningBestB === null ? timeB : Math.min(runningBestB, timeB);
      }

      const formattedDate = new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });

      return {
        date,
        displayDate: formattedDate,
        [athleteA.namaPanggilan]: timeA,
        [athleteB.namaPanggilan]: timeB,
        [`${athleteA.namaPanggilan} PB`]: runningBestA,
        [`${athleteB.namaPanggilan} PB`]: runningBestB,
        rawA: timeA,
        rawB: timeB,
        typeA: matchA[0]?.jenisTes || '',
        typeB: matchB[0]?.jenisTes || '',
      };
    });

    return { chartPoints, statsA, statsB };
  }, [athleteA, athleteB, currentEvent, getAthleteResults]);

  // Overall training & volume statistics
  const trainingStats = useMemo(() => {
    if (!athleteA || !athleteB) return null;

    const logsA = getAthleteTrainingLogs(athleteA.id);
    const logsB = getAthleteTrainingLogs(athleteB.id);

    const calcVolume = (logs: typeof logsA) =>
      logs.filter((l) => l.jenisLatihan === 'Renang').reduce((acc, curr) => acc + curr.volumeMeter, 0);

    const calcDrylandSessions = (logs: typeof logsA) =>
      logs.filter((l) => l.jenisLatihan === 'Fisik').length;

    const calcAvgRpe = (logs: typeof logsA) => {
      const valid = logs.filter((l) => l.rpe > 0);
      return valid.length > 0
        ? +(valid.reduce((acc, curr) => acc + curr.rpe, 0) / valid.length).toFixed(1)
        : 0;
    };

    return {
      volumeA: calcVolume(logsA),
      volumeB: calcVolume(logsB),
      sessionsA: logsA.length,
      sessionsB: logsB.length,
      drylandA: calcDrylandSessions(logsA),
      drylandB: calcDrylandSessions(logsB),
      rpeA: calcAvgRpe(logsA),
      rpeB: calcAvgRpe(logsB),
    };
  }, [athleteA, athleteB, getAthleteTrainingLogs]);

  // Min and max Y values for line chart
  const yDomain = useMemo(() => {
    const values: number[] = [];
    timelineComparisonData.chartPoints.forEach((p) => {
      if (p.rawA) values.push(p.rawA);
      if (p.rawB) values.push(p.rawB);
    });
    if (values.length === 0) return [20, 60];
    const min = Math.floor(Math.min(...values) - 1.5);
    const max = Math.ceil(Math.max(...values) + 1.5);
    return [Math.max(10, min), max];
  }, [timelineComparisonData.chartPoints]);

  if (athletes.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Memerlukan Minimal 2 Atlet</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Fitur Athlete Comparison memerlukan minimal dua data atlet untuk melakukan analisis komparasi catatan waktu dan progresi balapan berdampingan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-800/40 p-6 shadow-xl">
        <div className="absolute top-0 right-0 translate-x-10 -translate-y-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Users className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">
                Head-to-Head Analytics
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Athlete Comparison View
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Bandingkan kurva progresi waktu, riwayat rekor Personal Best (PB), dan efektivitas latihan antar dua atlet renang secara berdampingan untuk mengidentifikasi celah performa (*performance gap*).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80">
              {athletes.length} Atlet Terdaftar
            </span>
          </div>
        </div>
      </div>

      {/* Selectors Card & Quick Stats */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
          {/* Athlete A Selection (Cyan) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/40 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30" />
                Atlet 1 (Sisi Kiri)
              </span>
              {athleteA && (
                <span className="text-[11px] font-mono font-medium text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                  {athleteA.kelompokUsia}
                </span>
              )}
            </div>
            <select
              value={athleteAId}
              onChange={(e) => setAthleteAId(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-700/60 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {athletes.map((ath) => (
                <option key={ath.id} value={ath.id} disabled={ath.id === athleteBId}>
                  {ath.namaLengkap} ({ath.namaPanggilan}) • {ath.klub}
                </option>
              ))}
            </select>
            {athleteA && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-cyan-900/40 text-[11px]">
                <div>
                  <div className="text-slate-400">Gaya Utama</div>
                  <div className="font-semibold text-white truncate">{athleteA.nomorUtama}</div>
                </div>
                <div>
                  <div className="text-slate-400">Postur</div>
                  <div className="font-semibold text-white">
                    {athleteA.tinggiBadan}cm / {athleteA.beratBadan}kg
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Pelatih</div>
                  <div className="font-semibold text-white truncate">{athleteA.pelatih}</div>
                </div>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="lg:col-span-1 flex justify-center py-2 lg:py-0">
            <button
              onClick={handleSwapAthletes}
              title="Tukar Posisi Atlet"
              className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-md flex items-center justify-center group"
            >
              <ArrowRightLeft className="w-5 h-5 text-cyan-400 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>

          {/* Athlete B Selection (Emerald) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30" />
                Atlet 2 (Sisi Kanan)
              </span>
              {athleteB && (
                <span className="text-[11px] font-mono font-medium text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                  {athleteB.kelompokUsia}
                </span>
              )}
            </div>
            <select
              value={athleteBId}
              onChange={(e) => setAthleteBId(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-700/60 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {athletes.map((ath) => (
                <option key={ath.id} value={ath.id} disabled={ath.id === athleteAId}>
                  {ath.namaLengkap} ({ath.namaPanggilan}) • {ath.klub}
                </option>
              ))}
            </select>
            {athleteB && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-900/40 text-[11px]">
                <div>
                  <div className="text-slate-400">Gaya Utama</div>
                  <div className="font-semibold text-white truncate">{athleteB.nomorUtama}</div>
                </div>
                <div>
                  <div className="text-slate-400">Postur</div>
                  <div className="font-semibold text-white">
                    {athleteB.tinggiBadan}cm / {athleteB.beratBadan}kg
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Pelatih</div>
                  <div className="font-semibold text-white truncate">{athleteB.pelatih}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: Race Time Progression Over Time (Line Chart with Recharts) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">
                Race Time Progression Over Time
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau penurunan waktu dan tren peningkatan performa dari sesi ke sesi pada nomor yang dipilih.
            </p>
          </div>

          {/* Event Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {COMMON_EVENTS.map((event, idx) => (
              <button
                key={event.label}
                onClick={() => setSelectedEventIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedEventIndex === idx
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {event.label}
              </button>
            ))}
          </div>
        </div>

        {/* Improvement Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Athlete A Improvement Card */}
          <div className="bg-slate-950/60 border border-cyan-900/40 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400">
                {athleteA?.namaPanggilan?.charAt(0) || 'A'}
              </div>
              <div>
                <div className="text-xs text-slate-400">{athleteA?.namaPanggilan} Progresi Waktu</div>
                <div className="text-lg font-black text-white flex items-center gap-2">
                  {timelineComparisonData.statsA ? (
                    <>
                      <span>{formatSecondsToTime(timelineComparisonData.statsA.initialTime)}</span>
                      <span className="text-slate-500 text-xs">→</span>
                      <span className="text-cyan-400">
                        {formatSecondsToTime(timelineComparisonData.statsA.latestTime)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-normal text-slate-500">Belum ada catatan waktu</span>
                  )}
                </div>
              </div>
            </div>
            {timelineComparisonData.statsA && (
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                    timelineComparisonData.statsA.totalImprovement > 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {timelineComparisonData.statsA.totalImprovement > 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-{timelineComparisonData.statsA.totalImprovement}s</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{Math.abs(timelineComparisonData.statsA.totalImprovement)}s</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  PB: {formatSecondsToTime(timelineComparisonData.statsA.bestTime)} ({timelineComparisonData.statsA.count} sesi)
                </div>
              </div>
            )}
          </div>

          {/* Athlete B Improvement Card */}
          <div className="bg-slate-950/60 border border-emerald-900/40 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                {athleteB?.namaPanggilan?.charAt(0) || 'B'}
              </div>
              <div>
                <div className="text-xs text-slate-400">{athleteB?.namaPanggilan} Progresi Waktu</div>
                <div className="text-lg font-black text-white flex items-center gap-2">
                  {timelineComparisonData.statsB ? (
                    <>
                      <span>{formatSecondsToTime(timelineComparisonData.statsB.initialTime)}</span>
                      <span className="text-slate-500 text-xs">→</span>
                      <span className="text-emerald-400">
                        {formatSecondsToTime(timelineComparisonData.statsB.latestTime)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-normal text-slate-500">Belum ada catatan waktu</span>
                  )}
                </div>
              </div>
            </div>
            {timelineComparisonData.statsB && (
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                    timelineComparisonData.statsB.totalImprovement > 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {timelineComparisonData.statsB.totalImprovement > 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-{timelineComparisonData.statsB.totalImprovement}s</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{Math.abs(timelineComparisonData.statsB.totalImprovement)}s</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  PB: {formatSecondsToTime(timelineComparisonData.statsB.bestTime)} ({timelineComparisonData.statsB.count} sesi)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recharts LineChart */}
        {timelineComparisonData.chartPoints.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineComparisonData.chartPoints}
                margin={{ top: 10, right: 25, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={yDomain}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  dx={-5}
                  tickFormatter={(val) => `${val}s`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                            <span>{currentEvent.label}</span>
                            <span className="text-slate-400 font-normal">{label}</span>
                          </div>
                          {item?.rawA && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                {athleteA?.namaPanggilan}:
                              </span>
                              <span className="font-mono font-bold text-white">
                                {formatSecondsToTime(item.rawA)}
                                {item.typeA && (
                                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                                    ({item.typeA})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          {item?.rawB && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                {athleteB?.namaPanggilan}:
                              </span>
                              <span className="font-mono font-bold text-white">
                                {formatSecondsToTime(item.rawB)}
                                {item.typeB && (
                                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                                    ({item.typeB})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          {item?.rawA && item?.rawB && (
                            <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Selisih:</span>
                              <span className="font-bold text-amber-400 font-mono">
                                {Math.abs(item.rawA - item.rawB).toFixed(2)}s
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
                  verticalAlign="top"
                  align="right"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
                {athleteA && (
                  <Line
                    type="monotone"
                    dataKey={athleteA.namaPanggilan}
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#06b6d4', stroke: '#083344', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#22d3ee' }}
                    connectNulls
                  />
                )}
                {athleteB && (
                  <Line
                    type="monotone"
                    dataKey={athleteB.namaPanggilan}
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#34d399' }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <Info className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-sm font-semibold text-slate-300">Belum Ada Sesi untuk Nomor Ini</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Catat hasil time trial atau lomba pada nomor {currentEvent.label} untuk kedua atlet guna melihat perbandingan kurva progresi waktu secara otomatis.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: PB Trends Side-by-Side (Recharts BarChart) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                Personal Best (PB) Trends Comparison
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualisasi perbandingan catatan waktu terbaik (PB) antar nomor renang. Semakin pendek batang grafik, semakin cepat waktu atlet.
            </p>
          </div>
        </div>

        {barChartData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="event" stroke="#94a3b8" fontSize={11} tickLine={false} dy={10} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val}s`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {label}
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-cyan-400 font-semibold">{athleteA?.namaPanggilan}:</span>
                            <span className="font-mono font-bold text-white">{item.formattedA}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-emerald-400 font-semibold">{athleteB?.namaPanggilan}:</span>
                            <span className="font-mono font-bold text-white">{item.formattedB}</span>
                          </div>
                          {item.diff !== null && (
                            <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Selisih Gap:</span>
                              <span className="font-bold text-amber-400 font-mono">
                                {Math.abs(item.diff).toFixed(2)} detik
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
                  verticalAlign="top"
                  align="right"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
                {athleteA && (
                  <Bar
                    dataKey={athleteA.namaPanggilan}
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                )}
                {athleteB && (
                  <Bar
                    dataKey={athleteB.namaPanggilan}
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            Belum ada data PB untuk dikomparasi.
          </div>
        )}
      </div>

      {/* SECTION 3: Performance Gap Matrix (Side-by-Side Table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Matriks Celah Performa Head-to-Head
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analisis komparatif gap waktu per nomor untuk menetapkan sasaran target latihan berikutnya.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nomor & Jarak</th>
                <th className="py-3.5 px-4 text-cyan-400">
                  PB {athleteA?.namaPanggilan || 'Atlet A'}
                </th>
                <th className="py-3.5 px-4 text-emerald-400">
                  PB {athleteB?.namaPanggilan || 'Atlet B'}
                </th>
                <th className="py-3.5 px-4">Selisih (Gap)</th>
                <th className="py-3.5 px-4">Atlet Tercepat</th>
                <th className="py-3.5 px-4">Rasio Keunggulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {pbComparisonData.map((item) => (
                <tr key={item.event} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">{item.event}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                    {item.athleteAFormatted}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                    {item.athleteBFormatted}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {item.diff !== null ? (
                      <span className="text-slate-200">
                        {Math.abs(item.diff).toFixed(2)}s
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.fasterAthlete === 'A' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Award className="w-3 h-3" />
                        {athleteA?.namaPanggilan}
                      </span>
                    ) : item.fasterAthlete === 'B' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Award className="w-3 h-3" />
                        {athleteB?.namaPanggilan}
                      </span>
                    ) : item.fasterAthlete === 'Equal' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
                        Imbang
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {item.gapPercentage !== null ? `${item.gapPercentage}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: Training Volume & Physical Condition Contrast */}
      {trainingStats && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Komparasi Beban Latihan & Disiplin Dryland
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Celah performa sering kali berkorelasi dengan total akumulasi volume air, latihan fisik, serta pemulihan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Total Volume Renang</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-cyan-400 font-bold">{athleteA?.namaPanggilan}</div>
                  <div className="text-base font-black text-white font-mono">
                    {trainingStats.volumeA.toLocaleString('id-ID')} m
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400 font-bold">{athleteB?.namaPanggilan}</div>
                  <div className="text-base font-black text-white font-mono">
                    {trainingStats.volumeB.toLocaleString('id-ID')} m
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Total Sesi Latihan</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-cyan-400 font-bold">{athleteA?.namaPanggilan}</div>
                  <div className="text-base font-black text-white font-mono">
                    {trainingStats.sessionsA} sesi
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400 font-bold">{athleteB?.namaPanggilan}</div>
                  <div className="text-base font-black text-white font-mono">
                    {trainingStats.sessionsB} sesi
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Sesi Dryland Fisik</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-cyan-400 font-bold">{athleteA?.namaPanggilan}</div>
                  <div className="text-base font-black text-white font-mono">
                    {trainingStats.drylandA} sesi
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400 font-bold">{athleteB?.namaPanggilan}</div>
                  <div className="text-base font-black text-white font-mono">
                    {trainingStats.drylandB} sesi
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Rata-rata RPE Intensitas</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-cyan-400 font-bold">{athleteA?.namaPanggilan}</div>
                  <div className="text-base font-black text-white font-mono">
                    {trainingStats.rpeA} / 10
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400 font-bold">{athleteB?.namaPanggilan}</div>
                  <div className="text-base font-black text-white font-mono">
                    {trainingStats.rpeB} / 10
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Coach Insights & Gap Closing Advice */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-indigo-900/40 rounded-2xl p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white">
              Rekomendasi Pelatih untuk Menutup Celah Performa (*Gap Mitigation*)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Komparasi antar atlet bertujuan untuk memetakan kekuatan spesifik tiap atlet (misalnya keunggulan eksplosivitas start vs efisiensi daya tahan aerobik jarak jauh) agar pelatih dapat merancang sesi latihan berpasangan (*sparring sets*) yang saling memacu secara positif dan sehat tanpa memicu beban psikologis berlebih.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-950/50 p-3 rounded-lg border border-cyan-900/30">
                <span className="font-bold text-cyan-400 block mb-1">
                  Fokus Penguatan {athleteA?.namaPanggilan}
                </span>
                <span className="text-slate-300">
                  Pertahankan keunggulan pada nomor utama sembari memperkaya efisiensi teknik pernapasan dan fase *underwater streamline* setelah putaran turn.
                </span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-lg border border-emerald-900/30">
                <span className="font-bold text-emerald-400 block mb-1">
                  Fokus Penguatan {athleteB?.namaPanggilan}
                </span>
                <span className="text-slate-300">
                  Tingkatkan frekuensi kayuhan (*stroke rate*) pada 15 meter awal dan sinkronkan stabilitas core dryland untuk mempertahankan kecepatan hingga dinding finis.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
