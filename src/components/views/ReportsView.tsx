import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { FileSpreadsheet, Printer, Download, Calendar, Award, CheckCircle, Waves, Dumbbell } from 'lucide-react';
import { formatSecondsToTime } from '../../utils/timeFormat';

export const ReportsView: React.FC = () => {
  const { selectedAthlete, selectedAthleteId, data } = useData();

  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');

  if (!selectedAthlete) return null;

  // Filter athlete data
  const results = data.swim_results.filter((r) => r.athleteId === selectedAthleteId);
  const trainingLogs = data.training_logs.filter((t) => t.athleteId === selectedAthleteId);
  const recoveryLogs = data.recovery_logs.filter((r) => r.athleteId === selectedAthleteId);
  const targets = data.targets.filter((t) => t.athleteId === selectedAthleteId);
  const evaluations = data.evaluations.filter((e) => e.athleteId === selectedAthleteId);

  // Time window calculations
  const now = new Date();
  const daysLimit = reportType === 'weekly' ? 7 : 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysLimit);

  const periodResults = results.filter((r) => new Date(r.tanggal) >= cutoffDate);
  const periodLogs = trainingLogs.filter((t) => new Date(t.tanggal) >= cutoffDate);
  const periodRecovery = recoveryLogs.filter((r) => new Date(r.tanggal) >= cutoffDate);

  const swimLogs = periodLogs.filter((l) => l.jenisLatihan === 'Renang');
  const totalVolume = swimLogs.reduce((acc, l) => acc + (l.volumeMeter || 0), 0);
  const physicalCount = periodLogs.filter((l) => l.jenisLatihan === 'Fisik').length;
  const pbsInPeriod = periodResults.filter((r) => r.isPB);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    let csv = `LAPORAN PERFORMA ATLET RENANG\n`;
    csv += `Nama Atlet,${selectedAthlete.namaLengkap}\n`;
    csv += `Klub,${selectedAthlete.klub}\n`;
    csv += `Kelompok Usia,${selectedAthlete.kelompokUsia}\n`;
    csv += `Pelatih,${selectedAthlete.pelatih}\n`;
    csv += `Periode,${reportType === 'weekly' ? 'Laporan 7 Hari Terakhir' : 'Laporan 30 Hari Terakhir'}\n\n`;

    csv += `RIWAYAT HASIL TES RENANG\n`;
    csv += `Tanggal,Jenis Tes,Jarak,Gaya,Waktu (detik),PB,Selisih,Catatan Teknik\n`;
    results.forEach((r) => {
      csv += `"${r.tanggal}","${r.jenisTes}","${r.jarak}","${r.gaya}","${r.waktu}","${r.isPB ? 'PB BARU' : '-'}","${r.selisihSebelumnya ?? 0}","${(r.catatanTeknik || '').replace(/"/g, '""')}"\n`;
    });

    csv += `\nLOG LATIHAN\n`;
    csv += `Tanggal,Jenis,Durasi (menit),Volume (m),RPE,Kelelahan,Catatan\n`;
    trainingLogs.forEach((t) => {
      csv += `"${t.tanggal}","${t.jenisLatihan}","${t.durasiMenit}","${t.volumeMeter}","${t.rpe}","${t.kelelahanSetelah}","${(t.catatan || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Renang_${selectedAthlete.namaPanggilan}_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Laporan Evaluasi & Ekspor Data
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ekspor rekapitulasi progres latihan dan performa kompetisi ke format PDF cetak atau Excel/CSV
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex text-xs">
            <button
              onClick={() => setReportType('weekly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                reportType === 'weekly' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Laporan Mingguan
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                reportType === 'monthly' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Laporan Bulanan
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-cyan-500/30 transition-all cursor-pointer"
            title="Download CSV/Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor Excel/CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            title="Cetak atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card (Section 16) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl print-card text-slate-100">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                SWIM PERFORMANCE & TRAINING TRACKER
              </span>
              <h1 className="text-2xl font-black text-white mt-1">
                {reportType === 'weekly' ? 'LAPORAN EVALUASI MINGGUAN' : 'LAPORAN EVALUASI BULANAN'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Periode: {cutoffDate.toISOString().split('T')[0]} s/d {now.toISOString().split('T')[0]}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Klub: <strong className="text-white">{selectedAthlete.klub}</strong></div>
              <div>Pelatih: <strong className="text-white">{selectedAthlete.pelatih}</strong></div>
            </div>
          </div>

          {/* Swimmer Profile Ribbon */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Nama Atlet:</span>
              <strong className="text-white text-sm">{selectedAthlete.namaLengkap}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Kelompok Usia:</span>
              <strong className="text-white">{selectedAthlete.kelompokUsia}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Nomor Utama:</span>
              <strong className="text-cyan-300">{selectedAthlete.nomorUtama}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tanggal Cetak:</span>
              <span className="text-slate-200">{now.toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Summary Highlights Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Sesi Renang</span>
            <div className="text-2xl font-bold font-mono-num text-white mt-1">
              {swimLogs.length} Sesi
            </div>
            <span className="text-[11px] text-cyan-400 font-mono-num">
              Total {totalVolume.toLocaleString()} meter
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Latihan Fisik</span>
            <div className="text-2xl font-bold font-mono-num text-white mt-1">
              {physicalCount} Sesi
            </div>
            <span className="text-[11px] text-purple-300">Dryland & Core</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">Hasil Time Trial</span>
            <div className="text-2xl font-bold font-mono-num text-white mt-1">
              {periodResults.length} Kali
            </div>
            <span className="text-[11px] text-slate-400">Pengujian Resmi</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-emerald-400 block font-semibold">PB Baru Tercapai</span>
            <div className="text-2xl font-black font-mono-num text-emerald-400 mt-1">
              {pbsInPeriod.length} Rekor
            </div>
            <span className="text-[11px] text-emerald-300">Rekor Personal</span>
          </div>
        </div>

        {/* Section A: Hasil Time Trial pada Periode Ini */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Hasil Catatan Waktu & Rekor Personal (PB)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-lg">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Jenis Tes</th>
                  <th className="py-2.5 px-3">Nomor</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Catatan Teknik & Pelatih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {periodResults.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 px-3 font-mono-num">{r.tanggal}</td>
                    <td className="py-2 px-3">{r.jenisTes}</td>
                    <td className="py-2 px-3 font-medium text-white">{r.jarak} {r.gaya}</td>
                    <td className="py-2 px-3 font-mono-num font-bold text-white">{r.waktu}s</td>
                    <td className="py-2 px-3">
                      {r.isPB ? (
                        <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          PB BARU
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {r.selisihSebelumnya ? `${r.selisihSebelumnya > 0 ? '+' : ''}${r.selisihSebelumnya}s` : 'Stabil'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {r.catatanTeknik || r.catatanPelatih || '-'}
                    </td>
                  </tr>
                ))}
                {periodResults.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500">
                      Tidak ada tes pada periode ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section B: Evaluasi Pelatih & Fokus Bulan Berikutnya */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="font-bold text-cyan-300 uppercase tracking-wider text-[11px] mb-2">
              Evaluasi Performa & Kondisi Atlet
            </h4>
            <p className="text-slate-300 leading-relaxed">
              {evaluations[0]
                ? evaluations[0].trenStatus
                : 'Performa atlet menunjukkan ritme konsistensi yang baik. Volume latihan berjalan sesuai jadwal program tanpa keluhan cedera.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="font-bold text-emerald-300 uppercase tracking-wider text-[11px] mb-2">
              Fokus Latihan Periode Berikutnya
            </h4>
            <ul className="space-y-1 text-slate-300">
              {evaluations[0]?.fokusBerikutnya ? (
                evaluations[0].fokusBerikutnya.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-center gap-1.5">• Efisiensi dorongan dinding & streamline 15 meter awal</li>
                  <li className="flex items-center gap-1.5">• Pacing stabil pada 25 meter kedua</li>
                  <li className="flex items-center gap-1.5">• Latihan mobilitas sendi bahu teratur</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 border-t border-slate-800 grid grid-cols-2 text-center text-xs text-slate-400 mt-8">
          <div>
            <span className="block mb-12">Mengetahui Orang Tua / Atlet</span>
            <div className="font-bold text-white uppercase tracking-wider">
              ( {selectedAthlete.namaLengkap} )
            </div>
          </div>
          <div>
            <span className="block mb-12">Pelatih Kepala</span>
            <div className="font-bold text-white uppercase tracking-wider">
              ( {selectedAthlete.pelatih} )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
