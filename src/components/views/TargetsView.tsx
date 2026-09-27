import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AddTargetModal } from '../modals/AddTargetModal';
import { Target, Plus, CheckCircle, Clock, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { TargetWaktu } from '../../types';

export const TargetsView: React.FC = () => {
  const { selectedAthlete, selectedAthleteId, data, updateTarget, deleteTarget, currentRole } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!selectedAthlete) return null;

  const targets = data.targets.filter((t) => t.athleteId === selectedAthleteId);

  // Calculate days remaining
  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const end = new Date(deadline);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Target Sasaran Waktu Atlet
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Menentukan milestone sasaran latihan berbasis waktu PB dan hitung mundur periodisasi
          </p>
        </div>

        {currentRole === 'coach' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            Tetapkan Target Baru
          </button>
        )}
      </div>

      {/* Target Philosophy Notice (Section 11) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">
            Prinsip Target Waktu (Pedoman Pelatih):
          </strong>
          Target waktu ditampilkan sebagai <span className="text-cyan-300 font-semibold">sasaran arah latihan terarah</span> dalam program periodisasi, bukan sebagai beban tekanan psikologis atau jaminan mutlak yang harus dipaksakan kepada atlet muda.
        </div>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {targets.map((tgt) => {
          const daysLeft = getDaysRemaining(tgt.batasWaktu);
          const isAchieved = tgt.status === 'Achieved';

          return (
            <div
              key={tgt.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between shadow-xl relative ${
                isAchieved
                  ? 'bg-slate-900 border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tgt.jarak} {tgt.gaya}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    Jangka {tgt.targetJangka}
                  </span>
                </div>

                {/* Target Comparison */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">PB Baseline</span>
                    <span className="text-base font-bold font-mono-num text-slate-300">
                      {tgt.pbSaatIni}s
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 block font-semibold">Sasaran Target</span>
                    <span className="text-xl font-black font-mono-num text-amber-400">
                      {tgt.waktuTarget}s
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Selisih Detik:</span>
                    <strong className="text-amber-400 font-mono-num">
                      {tgt.selisihDetik > 0 ? `-${tgt.selisihDetik.toFixed(2)} detik` : `${tgt.selisihDetik.toFixed(2)} detik`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Batas Waktu:</span>
                    <span className="text-slate-200">{tgt.batasWaktu}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Sisa Waktu:</span>
                    {isAchieved ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Berhasil Dicapai
                      </span>
                    ) : daysLeft > 0 ? (
                      <span className="text-cyan-400 font-semibold font-mono-num flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {daysLeft} hari lagi ({Math.ceil(daysLeft / 7)} minggu)
                      </span>
                    ) : (
                      <span className="text-slate-500">Batas Waktu Lewat</span>
                    )}
                  </div>
                </div>

                {tgt.catatan && (
                  <p className="text-[11px] text-slate-400 italic mb-4">
                    "{tgt.catatan}"
                  </p>
                )}
              </div>

              {/* Status Update / Action */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {currentRole === 'coach' ? (
                  <button
                    onClick={() =>
                      updateTarget({
                        ...tgt,
                        status: isAchieved ? 'In Progress' : 'Achieved',
                      })
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      isAchieved
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                  >
                    {isAchieved ? 'Batalkan Status Selesai' : 'Tandai Tercapai (PB Baru)'}
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">
                    Status: <strong className={isAchieved ? 'text-emerald-400' : 'text-amber-400'}>{tgt.status}</strong>
                  </span>
                )}

                {currentRole === 'coach' && (
                  <button
                    onClick={() => {
                      if (confirm('Hapus target waktu ini?')) {
                        deleteTarget(tgt.id);
                      }
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {targets.length === 0 && (
          <div className="py-12 text-center text-slate-500 col-span-full bg-slate-900/50 rounded-2xl border border-slate-800">
            Belum ada target waktu aktif untuk atlet ini.
          </div>
        )}
      </div>

      <AddTargetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
