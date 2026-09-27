import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { StrokeStyle } from '../../types';
import { X, Target, Info } from 'lucide-react';

interface AddTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTargetModal: React.FC<AddTargetModalProps> = ({ isOpen, onClose }) => {
  const { data, selectedAthleteId, addTarget, getAthletePB } = useData();

  const [athleteId, setAthleteId] = useState(selectedAthleteId);
  const [gaya, setGaya] = useState<StrokeStyle>('Freestyle');
  const [jarak, setJarak] = useState('50 m');
  
  // Find current PB automatically if available
  const existingPb = getAthletePB(athleteId, gaya, jarak);
  const [pbSaatIni, setPbSaatIni] = useState(existingPb ? existingPb.waktu : '27.40');
  const [waktuTarget, setWaktuTarget] = useState('26.50');
  const [targetJangka, setTargetJangka] = useState<'4 minggu' | '8 minggu' | '12 minggu' | 'custom'>('8 minggu');
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');

  if (!isOpen) return null;

  // Compute deadline based on weeks
  const calculateDeadline = (startDate: string, duration: string) => {
    const d = new Date(startDate);
    const weeks = duration === '4 minggu' ? 4 : duration === '8 minggu' ? 8 : duration === '12 minggu' ? 12 : 6;
    d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().split('T')[0];
  };

  const batasWaktu = calculateDeadline(tanggalMulai, targetJangka);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waktuTarget.trim()) return;

    addTarget({
      athleteId,
      gaya,
      jarak,
      pbSaatIni: pbSaatIni.trim(),
      waktuTarget: waktuTarget.trim(),
      targetJangka,
      tanggalMulai,
      batasWaktu,
      status: 'In Progress',
      catatan: catatan.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tetapkan Sasaran Target Waktu</h3>
              <p className="text-xs text-slate-400">
                Sebagai panduan arah latihan terstruktur dalam periodisasi
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Atlet</label>
              <select
                value={athleteId}
                onChange={(e) => {
                  setAthleteId(e.target.value);
                  const newPb = getAthletePB(e.target.value, gaya, jarak);
                  if (newPb) setPbSaatIni(newPb.waktu);
                }}
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
              <label className="block text-slate-300 font-semibold mb-1">Jangka Waktu</label>
              <select
                value={targetJangka}
                onChange={(e) => setTargetJangka(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="4 minggu">4 Minggu (Fase Intens)</option>
                <option value="8 minggu">8 Minggu (2 Siklus Mesocycle)</option>
                <option value="12 minggu">12 Minggu (Siklus Penuh / Menuju Lomba)</option>
                <option value="custom">Custom Jangka Waktu</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gaya Renang</label>
              <select
                value={gaya}
                onChange={(e) => {
                  const newGaya = e.target.value as StrokeStyle;
                  setGaya(newGaya);
                  const newPb = getAthletePB(athleteId, newGaya, jarak);
                  if (newPb) setPbSaatIni(newPb.waktu);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Freestyle">Freestyle</option>
                <option value="Backstroke">Backstroke</option>
                <option value="Breaststroke">Breaststroke</option>
                <option value="Butterfly">Butterfly</option>
                <option value="Individual Medley">Individual Medley</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jarak</label>
              <select
                value={jarak}
                onChange={(e) => {
                  setJarak(e.target.value);
                  const newPb = getAthletePB(athleteId, gaya, e.target.value);
                  if (newPb) setPbSaatIni(newPb.waktu);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="25 m">25 m</option>
                <option value="50 m">50 m</option>
                <option value="100 m">100 m</option>
                <option value="200 m">200 m</option>
                <option value="400 m">400 m</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">Personal Best (PB) Saat Ini</label>
              <input
                type="text"
                value={pbSaatIni}
                onChange={(e) => setPbSaatIni(e.target.value)}
                placeholder="e.g. 27.60"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-num font-bold text-base"
              />
            </div>
            <div>
              <label className="block text-amber-400 font-semibold mb-1">Target Waktu Sasaran *</label>
              <input
                type="text"
                required
                value={waktuTarget}
                onChange={(e) => setWaktuTarget(e.target.value)}
                placeholder="e.g. 26.50"
                className="w-full bg-slate-900 border border-amber-500/60 rounded-lg px-3 py-2 text-white font-mono-num font-bold text-base focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Batas Waktu (Deadline)</label>
              <input
                type="date"
                value={batasWaktu}
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Nama Ajang / Catatan Target</label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Sasaran Kejuaraan Provinsi (Kejurprov) 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Supportive disclaimer (Section 11 requirement) */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Target ini berfungsi sebagai sasaran arah latihan terukur dan motivasi positif, bukan sebagai jaminan mutlak bahwa atlet harus mencapai waktu tersebut.
            </span>
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
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Simpan Target
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
