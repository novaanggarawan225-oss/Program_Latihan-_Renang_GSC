import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PeriodizationPhase, SwimProgram } from '../../types';
import {
  Waves,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Plus,
  ChevronDown,
  ChevronUp,
  Zap,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { computeAdaptiveInsights } from '../../utils/adaptiveTrainingEngine';

export const SwimProgramsView: React.FC = () => {
  const { selectedAthlete, selectedAthleteId, data, addSwimProgram, updateSwimProgram, currentRole } = useData();

  const [selectedPhase, setSelectedPhase] = useState<PeriodizationPhase>('Development');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);

  // New program form state
  const [namaProgram, setNamaProgram] = useState('Sesi Race Pace & Breakout Sprint');
  const [level, setLevel] = useState('Kompetisi Remaja');
  const [fokusKelemahan, setFokusKelemahan] = useState('Start & Breakout 15m, Stroke Efficiency');
  const [catatanPenyesuaian, setCatatanPenyesuaian] = useState('');
  const [pemanasan, setPemanasan] = useState('300m Choice swim santai + 4x50m Dinamis (25m Kick + 25m Drill) interval 1:15');
  const [teknikDrill, setTeknikDrill] = useState('4x50m Catch-up drill + 4x50m Fingertip drag (fokus rotasi tubuh dan high elbow catch)');
  const [speedSet, setSpeedSet] = useState('4x15m Explosive breakout off the wall with underwater dolphin kick');
  const [aerobicSet, setAerobicSet] = useState('400m Pull buoy breathing alternating rhythm 3-5-3');
  const [coolDown, setCoolDown] = useState('200m Easy loose swim (Backstroke / loose freestyle)');
  const [totalVolumeMeter, setTotalVolumeMeter] = useState('3200');

  // Compute adaptive insights from previous training & test results
  const insights = useMemo(() => {
    if (!selectedAthlete) return null;
    return computeAdaptiveInsights(
      selectedAthlete,
      data.training_logs,
      data.swim_results,
      data.recovery_logs,
      selectedPhase
    );
  }, [selectedAthlete, data.training_logs, data.swim_results, data.recovery_logs, selectedPhase]);

  if (!selectedAthlete || !insights) return null;

  const programs = data.swim_programs.filter((p) => p.athleteId === selectedAthleteId);

  // Apply automatic adaptation based on previous training results
  const handleApplyAdaptiveProgram = () => {
    const adj = insights.swimAdjustments;
    setNamaProgram(`Program Adaptif Fase ${selectedPhase} - ${selectedAthlete.gayaUtama}`);
    setTotalVolumeMeter(String(adj.recommendedVolume));
    setFokusKelemahan(adj.focusDrills[0] || 'Efisiensi kayuhan & ritme');
    setCatatanPenyesuaian(adj.adaptiveNotes.join(' • '));
    setPemanasan(adj.warmupGuidance);
    setTeknikDrill(adj.focusDrills.join('\n'));
    setSpeedSet(adj.speedSetGuidance);
    setAerobicSet(adj.aerobicSetGuidance);
    setCoolDown(adj.cooldownGuidance);
    setShowNewProgramModal(true);
  };

  // AI Automatic Program Generator (with previous training data conditioning)
  const handleGenerateAiProgram = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete: selectedAthlete,
          stroke: selectedAthlete.gayaUtama,
          distance: selectedAthlete.nomorUtama.split(' ')[0] || '50m',
          phase: selectedPhase,
          level,
          focusWeakness: fokusKelemahan,
          trainingLogs: data.training_logs.filter((l) => l.athleteId === selectedAthleteId),
          swimResults: data.swim_results.filter((r) => r.athleteId === selectedAthleteId),
          recoveryLogs: data.recovery_logs.filter((rec) => rec.athleteId === selectedAthleteId),
        }),
      });
      const dataRes = await res.json();
      if (dataRes.program) {
        const prog = dataRes.program;
        setNamaProgram(prog.namaProgram || `Program Fase ${selectedPhase}`);
        setPemanasan(prog.pemanasan || pemanasan);
        setTeknikDrill(prog.teknikDrill || teknikDrill);
        setSpeedSet(prog.speedSet || speedSet);
        setAerobicSet(prog.aerobicSet || aerobicSet);
        setCoolDown(prog.coolDown || coolDown);
        setTotalVolumeMeter(String(prog.totalVolumeMeter || 3000));
        if (prog.catatanPenyesuaianLatihanSebelumnya) {
          setCatatanPenyesuaian(prog.catatanPenyesuaianLatihanSebelumnya);
        }
        setShowNewProgramModal(true);
      }
    } catch (e) {
      console.error('Error generating AI program:', e);
      handleApplyAdaptiveProgram();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    addSwimProgram({
      athleteId: selectedAthleteId,
      namaProgram,
      tanggal: new Date().toISOString().split('T')[0],
      fasePeriodisasi: selectedPhase,
      level,
      pemanasan,
      teknikDrill,
      mainSet: insights.swimAdjustments.recommendedMainSet.map((ms, idx) => ({
        ...ms,
        id: `ms-${Date.now()}-${idx}`,
      })),
      speedSet,
      aerobicSet,
      coolDown,
      totalVolumeMeter: parseInt(totalVolumeMeter, 10) || 3000,
      fokusProgram: catatanPenyesuaian ? `${fokusKelemahan} (Penyesuaian: ${catatanPenyesuaian})` : fokusKelemahan,
      disetujuiPelatih: currentRole === 'coach',
    });

    setShowNewProgramModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400" />
            Program Latihan Renang Terstruktur
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Disesuaikan otomatis dengan hasil latihan sebelumnya, beban RPE, dan evaluasi time trial {selectedAthlete.namaLengkap}
          </p>
        </div>

        {currentRole === 'coach' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleApplyAdaptiveProgram}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              Sesuaikan dengan Riwayat Sesi
            </button>
            <button
              onClick={handleGenerateAiProgram}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isGenerating ? 'Menyusun Program...' : 'Susun Program AI Adaptif'}
            </button>
            <button
              onClick={() => setShowNewProgramModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Manual
            </button>
          </div>
        )}
      </div>

      {/* ADAPTIVE TRAINING ADJUSTMENT CARD (Based on Previous Training & Test Results) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Penyesuaian Adaptif Berdasarkan Latihan Sebelumnya
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${insights.readinessColor}`}>
                  {insights.readinessLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sistem menganalisis akumulasi beban (RPE), volume meter sesi lalu, dan hasil time trial untuk memodulasi program hari ini.
              </p>
            </div>
          </div>

          {currentRole === 'coach' && (
            <button
              onClick={handleApplyAdaptiveProgram}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0 transition-transform active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Terapkan Penyesuaian Otomatis ({insights.swimAdjustments.recommendedVolume}m)
            </button>
          )}
        </div>

        {/* 3-Column Diagnostic Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 text-xs">
          {/* Box 1: Beban Sesi Terakhir */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                1. Beban Latihan Sebelumnya
              </span>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-base font-bold text-white">
                  RPE {insights.avgRpeLast7Days}/10
                </span>
                <span className="text-[11px] text-slate-400">
                  (Rata-rata 5 Sesi Terakhir)
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Sesi terakhir ({insights.lastSessionDate}): <strong className="text-cyan-300">{insights.lastSessionType}</strong>, RPE {insights.lastSessionRpe}/10, Tingkat Kelelahan {insights.lastSessionFatigue}/5.
              </p>
            </div>
            {insights.activePainComplaint ? (
              <div className="mt-2 text-[10px] text-rose-300 bg-rose-500/10 p-1.5 rounded border border-rose-500/30 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{insights.activePainComplaint}</span>
              </div>
            ) : (
              <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Tidak ada keluhan nyeri tercatat</span>
              </div>
            )}
          </div>

          {/* Box 2: Hasil Tes Renang Terakhir */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                2. Hasil Tes Renang Terakhir
              </span>
              {insights.lastTestResult ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-base">
                      {insights.lastTestResult.waktu}s
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({insights.lastTestResult.jarak} {insights.lastTestResult.gaya})
                    </span>
                    {insights.lastTestIsPb ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        PB Baru 🏆
                      </span>
                    ) : insights.lastTestDelta !== null ? (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        insights.lastTestDelta < 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {insights.lastTestDelta < 0 ? `${insights.lastTestDelta.toFixed(2)}s` : `+${insights.lastTestDelta.toFixed(2)}s`}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {insights.lastTestTechniqueNote
                      ? `Catatan Teknik: "${insights.lastTestTechniqueNote}"`
                      : 'Evaluasi ritme & stroke rate konsisten.'}
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-slate-400">Belum ada hasil time trial tercatat.</p>
              )}
            </div>
            <div className="mt-2 text-[10px] text-cyan-400">
              {insights.stagnantOrSlower ? '⚡ Penyesuaian: Intensifkan drill efisiensi' : '✓ Progresi: Main set race pace terarah'}
            </div>
          </div>

          {/* Box 3: Penyesuaian Program Hari Ini */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                3. Rekomendasi Penyesuaian Sesi Ini
              </span>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Volume Rekomendasi:</span>
                  <strong className="text-cyan-300 font-mono-num font-bold">
                    {insights.swimAdjustments.recommendedVolume} meter
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Intensitas:</span>
                  <span className="text-white font-medium">
                    RPE {insights.swimAdjustments.mainSetRpe}/10
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                  {insights.swimAdjustments.volumeAdjustmentReason}
                </p>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{insights.swimAdjustments.focusDrills[0] || 'Drill efisiensi gaya utama'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Periodization Guide Cards (Section 19) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Fase Periodisasi Latihan Renang
          </h3>
          <span className="text-[11px] text-cyan-400">Pilih fase untuk filter atau penyusunan sesi</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {[
            {
              id: 'Preparation',
              title: 'Preparation',
              focus: 'Teknik, Aerobic Base, Mobility, General Strength',
              color: 'border-blue-500/40 text-blue-400',
            },
            {
              id: 'Development',
              title: 'Development',
              focus: 'Strength, Speed, Race Pace, Teknik Spesifik',
              color: 'border-cyan-500/40 text-cyan-400',
            },
            {
              id: 'Pre-Competition',
              title: 'Pre-Competition',
              focus: 'Race Pace, Starts, Turns, Pacing, Peak Speed',
              color: 'border-amber-500/40 text-amber-400',
            },
            {
              id: 'Competition',
              title: 'Competition',
              focus: 'Performa Puncak, Recovery, Race Strategy',
              color: 'border-emerald-500/40 text-emerald-400',
            },
            {
              id: 'Recovery/Transition',
              title: 'Recovery / Transition',
              focus: 'Active Rest, Mobility, Rekreasi Ringan',
              color: 'border-purple-500/40 text-purple-400',
            },
          ].map((phase) => {
            const isActive = selectedPhase === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => setSelectedPhase(phase.id as PeriodizationPhase)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-950 ring-2 ring-cyan-500 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className={`font-bold block ${phase.color} text-xs mb-1`}>
                    {phase.title}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {phase.focus}
                  </p>
                </div>
                {isActive && (
                  <span className="mt-2 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                    ● Aktif Dipilih
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Program List */}
      <div className="space-y-4">
        {programs.map((program) => (
          <div
            key={program.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Fase {program.fasePeriodisasi}
                  </span>
                  <span className="text-xs text-slate-400">• {program.tanggal}</span>
                  <span className="text-xs text-slate-400">• Level: {program.level}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{program.namaProgram}</h3>
                {program.fokusProgram && (
                  <div className="mt-1">
                    <p className="text-xs text-slate-400">
                      Fokus Sesi: <span className="text-slate-200">{program.fokusProgram}</span>
                    </p>
                    {program.fokusProgram.includes('Penyesuaian:') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        <Zap className="w-3 h-3 text-cyan-400" /> Disesuaikan Berdasarkan Latihan Sebelumnya
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Volume</span>
                  <span className="font-mono-num font-bold text-base text-cyan-300">
                    {program.totalVolumeMeter.toLocaleString()} m
                  </span>
                </div>

                {program.disetujuiPelatih ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" /> Disetujui Pelatih
                  </span>
                ) : (
                  currentRole === 'coach' && (
                    <button
                      onClick={() =>
                        updateSwimProgram({
                          ...program,
                          disetujuiPelatih: true,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer"
                    >
                      Setujui Program
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Program Structure (Section 8.A - 8.F) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left Column: Pemanasan & Drill Teknik */}
              <div className="space-y-3">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-blue-400 block mb-1 uppercase tracking-wider text-[10px]">
                    A. Pemanasan (Warm-up)
                  </span>
                  <p className="text-slate-300 leading-relaxed">{program.pemanasan}</p>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1 uppercase tracking-wider text-[10px]">
                    B. Teknik & Drill
                  </span>
                  <p className="text-slate-300 leading-relaxed">{program.teknikDrill}</p>
                </div>

                {program.speedSet && (
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-amber-400 block mb-1 uppercase tracking-wider text-[10px]">
                      D. Speed Set (Kecepatan Maksimal)
                    </span>
                    <p className="text-slate-300 leading-relaxed">{program.speedSet}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Main Set & Cool Down */}
              <div className="space-y-3">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-2 uppercase tracking-wider text-[10px]">
                    C. Main Set (Inti Latihan)
                  </span>
                  <div className="space-y-2">
                    {program.mainSet.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-white font-mono-num font-semibold">
                            {item.rep} x {item.jarak}m
                          </strong>{' '}
                          <span className="text-slate-300">{item.stroke}</span>
                          {item.note && (
                            <span className="block text-[10px] text-slate-400 italic mt-0.5">
                              {item.note}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono-num text-cyan-400 block">
                            @ {item.interval}
                          </span>
                          <span className="text-[10px] text-slate-400">RPE: {item.rpe}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {program.aerobicSet && (
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1 uppercase tracking-wider text-[10px]">
                      E. Aerobic Set (Daya Tahan Pendukung)
                    </span>
                    <p className="text-slate-300 leading-relaxed">{program.aerobicSet}</p>
                  </div>
                )}

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">
                    F. Cool Down (Pendinginan)
                  </span>
                  <p className="text-slate-300 leading-relaxed">{program.coolDown}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {programs.length === 0 && (
          <div className="py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
            Belum ada program renang tersimpan untuk atlet {selectedAthlete.namaLengkap}.
          </div>
        )}
      </div>

      {/* Modal Add / Build Program */}
      {showNewProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <h3 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
              Buat / Edit Program Latihan Renang
            </h3>
            <form onSubmit={handleSaveProgram} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Judul Program</label>
                  <input
                    type="text"
                    value={namaProgram}
                    onChange={(e) => setNamaProgram(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Fase Periodisasi</label>
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Preparation">Preparation</option>
                    <option value="Development">Development</option>
                    <option value="Pre-Competition">Pre-Competition</option>
                    <option value="Competition">Competition</option>
                    <option value="Recovery/Transition">Recovery/Transition</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Fokus Kelemahan Sesi</label>
                <input
                  type="text"
                  value={fokusKelemahan}
                  onChange={(e) => setFokusKelemahan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">A. Pemanasan</label>
                <textarea
                  rows={2}
                  value={pemanasan}
                  onChange={(e) => setPemanasan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">B. Teknik & Drill</label>
                <textarea
                  rows={2}
                  value={teknikDrill}
                  onChange={(e) => setTeknikDrill(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">D. Speed Set</label>
                  <textarea
                    rows={2}
                    value={speedSet}
                    onChange={(e) => setSpeedSet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">E. Aerobic Set</label>
                  <textarea
                    rows={2}
                    value={aerobicSet}
                    onChange={(e) => setAerobicSet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">F. Cool Down</label>
                  <input
                    type="text"
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Total Volume (Meter)</label>
                  <input
                    type="number"
                    value={totalVolumeMeter}
                    onChange={(e) => setTotalVolumeMeter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewProgramModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded-xl"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
