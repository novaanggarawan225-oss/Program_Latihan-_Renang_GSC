import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Athlete } from '../../types';
import { AddAthleteModal } from '../modals/AddAthleteModal';
import { Users, UserPlus, Edit3, Trash2, Award, Calendar, Check, Shield } from 'lucide-react';

export const AthletesView: React.FC = () => {
  const { data, selectedAthleteId, setSelectedAthleteId, deleteAthlete, currentRole } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | undefined>(undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Manajemen Profil Atlet
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Data atlet terstruktur untuk pemantauan jangka panjang, periodisasi, dan evaluasi hasil latihan
          </p>
        </div>

        {currentRole === 'coach' && (
          <button
            onClick={() => {
              setEditingAthlete(undefined);
              setIsAddModalOpen(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            Tambah Atlet Baru
          </button>
        )}
      </div>

      {/* Athletes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.athletes.map((athlete) => {
          const isSelected = athlete.id === selectedAthleteId;
          const strokeCount = data.swim_results.filter((r) => r.athleteId === athlete.id).length;
          const pbs = data.swim_results.filter((r) => r.athleteId === athlete.id && r.isPB).length;

          return (
            <div
              key={athlete.id}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between relative shadow-lg ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/50 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top card bar */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
                        athlete.avatarColor || 'from-cyan-500 to-blue-600'
                      } flex items-center justify-center text-white font-black text-lg shadow-md`}
                    >
                      {athlete.namaPanggilan.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">
                        {athlete.namaLengkap}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        "{athlete.namaPanggilan}" • {athlete.jenisKelamin === 'L' ? 'Putra' : 'Putri'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700 font-mono-num">
                    {athlete.kelompokUsia.split(' ')[0]}
                  </span>
                </div>

                {/* Info Fields (Section 3) */}
                <div className="space-y-2 text-xs text-slate-300 py-3 border-y border-slate-800/80 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ID Atlet:</span>
                    <span className="font-mono-num text-slate-300">{athlete.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Klub & Pelatih:</span>
                    <span className="text-right text-white font-medium">
                      {athlete.klub} ({athlete.pelatih})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gaya & Nomor Utama:</span>
                    <span className="text-cyan-300 font-semibold">{athlete.nomorUtama}</span>
                  </div>
                  {athlete.nomorTambahan && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nomor Tambahan:</span>
                      <span className="text-slate-300 text-right">{athlete.nomorTambahan}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mulai Latihan:</span>
                    <span className="text-slate-300">{athlete.tanggalMulaiLatihan}</span>
                  </div>
                  {(athlete.tinggiBadan || athlete.beratBadan) && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fisik (TB/BB Pribadi):</span>
                      <span className="text-slate-300 font-mono-num">
                        {athlete.tinggiBadan ? `${athlete.tinggiBadan} cm` : '-'} / {athlete.beratBadan ? `${athlete.beratBadan} kg` : '-'}
                      </span>
                    </div>
                  )}
                  {athlete.catatanKhusus && (
                    <div className="pt-1.5 text-[11px] text-slate-400 italic">
                      Catatan: "{athlete.catatanKhusus}"
                    </div>
                  )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Tes</span>
                    <span className="font-mono-num font-bold text-white text-sm">
                      {strokeCount} kali
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-emerald-400 block">Total PB</span>
                    <span className="font-mono-num font-bold text-emerald-400 text-sm">
                      {pbs} rekor
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => setSelectedAthleteId(athlete.id)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Sedang Aktif
                    </>
                  ) : (
                    'Pilih Atlet'
                  )}
                </button>

                {currentRole === 'coach' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingAthlete(athlete);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                      title="Edit Profil"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {data.athletes.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Hapus data atlet ${athlete.namaLengkap}? Semua riwayat waktu atlet ini akan terhapus.`)) {
                            deleteAthlete(athlete.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Hapus Atlet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      <AddAthleteModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAthlete(undefined);
        }}
        athleteToEdit={editingAthlete}
      />
    </div>
  );
};
