import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  Dumbbell,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Sparkles,
  AlertCircle,
  Zap,
  Activity,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { PeriodizationPhase, PhysicalProgram } from '../../types';
import { computeAdaptiveInsights } from '../../utils/adaptiveTrainingEngine';

export const PhysicalProgramsView: React.FC = () => {
  const { selectedAthlete, selectedAthleteId, data, addPhysicalProgram, updatePhysicalProgram, currentRole } = useData();

  const [showModal, setShowModal] = useState(false);
  const [fase, setFase] = useState<PeriodizationPhase>('Development');
  const [namaProgram, setNamaProgram] = useState('Dryland Khusus Perenang: Core & Shoulder Mobility');
  const [catatanPenyesuaian, setCatatanPenyesuaian] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [mobility, setMobility] = useState<string>('Shoulder CARs (2 set x 10 rep), Thoracic spine foam roller (3 menit), Ankle plantar flexion stretch (2 set x 30s)');
  const [core, setCore] = useState<string>('Front Plank hold (3 set x 45s), Side Plank with rotation (3 set x 30s/sisi), Dead Bug control (3 set x 12 rep), Bird Dog isometric (3 set x 10 rep)');
  const [strength, setStrength] = useState<string>('Bodyweight Pull-ups / Inverted Row (3 set x 8 rep), Push-up tempo terkontrol (3 set x 12 rep), Goblet Squat beban ringan (3 set x 10 rep)');
  const [power, setPower] = useState<string>('Medicine Ball Chest Pass eksplosif (3 set x 6 rep), Broad Jump dengan pendaratan lembut (3 set x 5 rep)');
  const [coordination, setCoordination] = useState<string>('Single-leg balance with ball toss (2 set x 10 rep/kaki), Agility ladder quick feet');
  const [conditioning, setConditioning] = useState<string>('Jump rope steady pace (3 x 2 menit, istirahat 1 menit)');
  const [catatanKeamanan, setCatatanKeamanan] = useState<string>('Untuk atlet anak/remaja, hindari beban angkat berat di atas kepala (overhead loading). Hentikan jika ada nyeri pada sendi bahu.');

  // Compute adaptive dryland insights
  const insights = useMemo(() => {
    if (!selectedAthlete) return null;
    return computeAdaptiveInsights(
      selectedAthlete,
      data.training_logs,
      data.swim_results,
      data.recovery_logs,
      fase
    );
  }, [selectedAthlete, data.training_logs, data.swim_results, data.recovery_logs, fase]);

  if (!selectedAthlete || !insights) return null;

  const programs = data.physical_programs.filter((p) => p.athleteId === selectedAthleteId);

  // Apply automatic dryland adaptation based on previous training results
  const handleApplyAdaptiveDryland = () => {
    const phys = insights.physicalAdjustments;
    setNamaProgram(`Dryland Adaptif Fase ${fase} - ${insights.readinessLevel === 'optimal' ? 'Penguatan & Power' : 'Pemulihan & Mobilitas'}`);
    setMobility(phys.mobilityFocus.join(', '));
    setCore(phys.coreFocus.join(', '));
    setStrength(phys.strengthFocus.join(', '));
    setPower(phys.powerFocus.join(', '));
    setCoordination(phys.coordinationFocus.join(', '));
    setConditioning(phys.conditioningFocus.join(', '));
    setCatatanKeamanan(`${phys.safetyNote} (Penyesuaian Sesi: ${phys.adaptiveNotes.join(' • ')})`);
    setCatatanPenyesuaian(phys.adaptiveNotes.join(' • '));
    setShowModal(true);
  };

  // Generate AI adaptive dryland
  const handleGenerateAiDryland = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete: selectedAthlete,
          stroke: selectedAthlete.gayaUtama,
          distance: selectedAthlete.nomorUtama.split(' ')[0] || '50m',
          phase: fase,
          level: 'Kompetisi Remaja',
          focusWeakness: 'Dryland fungsional, mobilitas sendi bahu dan kestabilan core',
          trainingLogs: data.training_logs.filter((l) => l.athleteId === selectedAthleteId),
          swimResults: data.swim_results.filter((r) => r.athleteId === selectedAthleteId),
          recoveryLogs: data.recovery_logs.filter((rec) => rec.athleteId === selectedAthleteId),
        }),
      });
      const dataRes = await res.json();
      if (dataRes.program?.programFisik) {
        const pf = dataRes.program.programFisik;
        setNamaProgram(pf.namaProgram || `Dryland Adaptif Fase ${fase}`);
        if (pf.mobility) setMobility(pf.mobility.join(', '));
        if (pf.core) setCore(pf.core.join(', '));
        if (pf.strength) setStrength(pf.strength.join(', '));
        if (pf.power) setPower(pf.power.join(', '));
        if (pf.coordination) setCoordination(pf.coordination.join(', '));
        if (pf.conditioning) setConditioning(pf.conditioning.join(', '));
        if (pf.catatanKeamanan) setCatatanKeamanan(pf.catatanKeamanan);
        if (pf.catatanPenyesuaianFisik) setCatatanPenyesuaian(pf.catatanPenyesuaianFisik);
        setShowModal(true);
      }
    } catch (e) {
      console.error('Error generating AI dryland program:', e);
      handleApplyAdaptiveDryland();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPhysicalProgram({
      athleteId: selectedAthleteId,
      namaProgram,
      tanggal: new Date().toISOString().split('T')[0],
      fasePeriodisasi: fase,
      mobility: mobility.split(',').map((s) => s.trim()).filter(Boolean),
      core: core.split(',').map((s) => s.trim()).filter(Boolean),
      strength: strength.split(',').map((s) => s.trim()).filter(Boolean),
      power: power.split(',').map((s) => s.trim()).filter(Boolean),
      coordination: coordination.split(',').map((s) => s.trim()).filter(Boolean),
      conditioning: conditioning.split(',').map((s) => s.trim()).filter(Boolean),
      catatanKeamanan: catatanPenyesuaian ? `${catatanKeamanan} | Penyesuaian: ${catatanPenyesuaian}` : catatanKeamanan,
      disetujuiPelatih: currentRole === 'coach',
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-purple-400" />
            Program Latihan Fisik Pendukung (Dryland)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Disesuaikan otomatis dengan riwayat latihan terakhir, tingkat kelelahan, dan mobilitas sendi {selectedAthlete.namaLengkap}
          </p>
        </div>

        {currentRole === 'coach' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleApplyAdaptiveDryland}
              className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Zap className="w-4 h-4 text-purple-400" />
              Sesuaikan dengan Riwayat Sesi
            </button>
            <button
              onClick={handleGenerateAiDryland}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isGenerating ? 'Menyusun Dryland...' : 'Dryland AI Adaptif'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Buat Manual
            </button>
          </div>
        )}
      </div>

      {/* ADAPTIVE DRYLAND ADJUSTMENT CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/40 border border-purple-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Penyesuaian Dryland Berdasarkan Sesi Latihan Sebelumnya
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${insights.readinessColor}`}>
                  {insights.readinessLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mengadaptasi intensitas core, mobilitas sendi, dan daya ledak power berdasarkan beban fisik dan pemulihan atlet.
              </p>
            </div>
          </div>

          {currentRole === 'coach' && (
            <button
              onClick={handleApplyAdaptiveDryland}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer shrink-0 transition-transform active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Terapkan Penyesuaian Dryland
            </button>
          )}
        </div>

        {/* 3-Column Diagnostic Summary for Dryland */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 text-xs">
          {/* Card 1: Status Otot & Keluhan Fisik */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                1. Status Kelelahan & Otot Sesi Lalu
              </span>
              <p className="text-slate-300 text-[11px] mb-1">
                Rata-rata RPE: <strong className="text-white">{insights.avgRpeLast7Days}/10</strong> • Kelelahan pasca latihan: <strong className="text-white">{insights.lastSessionFatigue}/5</strong>
              </p>
              {insights.activePainComplaint ? (
                <div className="text-[10px] text-rose-300 bg-rose-500/10 p-2 rounded border border-rose-500/30 flex items-start gap-1.5 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-rose-200">Perhatian Area Nyeri:</strong>
                    <span>{insights.activePainComplaint}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Kondisi otot prima tanpa keluhan nyeri</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              {insights.readinessLevel === 'recovery_needed' ? '⚠️ Rekomendasi: Hilangkan beban overhead & plyometric' : '✓ Aman untuk latihan plyometric dan core terukur'}
            </div>
          </div>

          {/* Card 2: Fokus Adaptif Dryland */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                2. Fokus Adaptif Dryland Hari Ini
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>Mobility:</strong> {insights.physicalAdjustments.mobilityFocus[0]}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Core:</strong> {insights.physicalAdjustments.coreFocus[0]}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Power/Dryland:</strong> {insights.physicalAdjustments.powerFocus[0]}</span>
                </li>
              </ul>
            </div>
            <div className="text-[10px] text-purple-300 mt-2 pt-2 border-t border-slate-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{insights.physicalAdjustments.adaptiveNotes[0] || 'Disesuaikan dengan performa'}</span>
            </div>
          </div>

          {/* Card 3: Prinsip Keselamatan Usia & Recovery */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                3. Protokol Keamanan & Pemulihan
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {insights.physicalAdjustments.safetyNote}
              </p>
            </div>
            <div className="text-[10px] text-amber-300 mt-2 pt-2 border-t border-slate-800 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Atlet {selectedAthlete.kelompokUsia}: Utamakan bodyweight control</span>
            </div>
          </div>
        </div>
      </div>

      {/* Youth Safety Warning Card (Section 9 & 20) */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-300 block mb-0.5">
            Prinsip Keselamatan Dryland Atlet Usia Muda:
          </strong>
          Untuk atlet anak dan remaja ({selectedAthlete.kelompokUsia}), dilarang keras memberikan program angkat beban ekstrem atau latihan hingga kelelahan berlebihan. Prioritaskan penguasaan teknik bodyweight, kelenturan sendi bahu & pinggul, stabilitas core (otot perut & punggung), dan pemulihan optimal.
        </div>
      </div>

      {/* Program Cards */}
      <div className="space-y-5">
        {programs.map((program) => (
          <div
            key={program.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Fase {program.fasePeriodisasi}
                  </span>
                  <span className="text-xs text-slate-400">• {program.tanggal}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{program.namaProgram}</h3>
                {(program.catatanKeamanan?.includes('Penyesuaian:') || program.namaProgram.toLowerCase().includes('adaptif')) && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      <Zap className="w-3 h-3 text-purple-400" /> Disesuaikan dari Hasil Latihan Sebelumnya
                    </span>
                  </div>
                )}
              </div>

              {program.disetujuiPelatih ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" /> Disetujui Pelatih
                </span>
              ) : (
                currentRole === 'coach' && (
                  <button
                    onClick={() =>
                      updatePhysicalProgram({
                        ...program,
                        disetujuiPelatih: true,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40"
                  >
                    Setujui Program
                  </button>
                )
              )}
            </div>

            {/* 6 Dryland Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Mobility */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-2 uppercase tracking-wider text-[10px]">
                  1. Mobility (Kelenturan Sendi)
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {program.mobility.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Core */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-purple-400 block mb-2 uppercase tracking-wider text-[10px]">
                  2. Core Stability (Otot Inti Tubuh)
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {program.core.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strength */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-blue-400 block mb-2 uppercase tracking-wider text-[10px]">
                  3. Strength (Sesuai Usia)
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {program.strength.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Power */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-2 uppercase tracking-wider text-[10px]">
                  4. Power (Eksplosif Terpantau)
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {program.power.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coordination */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-2 uppercase tracking-wider text-[10px]">
                  5. Coordination & Balance
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {program.coordination.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Conditioning */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-rose-400 block mb-2 uppercase tracking-wider text-[10px]">
                  6. Conditioning
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {program.conditioning.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {program.catatanKeamanan && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-start gap-2 text-slate-400 text-xs italic">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Catatan Pelatih: "{program.catatanKeamanan}"</span>
              </div>
            )}
          </div>
        ))}
        {programs.length === 0 && (
          <div className="py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
            Belum ada program fisik yang dibuat untuk atlet ini.
          </div>
        )}
      </div>

      {/* Modal Add Physical Program */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <h3 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
              Buat Program Latihan Fisik (Dryland)
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
                    value={fase}
                    onChange={(e) => setFase(e.target.value as any)}
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
                <label className="block text-slate-300 mb-1">1. Mobility (Pisahkan dengan koma)</label>
                <textarea
                  rows={2}
                  value={mobility}
                  onChange={(e) => setMobility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">2. Core (Pisahkan dengan koma)</label>
                <textarea
                  rows={2}
                  value={core}
                  onChange={(e) => setCore(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">3. Strength (Sesuai usia anak/remaja)</label>
                <textarea
                  rows={2}
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">4. Power</label>
                  <input
                    type="text"
                    value={power}
                    onChange={(e) => setPower(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">5. Coordination</label>
                  <input
                    type="text"
                    value={coordination}
                    onChange={(e) => setCoordination(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">6. Conditioning</label>
                <input
                  type="text"
                  value={conditioning}
                  onChange={(e) => setConditioning(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Catatan Keamanan & Pedoman</label>
                <input
                  type="text"
                  value={catatanKeamanan}
                  onChange={(e) => setCatatanKeamanan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl"
                >
                  Simpan Program Fisik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
