import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { StrokeStyle } from '../../types';
import { formatSecondsToTime, formatTimeDifference } from '../../utils/timeFormat';
import {
  Timer,
  Award,
  Target,
  TrendingUp,
  Waves,
  Dumbbell,
  HeartPulse,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenAddResult: () => void;
  onOpenAddTraining: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddResult,
  onOpenAddTraining,
  onNavigateTab,
}) => {
  const {
    selectedAthlete,
    selectedAthleteId,
    getAthleteResults,
    getAthletePB,
    getAthleteTargets,
    getAthleteTrainingLogs,
    getAthleteEvaluations,
    getAthleteRecoveryLogs,
    currentRole,
  } = useData();

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);

  if (!selectedAthlete) {
    return (
      <div className="p-8 text-center text-slate-400">
        Silakan pilih atlet terlebih dahulu.
      </div>
    );
  }

  // Calculate Personal Bests for 4 core strokes (50m)
  const strokes: StrokeStyle[] = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'];
  const pbMap = strokes.reduce((acc, stroke) => {
    acc[stroke] = getAthletePB(selectedAthleteId, stroke, '50 m');
    return acc;
  }, {} as Record<StrokeStyle, any>);

  // All results sorted
  const allResults = getAthleteResults(selectedAthleteId);
  const latestResult = allResults.length > 0 ? allResults[allResults.length - 1] : null;

  // Targets
  const athleteTargets = getAthleteTargets(selectedAthleteId);
  const activeTarget = athleteTargets.find((t) => t.status === 'In Progress') || athleteTargets[0];

  // Training logs this week
  const logs = getAthleteTrainingLogs(selectedAthleteId);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentLogs = logs.filter((l) => new Date(l.tanggal) >= sevenDaysAgo);
  const swimSessions = recentLogs.filter((l) => l.jenisLatihan === 'Renang');
  const physicalSessions = recentLogs.filter((l) => l.jenisLatihan === 'Fisik');
  const recoverySessions = recentLogs.filter((l) => l.jenisLatihan === 'Recovery' || l.jenisLatihan === 'Rest');
  const totalSwimVolume = swimSessions.reduce((acc, s) => acc + (s.volumeMeter || 0), 0);

  // Recovery & Wellness
  const recoveryLogs = getAthleteRecoveryLogs(selectedAthleteId);
  const latestRecovery = recoveryLogs[0];
  const hasFatigueAlert =
    (latestRecovery && (latestRecovery.tingkatKelelahan >= 4 || latestRecovery.nyeriOtot >= 4)) ||
    (recentLogs.some((l) => l.adaKeluhanNyeri));

  // Recent Evaluations
  const evaluations = getAthleteEvaluations(selectedAthleteId);
  const latestEvaluation = evaluations[0];

  // Trigger Gemini AI Coach Assistant (Section 17)
  const handleRequestAiCoach = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/gemini/coach-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete: selectedAthlete,
          latestResult,
          history: allResults.slice(-5),
          trainingLogs: recentLogs,
          recoveryLogs: recoveryLogs.slice(-3),
          target: activeTarget,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiFeedback(data.analysis);
      }
    } catch (err) {
      console.error('Failed to get AI Coach feedback:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Athlete Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${selectedAthlete.avatarColor || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-cyan-500/20`}>
              {selectedAthlete.namaPanggilan.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {selectedAthlete.namaLengkap}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono-num">
                  {selectedAthlete.kelompokUsia}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
                  {selectedAthlete.jenisKelamin === 'L' ? 'Putra' : 'Putri'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Klub: <strong className="text-slate-200">{selectedAthlete.klub}</strong></span>
                <span>• Pelatih: <strong className="text-slate-200">{selectedAthlete.pelatih}</strong></span>
                {selectedAthlete.tinggiBadan && <span>• TB: {selectedAthlete.tinggiBadan} cm</span>}
                {selectedAthlete.beratBadan && <span>• BB: {selectedAthlete.beratBadan} kg</span>}
              </p>
            </div>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddResult}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Timer className="w-4 h-4" />
              Catat Time Trial
            </button>
            <button
              onClick={onOpenAddTraining}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              Catat Latihan
            </button>
            <button
              onClick={handleRequestAiCoach}
              disabled={aiGenerating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
              {aiGenerating ? 'Menganalisis...' : 'Analisis AI Coach'}
            </button>
          </div>
        </div>

        {/* Safety Warning Banner if needed (Section 12 & 20) */}
        {hasFatigueAlert && (
          <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Peringatan Pemulihan & Monitoring Beban:</strong>
              Terdeteksi indikasi kelelahan fisik atau catatan keluhan nyeri otot baru-baru ini. Sistem merekomendasikan evaluasi intensitas latihan oleh pelatih dan memprioritaskan pemulihan aktif (active recovery).
            </div>
          </div>
        )}
      </div>

      {/* PB TERBARU PER GAYA (Section 13) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Personal Best (PB) Terbaru Per Gaya (Benchmark 50m)
          </h3>
          <button
            onClick={() => onNavigateTab('analysis')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            Lihat Semua Grafik <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {strokes.map((stroke) => {
            const pbItem = pbMap[stroke];
            const iconName = stroke === 'Freestyle' ? '🏊' : stroke === 'Backstroke' ? '🏊' : stroke === 'Breaststroke' ? '🏊' : '🏊';
            const strokeBorder =
              stroke === 'Freestyle'
                ? 'border-cyan-500/30'
                : stroke === 'Backstroke'
                ? 'border-blue-500/30'
                : stroke === 'Breaststroke'
                ? 'border-emerald-500/30'
                : 'border-amber-500/30';

            return (
              <div
                key={stroke}
                className={`bg-slate-900/80 p-4 rounded-xl border ${strokeBorder} hover:border-slate-600 transition-all flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <span>{iconName}</span> {stroke}
                  </span>
                  <span className="text-[10px] text-slate-500">50 m</span>
                </div>
                {pbItem ? (
                  <div>
                    <div className="text-2xl font-black font-mono-num text-white">
                      {pbItem.waktu}s
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{pbItem.tanggal}</span>
                      <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        PB
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-slate-500 text-xs">Belum ada tes</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PERKEMBANGAN TERAKHIR, TARGET & LATIHAN MINGGU INI (Section 13) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Perkembangan Terakhir Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-cyan-400" />
                Perkembangan Terakhir
              </span>
              {latestResult && (
                <span className="text-[11px] text-cyan-400 font-medium">
                  {latestResult.jenisTes}
                </span>
              )}
            </div>

            {latestResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    {latestResult.jarak} {latestResult.gaya}
                  </span>
                  <span className="text-slate-400 text-[11px]">{latestResult.tanggal}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Waktu Sebelumnya</span>
                    <span className="text-sm font-mono-num font-semibold text-slate-300">
                      {latestResult.waktuSebelumnya ? `${latestResult.waktuSebelumnya}s` : 'Data Awal'}
                    </span>
                  </div>
                  <div className="text-slate-500 font-bold">→</div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Waktu Terbaru</span>
                    <span className="text-base font-mono-num font-bold text-white">
                      {latestResult.waktu}s
                    </span>
                  </div>
                </div>

                {latestResult.selisihSebelumnya !== undefined && latestResult.selisihSebelumnya !== 0 && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Selisih:</span>
                    <span className={`font-mono-num font-bold ${latestResult.selisihSebelumnya < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {latestResult.selisihSebelumnya < 0
                        ? `${latestResult.selisihSebelumnya.toFixed(2)} detik`
                        : `+${latestResult.selisihSebelumnya.toFixed(2)} detik`}
                      {latestResult.isPB && ' (PB BARU)'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-6 text-center">
                Belum ada data hasil tes renang
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('results')}
            className="w-full mt-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs rounded-lg font-medium transition-all"
          >
            Lihat Riwayat Hasil Lengkap
          </button>
        </div>

        {/* Target Waktu Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                Target Waktu
              </span>
              {activeTarget && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                  {activeTarget.targetJangka}
                </span>
              )}
            </div>

            {activeTarget ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    {activeTarget.jarak} {activeTarget.gaya}
                  </span>
                  <span className="text-slate-400 text-[11px]">Batas: {activeTarget.batasWaktu}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400">Baseline PB:</span>
                    <div className="font-mono-num font-bold text-slate-300 text-sm">
                      {activeTarget.pbSaatIni}s
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400">Sasaran Target:</span>
                    <div className="font-mono-num font-bold text-amber-400 text-base">
                      {activeTarget.waktuTarget}s
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 flex items-center justify-between">
                  <span>Selisih Menuju Target:</span>
                  <strong className="text-amber-400 font-mono-num">
                    {activeTarget.selisihDetik.toFixed(2)} detik
                  </strong>
                </div>

                {activeTarget.catatan && (
                  <p className="text-[11px] text-slate-400 italic">
                    "{activeTarget.catatan}"
                  </p>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-6 text-center">
                Belum ada target waktu aktif
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('targets')}
            className="w-full mt-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs rounded-lg font-medium transition-all"
          >
            Kelola Target Waktu
          </button>
        </div>

        {/* Latihan Minggu Ini Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-blue-400" />
                Latihan Minggu Ini
              </span>
              <span className="text-[11px] text-slate-400">7 Hari Terakhir</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-blue-500/20 text-blue-400">🏊</span>
                  <span className="text-xs text-slate-300">Sesi Renang</span>
                </div>
                <div className="text-right">
                  <span className="font-mono-num font-bold text-white text-sm">
                    {swimSessions.length} sesi
                  </span>
                  <span className="text-[10px] text-cyan-400 block font-mono-num">
                    {totalSwimVolume.toLocaleString()} meter
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-500/20 text-purple-400">💪</span>
                  <span className="text-xs text-slate-300">Latihan Fisik (Dryland)</span>
                </div>
                <span className="font-mono-num font-bold text-white text-sm">
                  {physicalSessions.length} sesi
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">❤️</span>
                  <span className="text-xs text-slate-300">Recovery & Rest</span>
                </div>
                <span className="font-mono-num font-bold text-white text-sm">
                  {recoverySessions.length} hari
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('training_logs')}
            className="w-full mt-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs rounded-lg font-medium transition-all"
          >
            Buka Log Latihan Harian
          </button>
        </div>
      </div>

      {/* AI Coach Assistant Feedback Section (if generated) */}
      {aiFeedback && (
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-purple-500/40 rounded-2xl p-6 shadow-2xl relative">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Evaluasi Asisten AI Coach</h4>
                <p className="text-xs text-purple-200/70">
                  Analisis data gabungan: waktu, volume latihan, pemulihan, dan kelemahan teknik
                </p>
              </div>
            </div>
            <button
              onClick={() => setAiFeedback(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-md"
            >
              Tutup
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/20">
              <h5 className="font-bold text-cyan-300 uppercase tracking-wide text-[11px] mb-1">
                1. Ringkasan Performa & Tren
              </h5>
              <p className="text-slate-200 leading-relaxed font-medium">
                {aiFeedback.ringkasanPerforma}
              </p>
              <div className="mt-2 text-slate-400">
                <strong>Tren:</strong> {aiFeedback.trenPerforma}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Teknik */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-blue-400 block mb-2 text-[11px] uppercase tracking-wider">
                  Fokus Teknik
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {aiFeedback.fokusTeknik?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Latihan Renang */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-2 text-[11px] uppercase tracking-wider">
                  Rekomendasi Renang
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {aiFeedback.rekomendasiRenang?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dryland & Recovery */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-2 text-[11px] uppercase tracking-wider">
                  Rekomendasi Fisik & Pemulihan
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {aiFeedback.rekomendasiFisik?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {aiFeedback.peringatanKeselamatan && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{aiFeedback.peringatanKeselamatan}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terakhir Dievaluasi Card (Section 10) */}
      {latestEvaluation && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Hasil Evaluasi Terakhir: {latestEvaluation.nomor} ({latestEvaluation.tanggal})
            </h4>
            <span className="text-xs text-slate-400">
              Waktu: <strong className="text-white font-mono-num">{latestEvaluation.hasilTerbaru}s</strong> ({latestEvaluation.perubahanWaktu})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Fokus Berikutnya:</span>
              <ul className="space-y-1 text-slate-300">
                {latestEvaluation.fokusBerikutnya.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Rekomendasi Renang:</span>
              <ul className="space-y-1 text-slate-300">
                {latestEvaluation.rekomendasiRenang.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Fokus Pemulihan:</span>
              <ul className="space-y-1 text-slate-300">
                {latestEvaluation.fokusPemulihan.slice(0, 3).map((rec, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
