import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { HeartPulse, Moon, Zap, Activity, AlertTriangle, ShieldCheck, Plus, Check } from 'lucide-react';

export const RecoveryView: React.FC = () => {
  const { selectedAthlete, selectedAthleteId, data, addRecoveryLog, currentRole } = useData();

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jamTidur, setJamTidur] = useState('8.5');
  const [kualitasTidur, setKualitasTidur] = useState('4');
  const [tingkatKelelahan, setTingkatKelelahan] = useState('2');
  const [tingkatStres, setTingkatStres] = useState('2');
  const [nyeriOtot, setNyeriOtot] = useState('2');
  const [keluhanFisik, setKeluhanFisik] = useState('');
  const [bebanSekolah, setBebanSekolah] = useState('');
  const [catatan, setCatatan] = useState('');

  if (!selectedAthlete) return null;

  const recoveryLogs = data.recovery_logs
    .filter((r) => r.athleteId === selectedAthleteId)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const latest = recoveryLogs[0];

  const handleSaveCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    addRecoveryLog({
      athleteId: selectedAthleteId,
      tanggal,
      jamTidur: parseFloat(jamTidur) || 8,
      kualitasTidur: parseInt(kualitasTidur, 10) || 4,
      tingkatKelelahan: parseInt(tingkatKelelahan, 10) || 2,
      tingkatStres: parseInt(tingkatStres, 10) || 2,
      nyeriOtot: parseInt(nyeriOtot, 10) || 2,
      keluhanFisik: keluhanFisik.trim() || undefined,
      bebanSekolahLain: bebanSekolah.trim() || undefined,
      catatan: catatan.trim() || undefined,
    });
    setShowCheckInModal(false);
  };

  const isFatigued = latest && (latest.tingkatKelelahan >= 4 || latest.nyeriOtot >= 4 || latest.kualitasTidur <= 2);

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            Pemantauan Pemulihan & Kebugaran Atlet (Recovery Log)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring kualitas tidur, kelelahan otot, stres akademik, dan pencegahan overtraining
          </p>
        </div>

        <button
          onClick={() => setShowCheckInModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          Isi Kondisi Tubuh (Check-in)
        </button>
      </div>

      {/* Safety Alert (Section 7.F & 20) */}
      {isFatigued ? (
        <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-xs text-amber-200 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-amber-300 font-bold block text-sm">
              PERHATIAN KHUSUS PELATIH: Indikator Kelelahan Tinggi
            </strong>
            <p className="text-slate-300 leading-relaxed">
              Data check-in terbaru atlet {selectedAthlete.namaLengkap} menunjukkan tingkat kelelahan / nyeri otot di atas rata-rata wajar.
              <strong className="text-amber-300"> Jangan otomatis menaikkan volume beban latihan!</strong>
            </p>
            <div className="pt-2 text-slate-300 flex flex-wrap gap-2 text-[11px]">
              <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/30">
                ✓ Anjurkan tidur lebih awal (&gt;8.5 jam)
              </span>
              <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/30">
                ✓ Ubah sesi ke active recovery / stretching santai
              </span>
              <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/30">
                ✓ Komunikasi dengan atlet & orang tua mengenai beban sekolah
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="text-white font-semibold">Status Kebugaran Atlet:</strong>
            <span className="ml-1 text-slate-300">
              Kondisi pemulihan terkini dalam batas normal. Atlet siap menerima program latihan terencana sesuai periodisasi.
            </span>
          </div>
        </div>
      )}

      {/* Current Status Cards */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Durasi & Kualitas Tidur</span>
              <Moon className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono-num text-white">
              {latest.jamTidur} Jam
            </div>
            <span className="text-[11px] text-cyan-400">
              Skor Kualitas: {latest.kualitasTidur}/5
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Tingkat Kelelahan</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono-num text-white">
              {latest.tingkatKelelahan} / 5
            </div>
            <span className="text-[11px] text-slate-400">
              {latest.tingkatKelelahan <= 2 ? 'Ringan / Segar' : latest.tingkatKelelahan === 3 ? 'Moderat' : 'Tinggi / Perlu Istirahat'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Nyeri / Pegal Otot</span>
              <HeartPulse className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold font-mono-num text-white">
              {latest.nyeriOtot} / 5
            </div>
            <span className="text-[11px] text-slate-400">
              {latest.nyeriOtot <= 2 ? 'Minim / Normal' : 'Ada Ketegangan Otot'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Beban Stres Luar Kolam</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono-num text-white">
              {latest.tingkatStres} / 5
            </div>
            <span className="text-[11px] text-slate-400">
              {latest.tingkatStres <= 2 ? 'Terkendali Baik' : 'Ada Tekanan Akademik'}
            </span>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Riwayat Pemantauan Kondisi Tubuh (Wellness Logs)
          </h3>
          <span className="text-xs text-slate-400">{recoveryLogs.length} catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Tidur</th>
                <th className="py-3 px-4">Kelelahan</th>
                <th className="py-3 px-4">Nyeri Otot</th>
                <th className="py-3 px-4">Stres/Sekolah</th>
                <th className="py-3 px-4">Keluhan Fisik</th>
                <th className="py-3 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recoveryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono-num whitespace-nowrap text-white">
                    {log.tanggal}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono-num font-semibold text-cyan-300">{log.jamTidur} Jam</span>{' '}
                    <span className="text-[11px] text-slate-400">({log.kualitasTidur}/5)</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded font-mono-num font-semibold ${
                      log.tingkatKelelahan >= 4 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {log.tingkatKelelahan}/5
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded font-mono-num font-semibold ${
                      log.nyeriOtot >= 4 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {log.nyeriOtot}/5
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                    {log.tingkatStres}/5 {log.bebanSekolahLain ? `(${log.bebanSekolahLain})` : ''}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                    {log.keluhanFisik || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                    {log.catatan || '-'}
                  </td>
                </tr>
              ))}
              {recoveryLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Belum ada catatan pemulihan tersimpan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Check-In */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <h3 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
              Form Check-In Kondisi Tubuh & Pemulihan
            </h3>
            <form onSubmit={handleSaveCheckin} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Durasi Tidur (Jam)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={jamTidur}
                    onChange={(e) => setJamTidur(e.target.value)}
                    placeholder="e.g. 8.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Kualitas Tidur (1-5)</label>
                  <select
                    value={kualitasTidur}
                    onChange={(e) => setKualitasTidur(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="1">1 - Sangat Buruk / Gelisah</option>
                    <option value="2">2 - Kurang Nyenyak</option>
                    <option value="3">3 - Cukup</option>
                    <option value="4">4 - Nyenyak</option>
                    <option value="5">5 - Sangat Optimal & Segar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Tingkat Kelelahan Tubuh (1-5)</label>
                  <select
                    value={tingkatKelelahan}
                    onChange={(e) => setTingkatKelelahan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="1">1 - Bugar / Tidak Lelah</option>
                    <option value="2">2 - Sedikit Lelah Ringan</option>
                    <option value="3">3 - Moderat Wajar</option>
                    <option value="4">4 - Lelah Berat</option>
                    <option value="5">5 - Kelelahan Ekstrem / Habis Energi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Rasa Nyeri / Pegal Otot (1-5)</label>
                  <select
                    value={nyeriOtot}
                    onChange={(e) => setNyeriOtot(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="1">1 - Tidak Ada Nyeri</option>
                    <option value="2">2 - Pegal Ringan Normal</option>
                    <option value="3">3 - Pegal Terasa</option>
                    <option value="4">4 - Nyeri Cukup Mengganggu</option>
                    <option value="5">5 - Nyeri Tajam / Sangat Sakit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Beban Stres / Sekolah (1-5)</label>
                  <select
                    value={tingkatStres}
                    onChange={(e) => setTingkatStres(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="1">1 - Santai / Tenang</option>
                    <option value="2">2 - Tugas Biasa</option>
                    <option value="3">3 - Cukup Padat</option>
                    <option value="4">4 - Padat / Ujian Sekolah</option>
                    <option value="5">5 - Sangat Tertekan / Kurang Waktu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Keluhan Nyeri / Rasa Sakit Tertentu</label>
                <input
                  type="text"
                  placeholder="Contoh: Otot paha pegal setelah latihan kick kemarin..."
                  value={keluhanFisik}
                  onChange={(e) => setKeluhanFisik(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Catatan Tambahan Atlet / Orang Tua</label>
                <textarea
                  rows={2}
                  placeholder="Kondisi asupan makanan, hidrasi, atau persiapan mental..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl"
                >
                  Simpan Kondisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
