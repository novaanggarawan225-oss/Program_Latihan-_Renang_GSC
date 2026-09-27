import React, { useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { data, resetToDemoData, exportDatabaseJSON, importDatabaseJSON, currentRole, setCurrentRole } = useData();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swim_performance_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        setImportStatus('Database berhasil dipulihkan dari file backup!');
      } else {
        setImportStatus('Gagal memulihkan database. Format JSON tidak sesuai struktur.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Pengaturan Aplikasi & Manajemen Database
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Penyimpanan data jangka panjang, backup/restore JSON, dan prinsip keselamatan atlet
        </p>
      </div>

      {/* Role Switching Settings Card (Section 2) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Tipe Akun Pengguna Aktif
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Aplikasi menyediakan 2 mode akun: Admin/Pelatih (akses penuh untuk membuat program & evaluasi) dan Atlet (melihat rekor, program, dan mengisi check-in pemulihan).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentRole('coach')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              currentRole === 'coach'
                ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-white text-sm">Mode Admin / Pelatih</span>
              {currentRole === 'coach' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400">
              Dapat menambah atlet, input hasil time trial, membuat & mengubah program latihan renang/fisik, dan menyetujui program.
            </p>
          </button>

          <button
            onClick={() => setCurrentRole('athlete')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              currentRole === 'athlete'
                ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-white text-sm">Mode Atlet / Perenang</span>
              {currentRole === 'athlete' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-400">
              Dapat melihat grafik perkembangan sendiri, program latihan, target waktu, dan mengisi catatan kondisi tubuh harian (check-in recovery).
            </p>
          </button>
        </div>
      </div>

      {/* Database Status & Entities (Section 14) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          Status Database Penyimpanan Jangka Panjang
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Tersimpan aman pada browser (LocalStorage) dan terintegrasi otomatis dengan server backend file storage (`/data/swim_tracker_db.json`).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs mb-6">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">athletes</span>
            <span className="font-mono-num font-bold text-lg text-white">
              {data.athletes.length} record
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">swim_results</span>
            <span className="font-mono-num font-bold text-lg text-cyan-400">
              {data.swim_results.length} record
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">training_logs</span>
            <span className="font-mono-num font-bold text-lg text-emerald-400">
              {data.training_logs.length} record
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">swim_programs</span>
            <span className="font-mono-num font-bold text-lg text-blue-400">
              {data.swim_programs.length} record
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">physical_programs</span>
            <span className="font-mono-num font-bold text-lg text-purple-400">
              {data.physical_programs.length} record
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">targets</span>
            <span className="font-mono-num font-bold text-lg text-amber-400">
              {data.targets.length} record
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">evaluations</span>
            <span className="font-mono-num font-bold text-lg text-teal-400">
              {data.evaluations.length} record
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">recovery_logs</span>
            <span className="font-mono-num font-bold text-lg text-rose-400">
              {data.recovery_logs.length} record
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">users</span>
            <span className="font-mono-num font-bold text-lg text-slate-300">
              {data.users.length} user
            </span>
          </div>
        </div>

        {/* Backup & Restore Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleDownloadJSON}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Download Backup JSON
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Pulihkan dari File JSON
          </button>

          <button
            onClick={() => {
              if (confirm('Kembalikan semua data ke setelan demo awal? Semua modifikasi buatan akan digantikan dengan data sampel atlet Tirta Kencana SC.')) {
                resetToDemoData();
              }
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Reset ke Data Sampel Awal
          </button>
        </div>

        {importStatus && (
          <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300">
            {importStatus}
          </div>
        )}
      </div>

      {/* Safety & Ethical Principles (Section 20) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Prinsip Keselamatan & Etika Pembinaan Renang (Section 20)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Aplikasi SWIM PERFORMANCE & TRAINING TRACKER dibangun secara ketat berdasarkan prinsip keselamatan atlet muda dan kode etik kepelatihan modern:
        </p>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <li className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
            <span className="text-cyan-400 font-bold">1.</span>
            <span><strong>Anti-Body Shaming:</strong> Data tinggi dan berat badan murni untuk pemantauan pertumbuhan pribadi, tanpa penilaian bentuk fisik atau komparasi antar atlet.</span>
          </li>
          <li className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
            <span className="text-cyan-400 font-bold">2.</span>
            <span><strong>Keselamatan Atlet Muda:</strong> Tidak menganjurkan angkat beban ekstrem untuk anak/remaja. Hentikan latihan jika atlet mengeluh nyeri/sakit.</span>
          </li>
          <li className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
            <span className="text-cyan-400 font-bold">3.</span>
            <span><strong>Komunikasi Holistik:</strong> Penurunan performa diinvestigasi dari kualitas tidur, recovery, dan beban sekolah sebelum mengubah beban sesi.</span>
          </li>
          <li className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
            <span className="text-cyan-400 font-bold">4.</span>
            <span><strong>Otoritas Pelatih:</strong> AI Coach dan rekomendasi sistem hanya berfungsi sebagai alat bantu; keputusan akhir selalu berada di tangan pelatih.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
