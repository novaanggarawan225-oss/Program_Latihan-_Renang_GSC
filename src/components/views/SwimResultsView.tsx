import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { SwimResult, StrokeStyle, TestType } from '../../types';
import { formatTimeDifference } from '../../utils/timeFormat';
import { Timer, PlusCircle, Search, Filter, Trash2, Award, Calendar, CheckCircle } from 'lucide-react';

interface SwimResultsViewProps {
  onOpenAddResult: () => void;
}

export const SwimResultsView: React.FC<SwimResultsViewProps> = ({ onOpenAddResult }) => {
  const { data, selectedAthleteId, deleteSwimResult, currentRole } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGaya, setFilterGaya] = useState<string>('All');
  const [filterJarak, setFilterJarak] = useState<string>('All');
  const [filterJenisTes, setFilterJenisTes] = useState<string>('All');
  const [filterTahun, setFilterTahun] = useState<string>('All');
  const [selectedResultDetail, setSelectedResultDetail] = useState<SwimResult | null>(null);

  // Filter for selected athlete
  const results = data.swim_results.filter((r) => r.athleteId === selectedAthleteId);

  const filtered = results.filter((r) => {
    if (filterGaya !== 'All' && r.gaya !== filterGaya) return false;
    if (filterJarak !== 'All' && r.jarak !== filterJarak) return false;
    if (filterJenisTes !== 'All' && r.jenisTes !== filterJenisTes) return false;
    if (filterTahun !== 'All' && !r.tanggal.startsWith(filterTahun)) return false;
    if (searchTerm) {
      const matchText = `${r.gaya} ${r.jarak} ${r.catatanTeknik || ''} ${r.catatanPelatih || ''} ${r.waktu}`.toLowerCase();
      if (!matchText.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-cyan-400" />
            Pencatatan & Riwayat Hasil Renang
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar lengkap waktu latihan, time trial, evaluasi program, dan kejuaraan resmi
          </p>
        </div>

        <button
          onClick={onOpenAddResult}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          Catat Hasil Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari catatan, split, atau nomor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Gaya */}
          <select
            value={filterGaya}
            onChange={(e) => setFilterGaya(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="All">Semua Gaya</option>
            <option value="Freestyle">Freestyle</option>
            <option value="Backstroke">Backstroke</option>
            <option value="Breaststroke">Breaststroke</option>
            <option value="Butterfly">Butterfly</option>
            <option value="Individual Medley">Individual Medley</option>
          </select>

          {/* Jarak */}
          <select
            value={filterJarak}
            onChange={(e) => setFilterJarak(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="All">Semua Jarak</option>
            <option value="25 m">25 m</option>
            <option value="50 m">50 m</option>
            <option value="100 m">100 m</option>
            <option value="200 m">200 m</option>
            <option value="400 m">400 m</option>
          </select>

          {/* Jenis Tes */}
          <select
            value={filterJenisTes}
            onChange={(e) => setFilterJenisTes(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="All">Semua Jenis Tes</option>
            <option value="Time Trial">Time Trial</option>
            <option value="Latihan">Latihan</option>
            <option value="Kejuaraan">Kejuaraan</option>
            <option value="Evaluasi bulanan">Evaluasi Bulanan</option>
            <option value="Evaluasi program">Evaluasi Program</option>
          </select>

          {/* Tahun */}
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="All">Semua Tahun</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Results Table (Section 15) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Jenis Tes</th>
                <th className="py-3.5 px-4">Jarak</th>
                <th className="py-3.5 px-4">Gaya</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Status PB</th>
                <th className="py-3.5 px-4">Selisih</th>
                <th className="py-3.5 px-4">Catatan Teknik</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filtered.map((item) => {
                const diff = item.selisihSebelumnya ?? 0;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedResultDetail(item)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono-num whitespace-nowrap text-slate-300">
                      {item.tanggal}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-cyan-300 font-medium border border-slate-700">
                        {item.jenisTes}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {item.jarak}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.gaya}
                    </td>
                    <td className="py-3 px-4 font-mono-num font-bold text-sm text-white whitespace-nowrap">
                      {item.waktu}s
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.isPB ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                          <Award className="w-3 h-3" /> PB BARU
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono-num font-medium whitespace-nowrap">
                      {diff < 0 ? (
                        <span className="text-emerald-400 font-semibold">{diff.toFixed(2)}s</span>
                      ) : diff > 0 ? (
                        <span className="text-amber-400 font-semibold">+{diff.toFixed(2)}s</span>
                      ) : (
                        <span className="text-slate-500">0.00s</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                      {item.catatanTeknik || item.catatanPelatih || '-'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {currentRole === 'coach' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Hapus catatan waktu ini?')) {
                              deleteSwimResult(item.id);
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Tidak ada hasil waktu yang cocok dengan filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Detail Modal */}
      {selectedResultDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Detail Catatan Waktu
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedResultDetail.jarak} {selectedResultDetail.gaya}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResultDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px]">Waktu:</span>
                  <div className="text-2xl font-mono-num font-black text-white">
                    {selectedResultDetail.waktu} detik
                  </div>
                </div>
                {selectedResultDetail.isPB && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    PERSONAL BEST
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Tanggal: <strong className="text-white">{selectedResultDetail.tanggal}</strong></div>
                <div>Jenis Tes: <strong className="text-cyan-300">{selectedResultDetail.jenisTes}</strong></div>
                <div>Kolam: <strong className="text-white">{selectedResultDetail.kondisiKolam || 'LCM 50m'}</strong></div>
                <div>Kondisi Atlet: <strong className="text-white">{selectedResultDetail.kondisiAtlet || 'Normal'}</strong></div>
                {selectedResultDetail.strokeRate && <div>Stroke Rate: <strong className="font-mono-num text-white">{selectedResultDetail.strokeRate} SPM</strong></div>}
                {selectedResultDetail.strokeCount && <div>Stroke Count: <strong className="font-mono-num text-white">{selectedResultDetail.strokeCount}</strong></div>}
              </div>

              {selectedResultDetail.split && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Split Waktu:</span>
                  <span className="font-mono-num text-slate-200">{selectedResultDetail.split}</span>
                </div>
              )}

              {selectedResultDetail.start && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Start & Breakout:</span>
                  <span className="text-slate-200">{selectedResultDetail.start}</span>
                </div>
              )}

              {selectedResultDetail.catatanTeknik && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Catatan Teknik:</span>
                  <span className="text-slate-200">{selectedResultDetail.catatanTeknik}</span>
                </div>
              )}

              {selectedResultDetail.catatanPelatih && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-cyan-400 font-semibold block mb-0.5">Evaluasi Pelatih:</span>
                  <span className="text-slate-200">{selectedResultDetail.catatanPelatih}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedResultDetail(null)}
              className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
