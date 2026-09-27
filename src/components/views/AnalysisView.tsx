import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { SwimProgressChart } from '../charts/SwimProgressChart';
import { MultiStrokeComparisonChart } from '../charts/MultiStrokeComparisonChart';
import { AthleteComparisonView } from './AthleteComparisonView';
import { StrokeStyle } from '../../types';
import {
  LineChart,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const AnalysisView: React.FC = () => {
  const {
    selectedAthlete,
    selectedAthleteId,
    getAthleteResults,
    getAthleteTargets,
    getAthleteTrainingLogs,
    getAthleteRecoveryLogs,
  } = useData();

  const [activeTab, setActiveTab] = useState<'charts' | 'trend_inspector' | 'compare_athletes' | 'ai_coach'>('charts');
  const [selectedStrokeForInspection, setSelectedStrokeForInspection] = useState<StrokeStyle>('Freestyle');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  if (!selectedAthlete) return null;

  // Retrieve results
  const free50 = getAthleteResults(selectedAthleteId, 'Freestyle', '50 m');
  const breast50 = getAthleteResults(selectedAthleteId, 'Breaststroke', '50 m');
  const fly50 = getAthleteResults(selectedAthleteId, 'Butterfly', '50 m');
  const back50 = getAthleteResults(selectedAthleteId, 'Backstroke', '50 m');
  const allResults = getAthleteResults(selectedAthleteId);

  // Targets
  const targets = getAthleteTargets(selectedAthleteId);
  const freeTarget = targets.find((t) => t.gaya === 'Freestyle' && t.jarak === '50 m');
  const breastTarget = targets.find((t) => t.gaya === 'Breaststroke' && t.jarak === '50 m');
  const flyTarget = targets.find((t) => t.gaya === 'Butterfly' && t.jarak === '50 m');
  const backTarget = targets.find((t) => t.gaya === 'Backstroke' && t.jarak === '50 m');

  // Multi-trial data for selected stroke
  const trialResults = getAthleteResults(selectedAthleteId, selectedStrokeForInspection, '50 m');
  const recentTrials = trialResults.slice(-5);

  // Detect whether times got slower in recent trials
  const isSlowingDown =
    recentTrials.length >= 2 &&
    recentTrials[recentTrials.length - 1].waktuDetik > recentTrials[recentTrials.length - 2].waktuDetik;

  // AI Coach triggering
  const handleRequestAi = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/gemini/coach-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete: selectedAthlete,
          latestResult: allResults[allResults.length - 1],
          history: allResults.slice(-6),
          trainingLogs: getAthleteTrainingLogs(selectedAthleteId).slice(-6),
          recoveryLogs: getAthleteRecoveryLogs(selectedAthleteId).slice(-4),
          target: targets[0],
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-400" />
            Analisis Performa & Grafik Perkembangan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluasi waktu berkala, Personal Best (PB), analisis tren trial, dan investigasi faktor performa
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'charts' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            5 Grafik Utama
          </button>
          <button
            onClick={() => setActiveTab('trend_inspector')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'trend_inspector' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sistem Perbandingan Hasil
          </button>
          <button
            onClick={() => setActiveTab('compare_athletes')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compare_athletes' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Komparasi Atlet
          </button>
          <button
            onClick={() => {
              setActiveTab('ai_coach');
              if (!aiAnalysis) handleRequestAi();
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai_coach' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analisis AI Coach
          </button>
        </div>
      </div>

      {/* VIEW 1: 5 GRAFIK UTAMA (Section 6) */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Grafik 1: 50m Freestyle */}
            <SwimProgressChart
              title="Grafik 1: Perkembangan 50 m Freestyle"
              results={free50}
              target={freeTarget}
              strokeColor="#06b6d4"
            />

            {/* Grafik 2: 50m Breaststroke */}
            <SwimProgressChart
              title="Grafik 2: Perkembangan 50 m Breaststroke"
              results={breast50}
              target={breastTarget}
              strokeColor="#10b981"
            />

            {/* Grafik 3: 50m Butterfly */}
            <SwimProgressChart
              title="Grafik 3: Perkembangan 50 m Butterfly"
              results={fly50}
              target={flyTarget}
              strokeColor="#f59e0b"
            />

            {/* Grafik 4: 50m Backstroke */}
            <SwimProgressChart
              title="Grafik 4: Perkembangan 50 m Backstroke"
              results={back50}
              target={backTarget}
              strokeColor="#3b82f6"
            />
          </div>

          {/* Grafik 5: Perbandingan Semua Gaya */}
          <MultiStrokeComparisonChart
            athleteName={selectedAthlete.namaPanggilan}
            results={allResults}
          />
        </div>
      )}

      {/* VIEW 2: SISTEM PERBANDINGAN HASIL & TREND MULTI-TRIAL (Section 18) */}
      {activeTab === 'trend_inspector' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
              <div>
                <h3 className="font-bold text-white text-base">
                  Perbandingan Rentetan Time Trial: 50 m {selectedStrokeForInspection}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menganalisis pola adaptasi waktu antar sesi pengujian
                </p>
              </div>

              {/* Stroke selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Pilih Gaya:</span>
                <select
                  value={selectedStrokeForInspection}
                  onChange={(e) => setSelectedStrokeForInspection(e.target.value as StrokeStyle)}
                  className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="Freestyle">Freestyle</option>
                  <option value="Backstroke">Backstroke</option>
                  <option value="Breaststroke">Breaststroke</option>
                  <option value="Butterfly">Butterfly</option>
                </select>
              </div>
            </div>

            {/* Trial Cards Flow */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
              {recentTrials.map((t, idx) => {
                const prev = idx > 0 ? recentTrials[idx - 1] : null;
                const diff = prev ? +(t.waktuDetik - prev.waktuDetik).toFixed(2) : 0;
                const isFaster = diff < 0;

                return (
                  <div
                    key={t.id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-cyan-400">Trial {idx + 1}</span>
                        <span className="text-[10px]">{t.tanggal}</span>
                      </div>
                      <div className="text-xl font-black font-mono-num text-white">
                        {t.waktu}s
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                      {prev ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Perubahan:</span>
                          <span
                            className={`font-mono-num font-bold ${
                              isFaster ? 'text-emerald-400' : diff > 0 ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          >
                            {diff < 0 ? `${diff.toFixed(2)}s` : diff > 0 ? `+${diff.toFixed(2)}s` : '0.00s'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Trial Awal Baseline</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section 18: Constructive Investigation Checklist */}
            <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h4 className="font-bold text-white text-sm">
                  Prinsip Analisis Perubahan Waktu Atlet (Anti-Toxic Coaching)
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                "Jika hasil waktu memburuk atau mengalami stagnasi pada satu sesi,{' '}
                <strong className="text-cyan-300 font-semibold">
                  jangan langsung menyimpulkan atlet kehilangan kemampuan atau mengalami penurunan bakat.
                </strong>{' '}
                Performa renang dipengaruhi oleh banyak faktor dinamis. Periksa 8 faktor berikut bersama pelatih dan atlet:"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">1. Fatigue (Kelelahan)</span>
                  <p className="text-slate-400 text-[11px]">
                    Apakah atlet baru saja melewati volume latihan berat dalam 48 jam terakhir?
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">2. Status Pemulihan</span>
                  <p className="text-slate-400 text-[11px]">
                    Apakah ada jeda istirahat dan nutrisi karbohidrat-protein yang memadai pasca sesi sebelumnya?
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">3. Kualitas Tidur</span>
                  <p className="text-slate-400 text-[11px]">
                    Apakah atlet tidur cukup 8-9 jam dengan tidur nyenyak tanpa gangguan?
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">4. Beban Sekolah / Stres</span>
                  <p className="text-slate-400 text-[11px]">
                    Ujian sekolah, tugas akademik, atau kelelahan mental dari aktivitas luar kolam.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">5. Detail Teknik</span>
                  <p className="text-slate-400 text-[11px]">
                    Periksa sudut reaksi start di balok, kedalaman streamline, atau tarikan catch.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">6. Strategi Pacing</span>
                  <p className="text-slate-400 text-[11px]">
                    Apakah atlet keluar terlalu cepat (terburu-buru) di 15m awal sehingga kehabisan tenaga?
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">7. Kondisi Kolam</span>
                  <p className="text-slate-400 text-[11px]">
                    Suhu air dingin/panas, kolam indoor vs outdoor, atau perbedaan kolam 25m vs 50m.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">8. Adaptasi Beban</span>
                  <p className="text-slate-400 text-[11px]">
                    Fluktuasi waktu adalah fase wajar dalam siklus adaptasi latihan (supercompensation).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: KOMPARASI ATLET (COMPARE ATHLETES RECHARTS VIEW) */}
      {activeTab === 'compare_athletes' && (
        <AthleteComparisonView />
      )}

      {/* VIEW 4: AI COACH ASSISTANT (Section 17) */}
      {activeTab === 'ai_coach' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-purple-500/40 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-500/20 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">
                    Sistem Analisis AI Coach Assistant
                  </h3>
                  <p className="text-xs text-purple-200/70">
                    Grounded dengan model Gemini 3.8 Flash • Memadukan data waktu, RPE, pemulihan & teknik
                  </p>
                </div>
              </div>

              <button
                onClick={handleRequestAi}
                disabled={aiGenerating}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {aiGenerating ? 'Sedang Menganalisis...' : 'Perbarui Analisis AI'}
              </button>
            </div>

            {aiAnalysis ? (
              <div className="space-y-5 text-xs">
                {/* 1. Ringkasan Performa & 2. Perubahan dari Tes Sebelumnya */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/20">
                    <span className="font-bold text-cyan-400 block mb-1 text-[11px] uppercase tracking-wider">
                      1. Ringkasan Performa
                    </span>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {aiAnalysis.ringkasanPerforma}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/20">
                    <span className="font-bold text-cyan-400 block mb-1 text-[11px] uppercase tracking-wider">
                      2. Perubahan Waktu & 3. Tren
                    </span>
                    <p className="text-slate-200 font-medium">
                      {aiAnalysis.perubahanWaktu}
                    </p>
                    <p className="text-slate-400 mt-2">
                      <strong>Analisis Tren:</strong> {aiAnalysis.trenPerforma}
                    </p>
                  </div>
                </div>

                {/* 4. Area yang Perlu Diperhatikan & 5. Fokus Teknik */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="font-bold text-amber-400 block mb-2 text-[11px] uppercase tracking-wider">
                      4. Area yang Perlu Diperhatikan
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {aiAnalysis.areaPerhatian?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="font-bold text-blue-400 block mb-2 text-[11px] uppercase tracking-wider">
                      5. Fokus Teknik
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {aiAnalysis.fokusTeknik?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 6. Rekomendasi Renang, 7. Fisik, 8. Recovery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20">
                    <span className="font-bold text-cyan-400 block mb-2 text-[11px] uppercase tracking-wider">
                      6. Rekomendasi Latihan Renang
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {aiAnalysis.rekomendasiRenang?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/20">
                    <span className="font-bold text-purple-400 block mb-2 text-[11px] uppercase tracking-wider">
                      7. Rekomendasi Latihan Fisik (Dryland)
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {aiAnalysis.rekomendasiFisik?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/20">
                    <span className="font-bold text-emerald-400 block mb-2 text-[11px] uppercase tracking-wider">
                      8. Rekomendasi Recovery & Tidur
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {aiAnalysis.rekomendasiRecovery?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 9. Fokus Evaluasi Berikutnya */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <span className="font-bold text-white block mb-1 text-[11px] uppercase tracking-wider">
                    9. Fokus Evaluasi Pada Sesi Berikutnya
                  </span>
                  <p className="text-slate-300">
                    {aiAnalysis.fokusEvaluasiBerikutnya}
                  </p>
                </div>

                {/* Safety Boundary Notice (Section 17 & 20) */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200">Batasan & Etika AI Coach:</strong> AI tidak mengklaim diagnosis medis. Rekomendasi latihan di atas bersifat usulan penunjang yang harus ditinjau dan disetujui oleh pelatih sebelum diterapkan kepada atlet.
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <Brain className="w-8 h-8 text-purple-400" />
                <p>Klik tombol "Perbarui Analisis AI" untuk memulai evaluasi data atlet {selectedAthlete.namaLengkap}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
