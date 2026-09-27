import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X, ClipboardList, AlertTriangle } from 'lucide-react';

interface AddTrainingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTrainingLogModal: React.FC<AddTrainingLogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data, selectedAthleteId, addTrainingLog } = useData();

  const [athleteId, setAthleteId] = useState(selectedAthleteId);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jenisLatihan, setJenisLatihan] = useState<'Renang' | 'Fisik' | 'Recovery' | 'Rest'>('Renang');
  const [durasiMenit, setDurasiMenit] = useState('90');
  const [volumeMeter, setVolumeMeter] = useState('3500');
  const [rpe, setRpe] = useState('7');

  // Pre-training
  const [energiSebelum, setEnergiSebelum] = useState('4');
  const [motivasiSebelum, setMotivasiSebelum] = useState('4');
  const [tidurSebelum, setTidurSebelum] = useState('4');

  // Post-training
  const [energiSetelah, setEnergiSetelah] = useState('3');
  const [kelelahanSetelah, setKelelahanSetelah] = useState('3');

  // Pain / complaints
  const [adaKeluhanNyeri, setAdaKeluhanNyeri] = useState(false);
  const [lokasiNyeri, setLokasiNyeri] = useState('');
  const [catatan, setCatatan] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTrainingLog({
      athleteId,
      tanggal,
      jenisLatihan,
      durasiMenit: parseInt(durasiMenit, 10) || 0,
      volumeMeter: jenisLatihan === 'Renang' ? (parseInt(volumeMeter, 10) || 0) : 0,
      rpe: parseInt(rpe, 10) || 5,
      energiSebelum: parseInt(energiSebelum, 10) || 3,
      motivasiSebelum: parseInt(motivasiSebelum, 10) || 3,
      tidurSebelum: parseInt(tidurSebelum, 10) || 3,
      energiSetelah: parseInt(energiSetelah, 10) || 3,
      kelelahanSetelah: parseInt(kelelahanSetelah, 10) || 3,
      adaKeluhanNyeri,
      lokasiNyeri: adaKeluhanNyeri ? lokasiNyeri : undefined,
      catatan: catatan.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Catat Log Latihan Harian</h3>
              <p className="text-xs text-slate-400">
                Mencatat beban latihan, RPE, volume, dan pemantauan kondisi tubuh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Atlet</label>
              <select
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                {data.athletes.map((ath) => (
                  <option key={ath.id} value={ath.id}>
                    {ath.namaLengkap}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jenis Latihan</label>
              <select
                value={jenisLatihan}
                onChange={(e) => setJenisLatihan(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Renang">Renang</option>
                <option value="Fisik">Fisik (Dryland)</option>
                <option value="Recovery">Active Recovery</option>
                <option value="Rest">Total Rest</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Durasi (Menit)</label>
              <input
                type="number"
                value={durasiMenit}
                onChange={(e) => setDurasiMenit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Volume {jenisLatihan === 'Renang' ? '(Meter)' : ''}
              </label>
              <input
                type="number"
                disabled={jenisLatihan !== 'Renang'}
                value={jenisLatihan === 'Renang' ? volumeMeter : '0'}
                onChange={(e) => setVolumeMeter(e.target.value)}
                placeholder="e.g. 3800"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none font-mono-num disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Intensitas (RPE 1-10)</label>
              <select
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none font-mono-num"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <option key={v} value={v}>
                    {v} - {v <= 3 ? 'Sangat Ringan' : v <= 6 ? 'Moderat' : v <= 8 ? 'Berat/Race Pace' : 'Maksimal'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kondisi Sebelum Latihan (1-5) */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-300 font-semibold block mb-2">
              Kondisi Sebelum Latihan (Skala 1 - 5)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Tingkat Energi</label>
                <select
                  value={energiSebelum}
                  onChange={(e) => setEnergiSebelum(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="1">1 (Sangat Drop)</option>
                  <option value="2">2 (Kurang)</option>
                  <option value="3">3 (Cukup)</option>
                  <option value="4">4 (Bagus)</option>
                  <option value="5">5 (Prima)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Motivasi</label>
                <select
                  value={motivasiSebelum}
                  onChange={(e) => setMotivasiSebelum(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="1">1 (Lesu)</option>
                  <option value="2">2 (Rendah)</option>
                  <option value="3">3 (Biasa)</option>
                  <option value="4">4 (Semangat)</option>
                  <option value="5">5 (Sangat Tinggi)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Kualitas Tidur Semalam</label>
                <select
                  value={tidurSebelum}
                  onChange={(e) => setTidurSebelum(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="1">1 (Buruk/Insomnia)</option>
                  <option value="2">2 (Sering Bangun)</option>
                  <option value="3">3 (Cukup)</option>
                  <option value="4">4 (Nyenyak)</option>
                  <option value="5">5 (Optimal 8-9 jam)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kondisi Setelah Latihan (1-5) */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-300 font-semibold block mb-2">
              Kondisi Setelah Latihan (Skala 1 - 5)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Sisa Energi</label>
                <select
                  value={energiSetelah}
                  onChange={(e) => setEnergiSetelah(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="1">1 (Habis Total)</option>
                  <option value="2">2 (Lemas)</option>
                  <option value="3">3 (Normal Lelah Latihan)</option>
                  <option value="4">4 (Masih Segar)</option>
                  <option value="5">5 (Sangat Bugar)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Tingkat Kelelahan</label>
                <select
                  value={kelelahanSetelah}
                  onChange={(e) => setKelelahanSetelah(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="1">1 (Tidak Lelah)</option>
                  <option value="2">2 (Ringan)</option>
                  <option value="3">3 (Moderat Wajar)</option>
                  <option value="4">4 (Berat / Sangat Capek)</option>
                  <option value="5">5 (Ekstrem / Kelelahan Berlebih)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Keluhan Nyeri / Safety Warning */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={adaKeluhanNyeri}
                onChange={(e) => setAdaKeluhanNyeri(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400"
              />
              <span>Ada keluhan rasa nyeri, pegal tidak wajar, atau rasa tidak nyaman</span>
            </label>

            {adaKeluhanNyeri && (
              <div className="mt-2.5 space-y-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Lokasi & deskripsi nyeri (contoh: nyeri sendi bahu kanan depan saat recovery stroke)"
                  value={lokasiNyeri}
                  onChange={(e) => setLokasiNyeri(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-white"
                />
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    PERINGATAN KESELAMATAN: Keluhan nyeri fisik harus dievaluasi langsung oleh pelatih/fisioterapis. Jangan menambah beban latihan atau memaksakan intensitas saat atlet mengeluhkan rasa sakit!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Catatan Sesi */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Catatan Latihan / Target Set</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Sesi aerobik lancar, ritme nafas tiap 3 kayuhan dipertahankan..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Simpan Log Latihan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
