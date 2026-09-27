import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { StrokeStyle, TestType, EvaluationItem, SwimResult } from '../../types';
import { X, Sparkles, AlertCircle, Award } from 'lucide-react';

interface AddSwimResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStroke?: StrokeStyle;
  defaultDistance?: string;
}

export const AddSwimResultModal: React.FC<AddSwimResultModalProps> = ({
  isOpen,
  onClose,
  defaultStroke = 'Freestyle',
  defaultDistance = '50 m',
}) => {
  const { data, selectedAthleteId, addSwimResult } = useData();

  const [athleteId, setAthleteId] = useState(selectedAthleteId);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jenisTes, setJenisTes] = useState<TestType>('Time Trial');
  const [jarak, setJarak] = useState(defaultDistance);
  const [customJarak, setCustomJarak] = useState('');
  const [gaya, setGaya] = useState<StrokeStyle>(defaultStroke);
  const [waktu, setWaktu] = useState('');
  const [start, setStart] = useState('');
  const [split, setSplit] = useState('');
  const [strokeRate, setStrokeRate] = useState<string>('');
  const [strokeCount, setStrokeCount] = useState<string>('');
  const [catatanTeknik, setCatatanTeknik] = useState('');
  const [kondisiKolam, setKondisiKolam] = useState('50m LCM');
  const [kondisiAtlet, setKondisiAtlet] = useState('Bugar & Siap');
  const [catatanPelatih, setCatatanPelatih] = useState('');
  const [selectedTeknikKategori, setSelectedTeknikKategori] = useState<string[]>([
    'Start',
    'Streamline',
  ]);

  // Evaluated result popup after submitting
  const [evaluatedModal, setEvaluatedModal] = useState<{
    result: SwimResult;
    evaluation: EvaluationItem;
  } | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    setSelectedTeknikKategori((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waktu.trim()) return;

    const finalJarak = jarak === 'Custom' ? (customJarak ? `${customJarak} m` : '50 m') : jarak;

    const { result, evaluation } = addSwimResult({
      athleteId,
      tanggal,
      jenisTes,
      jarak: finalJarak,
      gaya,
      waktu: waktu.trim(),
      start: start.trim() || undefined,
      split: split.trim() || undefined,
      strokeRate: strokeRate ? parseFloat(strokeRate) : undefined,
      strokeCount: strokeCount ? parseInt(strokeCount, 10) : undefined,
      catatanTeknik: catatanTeknik.trim() || undefined,
      teknikKategori: selectedTeknikKategori as any,
      kondisiKolam,
      kondisiAtlet,
      catatanPelatih: catatanPelatih.trim() || undefined,
    });

    setEvaluatedModal({ result, evaluation });
  };

  const handleFinish = () => {
    setEvaluatedModal(null);
    onClose();
  };

  // If evaluated modal is active, display the Automated Result Analysis popup (Section 5 & 10)
  if (evaluatedModal) {
    const { result, evaluation } = evaluatedModal;
    const isPb = result.isPB;
    const delta = result.selisihSebelumnya ?? 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {isPb ? (
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Award className="w-6 h-6 animate-pulse" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  HASIL EVALUASI OTOMATIS
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {result.jarak} {result.gaya}
                </h3>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comparison Cards */}
          <div className="my-5 grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Waktu Sebelumnya:</span>
              <div className="text-lg font-bold font-mono-num text-slate-300 mt-0.5">
                {result.waktuSebelumnya ? `${result.waktuSebelumnya}s` : 'Data Awal'}
              </div>
            </div>
            <div className={`p-3.5 rounded-xl border ${isPb ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-cyan-950/30 border-cyan-500/40'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Waktu Terbaru:</span>
                {isPb && (
                  <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] rounded uppercase tracking-wider">
                    PB BARU!
                  </span>
                )}
              </div>
              <div className="text-xl font-black font-mono-num text-white mt-0.5">
                {result.waktu}s
              </div>
            </div>
          </div>

          {/* Delta & Supportive Interpretation */}
          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/60 mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Selisih & Perubahan:</span>
              <span className={`font-mono-num font-bold ${delta < 0 ? 'text-emerald-400' : delta > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {delta < 0 ? `${delta.toFixed(2)} detik` : delta > 0 ? `+${delta.toFixed(2)} detik` : '0.00 detik'}
                {result.persentasePerubahan ? ` (${result.persentasePerubahan}%)` : ''}
              </span>
            </div>
            <p className="text-xs text-cyan-200/90 leading-relaxed font-medium">
              "{evaluation.trenStatus}"
            </p>
          </div>

          {/* Next Focuses */}
          <div className="space-y-3 text-xs mb-5">
            <div>
              <span className="font-semibold text-slate-300 block mb-1">Fokus Sesi Berikutnya:</span>
              <ul className="space-y-1">
                {evaluation.fokusBerikutnya.map((fokus, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{fokus}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-semibold text-slate-300 block mb-1">Fokus Pemulihan:</span>
              <div className="text-slate-400 flex flex-wrap gap-1.5">
                {evaluation.fokusPemulihan.map((rec, i) => (
                  <span key={i} className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                    {rec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Safety alert if any */}
          {evaluation.catatanKeamanan && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{evaluation.catatanKeamanan}</span>
            </div>
          )}

          <button
            onClick={handleFinish}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            Selesai & Buka Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              ⏱️
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Catat Hasil Renang / Time Trial</h3>
              <p className="text-xs text-slate-400">
                Sistem akan membandingkan otomatis dengan hasil sebelumnya dan menghitung Personal Best (PB)
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
          {/* Athlete & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Pilih Atlet *</label>
              <select
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                {data.athletes.map((ath) => (
                  <option key={ath.id} value={ath.id}>
                    {ath.namaLengkap} ({ath.kelompokUsia.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tanggal Tes *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Jenis Tes, Gaya & Jarak */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jenis Tes</label>
              <select
                value={jenisTes}
                onChange={(e) => setJenisTes(e.target.value as TestType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Time Trial">Time Trial</option>
                <option value="Latihan">Latihan</option>
                <option value="Kejuaraan">Kejuaraan</option>
                <option value="Evaluasi bulanan">Evaluasi Bulanan</option>
                <option value="Evaluasi program">Evaluasi Program</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gaya Renang *</label>
              <select
                value={gaya}
                onChange={(e) => setGaya(e.target.value as StrokeStyle)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Freestyle">Freestyle (Gaya Bebas)</option>
                <option value="Backstroke">Backstroke (Gaya Punggung)</option>
                <option value="Breaststroke">Breaststroke (Gaya Dada)</option>
                <option value="Butterfly">Butterfly (Gaya Kupu-kupu)</option>
                <option value="Individual Medley">Individual Medley (IM)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jarak *</label>
              <select
                value={jarak}
                onChange={(e) => setJarak(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="25 m">25 m</option>
                <option value="50 m">50 m</option>
                <option value="100 m">100 m</option>
                <option value="200 m">200 m</option>
                <option value="400 m">400 m</option>
                <option value="Custom">Custom Jarak</option>
              </select>
            </div>
          </div>

          {jarak === 'Custom' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Masukkan Jarak Custom (meter)</label>
              <input
                type="number"
                placeholder="Contoh: 150 atau 800"
                value={customJarak}
                onChange={(e) => setCustomJarak(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          {/* Waktu (MM:SS.xx) */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30">
            <label className="block text-cyan-300 font-bold text-sm mb-1">
              Catatan Waktu Renang (Format: MM:SS.xx atau SS.xx) *
            </label>
            <input
              type="text"
              placeholder="Contoh: 26.80 atau 01:02.45"
              value={waktu}
              onChange={(e) => setWaktu(e.target.value)}
              required
              className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg px-4 py-2.5 text-white font-mono-num text-lg font-bold tracking-wide focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Contoh 50m: ketik <span className="text-cyan-400 font-mono-num font-semibold">27.40</span>. Contoh 100m: ketik <span className="text-cyan-400 font-mono-num font-semibold">01:01.30</span>
            </p>
          </div>

          {/* Tambahan: Start, Split, Stroke Rate, Stroke Count */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Start (Reaksi/Breakout)</label>
              <input
                type="text"
                placeholder="e.g. 0.65s, dorongan kuat"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Split Waktu</label>
              <input
                type="text"
                placeholder="e.g. 25m: 13.20s"
                value={split}
                onChange={(e) => setSplit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Stroke Rate (SPM)</label>
              <input
                type="number"
                placeholder="e.g. 48"
                value={strokeRate}
                onChange={(e) => setStrokeRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Stroke Count</label>
              <input
                type="number"
                placeholder="e.g. 31"
                value={strokeCount}
                onChange={(e) => setStrokeCount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Kategori Teknik Grouping (Section 7.E) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Kelompok Pengamatan Teknik (Pilih yang relevan):
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Start',
                'Streamline',
                'Underwater',
                'Stroke technique',
                'Breathing',
                'Turn',
                'Finish',
                'Pacing',
              ].map((cat) => {
                const isSelected = selectedTeknikKategori.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kondisi Kolam & Atlet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Kondisi Kolam</label>
              <select
                value={kondisiKolam}
                onChange={(e) => setKondisiKolam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="50m LCM">50m LCM (Long Course Meter)</option>
                <option value="25m SCM">25m SCM (Short Course Meter)</option>
                <option value="Indoor Heated">Indoor Heated Pool</option>
                <option value="Outdoor">Outdoor Pool</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Kondisi Fisik Atlet</label>
              <input
                type="text"
                placeholder="e.g. Bugar, segar setelah istirahat, sedikit tegang"
                value={kondisiAtlet}
                onChange={(e) => setKondisiAtlet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Catatan Teknik & Pelatih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Catatan Teknik</label>
              <textarea
                rows={2}
                placeholder="Detail kayuhan, ritme nafas, posisi kepala, atau dolphin kick..."
                value={catatanTeknik}
                onChange={(e) => setCatatanTeknik(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Catatan Evaluasi Pelatih</label>
              <textarea
                rows={2}
                placeholder="Arahan untuk sesi latihan berikutnya..."
                value={catatanPelatih}
                onChange={(e) => setCatatanPelatih(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Actions */}
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
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
            >
              Simpan & Analisis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
