import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AgeGroup, StrokeStyle, Athlete } from '../../types';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface AddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteToEdit?: Athlete;
}

export const AddAthleteModal: React.FC<AddAthleteModalProps> = ({
  isOpen,
  onClose,
  athleteToEdit,
}) => {
  const { addAthlete, updateAthlete } = useData();

  const [namaLengkap, setNamaLengkap] = useState(athleteToEdit?.namaLengkap || '');
  const [namaPanggilan, setNamaPanggilan] = useState(athleteToEdit?.namaPanggilan || '');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>(athleteToEdit?.jenisKelamin || 'L');
  const [tanggalLahir, setTanggalLahir] = useState(athleteToEdit?.tanggalLahir || '2012-05-15');
  const [kelompokUsia, setKelompokUsia] = useState<AgeGroup>(athleteToEdit?.kelompokUsia || 'KU III (12-13 th)');
  const [klub, setKlub] = useState(athleteToEdit?.klub || 'Tirta Kencana SC');
  const [pelatih, setPelatih] = useState(athleteToEdit?.pelatih || 'Coach Hendra Wijaya');
  const [tanggalMulaiLatihan, setTanggalMulaiLatihan] = useState(athleteToEdit?.tanggalMulaiLatihan || '2021-01-10');
  const [tinggiBadan, setTinggiBadan] = useState<string>(athleteToEdit?.tinggiBadan ? String(athleteToEdit.tinggiBadan) : '');
  const [beratBadan, setBeratBadan] = useState<string>(athleteToEdit?.beratBadan ? String(athleteToEdit.beratBadan) : '');
  const [gayaUtama, setGayaUtama] = useState<StrokeStyle>(athleteToEdit?.gayaUtama || 'Freestyle');
  const [nomorUtama, setNomorUtama] = useState(athleteToEdit?.nomorUtama || '50 m Freestyle');
  const [nomorTambahan, setNomorTambahan] = useState(athleteToEdit?.nomorTambahan || '100 m Freestyle');
  const [catatanKhusus, setCatatanKhusus] = useState(athleteToEdit?.catatanKhusus || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim()) return;

    if (athleteToEdit) {
      updateAthlete({
        ...athleteToEdit,
        namaLengkap,
        namaPanggilan: namaPanggilan || namaLengkap.split(' ')[0],
        jenisKelamin,
        tanggalLahir,
        kelompokUsia,
        klub,
        pelatih,
        tanggalMulaiLatihan,
        tinggiBadan: tinggiBadan ? parseFloat(tinggiBadan) : undefined,
        beratBadan: beratBadan ? parseFloat(beratBadan) : undefined,
        gayaUtama,
        nomorUtama,
        nomorTambahan,
        catatanKhusus,
      });
    } else {
      addAthlete({
        namaLengkap,
        namaPanggilan: namaPanggilan || namaLengkap.split(' ')[0],
        jenisKelamin,
        tanggalLahir,
        kelompokUsia,
        klub,
        pelatih,
        tanggalMulaiLatihan,
        tinggiBadan: tinggiBadan ? parseFloat(tinggiBadan) : undefined,
        beratBadan: beratBadan ? parseFloat(beratBadan) : undefined,
        gayaUtama,
        nomorUtama,
        nomorTambahan,
        catatanKhusus,
        avatarColor: 'from-cyan-500 to-blue-600',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {athleteToEdit ? 'Edit Profil Atlet' : 'Tambah Profil Atlet Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Pencatatan data atlet untuk pemantauan program jangka panjang
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
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Contoh: Bima Satria Wicaksana"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nama Panggilan</label>
              <input
                type="text"
                value={namaPanggilan}
                onChange={(e) => setNamaPanggilan(e.target.value)}
                placeholder="Contoh: Bima"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jenis Kelamin</label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as 'L' | 'P')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="L">Laki-laki (Putra)</option>
                <option value="P">Perempuan (Putri)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Kelompok Usia</label>
              <select
                value={kelompokUsia}
                onChange={(e) => setKelompokUsia(e.target.value as AgeGroup)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="KU IV (10-11 th)">KU IV (10-11 th)</option>
                <option value="KU III (12-13 th)">KU III (12-13 th)</option>
                <option value="KU II (14-15 th)">KU II (14-15 th)</option>
                <option value="KU I (16-18 th)">KU I (16-18 th)</option>
                <option value="Senior (>18 th)">Senior (&gt;18 th)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Klub Renang</label>
              <input
                type="text"
                value={klub}
                onChange={(e) => setKlub(e.target.value)}
                placeholder="Nama Klub"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Pelatih Utama</label>
              <input
                type="text"
                value={pelatih}
                onChange={(e) => setPelatih(e.target.value)}
                placeholder="Nama Pelatih"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mulai Latihan</label>
              <input
                type="date"
                value={tanggalMulaiLatihan}
                onChange={(e) => setTanggalMulaiLatihan(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Physical Data without comparisons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tinggi Badan (cm)</label>
              <input
                type="number"
                value={tinggiBadan}
                onChange={(e) => setTinggiBadan(e.target.value)}
                placeholder="e.g. 170"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Berat Badan (kg)</label>
              <input
                type="number"
                value={beratBadan}
                onChange={(e) => setBeratBadan(e.target.value)}
                placeholder="e.g. 60"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gaya Utama</label>
              <select
                value={gayaUtama}
                onChange={(e) => setGayaUtama(e.target.value as StrokeStyle)}
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
              <label className="block text-slate-300 font-semibold mb-1">Nomor Lomba Utama</label>
              <input
                type="text"
                value={nomorUtama}
                onChange={(e) => setNomorUtama(e.target.value)}
                placeholder="e.g. 50 m Freestyle"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nomor Tambahan</label>
              <input
                type="text"
                value={nomorTambahan}
                onChange={(e) => setNomorTambahan(e.target.value)}
                placeholder="e.g. 100m Free, 50m Fly"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Catatan Khusus Perkembangan</label>
            <textarea
              rows={2}
              value={catatanKhusus}
              onChange={(e) => setCatatanKhusus(e.target.value)}
              placeholder="Catatan teknik, fisiologi renang, atau riwayat cedera bila ada..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Ethics statement reminder */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Sistem mematuhi prinsip anti-body shaming: data tinggi & berat hanya digunakan untuk pemantauan pertumbuhan pribadi, tanpa membandingkan fisik antar atlet.
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
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {athleteToEdit ? 'Simpan Perubahan' : 'Tambah Atlet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
