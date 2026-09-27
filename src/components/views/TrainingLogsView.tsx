import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AddTrainingLogModal } from '../modals/AddTrainingLogModal';
import { ClipboardList, Plus, AlertTriangle, Calendar, Clock, Waves, Dumbbell, HeartPulse, Trash2 } from 'lucide-react';

export const TrainingLogsView: React.FC = () => {
  const { selectedAthlete, selectedAthleteId, data, deleteTrainingLog, currentRole } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterJenis, setFilterJenis] = useState('All');

  if (!selectedAthlete) return null;

  const logs = data.training_logs
    .filter((l) => l.athleteId === selectedAthleteId)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const filtered = logs.filter((l) => {
    if (filterJenis !== 'All' && l.jenisLatihan !== filterJenis) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            Log Catatan Latihan Harian
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pencatatan sesi renang, dryland, pemulihan, intensitas (RPE), dan kondisi pre/post latihan
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          Catat Sesi Latihan
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', 'Renang', 'Fisik', 'Recovery', 'Rest'].map((j) => (
          <button
            key={j}
            onClick={() => setFilterJenis(j)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filterJenis === j
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {j === 'All' ? 'Semua Jenis Sesi' : j}
          </button>
        ))}
      </div>

      {/* Logs Feed */}
      <div className="space-y-4">
        {filtered.map((log) => {
          const isFatigued = log.kelelahanSetelah >= 4 || log.adaKeluhanNyeri;

          return (
            <div
              key={log.id}
              className={`rounded-2xl border p-5 shadow-lg relative ${
                log.adaKeluhanNyeri
                  ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      log.jenisLatihan === 'Renang'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : log.jenisLatihan === 'Fisik'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {log.jenisLatihan === 'Renang' ? (
                      <Waves className="w-5 h-5" />
                    ) : log.jenisLatihan === 'Fisik' ? (
                      <Dumbbell className="w-5 h-5" />
                    ) : (
                      <HeartPulse className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Sesi {log.jenisLatihan}
                    </h3>
                    <span className="text-[11px] text-slate-400">{log.tanggal}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono-num">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Durasi</span>
                    <span className="font-bold text-white">{log.durasiMenit} Menit</span>
                  </div>
                  {log.jenisLatihan === 'Renang' && (
                    <div>
                      <span className="text-slate-400 text-[10px] block">Volume</span>
                      <span className="font-bold text-cyan-300">{log.volumeMeter.toLocaleString()} m</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 text-[10px] block">Intensitas</span>
                    <span className="font-bold text-amber-400">RPE {log.rpe}/10</span>
                  </div>
                  {currentRole === 'coach' && (
                    <button
                      onClick={() => {
                        if (confirm('Hapus log latihan ini?')) {
                          deleteTrainingLog(log.id);
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pre & Post Condition Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Kondisi Sebelum Latihan
                  </span>
                  <div className="flex items-center gap-3 text-slate-300 text-[11px]">
                    <span>Energi: <strong>{log.energiSebelum}/5</strong></span>
                    <span>Motivasi: <strong>{log.motivasiSebelum}/5</strong></span>
                    <span>Tidur: <strong>{log.tidurSebelum}/5</strong></span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Kondisi Setelah Latihan
                  </span>
                  <div className="flex items-center gap-3 text-slate-300 text-[11px]">
                    <span>Sisa Energi: <strong>{log.energiSetelah}/5</strong></span>
                    <span className={log.kelelahanSetelah >= 4 ? 'text-amber-400 font-semibold' : ''}>
                      Kelelahan: <strong>{log.kelelahanSetelah}/5</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Injury / Pain Complaint Warning Banner */}
              {log.adaKeluhanNyeri && (
                <div className="mb-3 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Keluhan Fisik Tercatat:</strong>
                    <span>{log.lokasiNyeri || 'Ada rasa nyeri/pegal tidak wajar pada atlet.'}</span>
                    <span className="block text-[10px] text-amber-200/80 mt-1">
                      Pelatih harus mengevaluasi beban sesi berikutnya dan tidak menambah intensitas.
                    </span>
                  </div>
                </div>
              )}

              {log.catatan && (
                <div className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-slate-400 block text-[10px]">Catatan Latihan:</span>
                  <p>{log.catatan}</p>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
            Belum ada catatan latihan untuk kategori ini.
          </div>
        )}
      </div>

      <AddTrainingLogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
