import React from 'react';
import { useData } from '../context/DataContext';
import {
  Home,
  Users,
  Timer,
  LineChart,
  Waves,
  Dumbbell,
  HeartPulse,
  Target,
  ClipboardList,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  UserCheck,
  PlusCircle,
  ArrowRightLeft,
  Menu,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'athletes'
  | 'results'
  | 'analysis'
  | 'compare'
  | 'swim_programs'
  | 'physical_programs'
  | 'recovery'
  | 'targets'
  | 'training_logs'
  | 'reports'
  | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddResult: () => void;
  onToggleSidebar?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddResult,
  onToggleSidebar,
}) => {
  const { data, selectedAthleteId, setSelectedAthleteId, currentRole, setCurrentRole, selectedAthlete } = useData();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'athletes', label: 'Atlet', icon: Users },
    { id: 'results', label: 'Hasil Renang', icon: Timer },
    { id: 'analysis', label: 'Analisis', icon: LineChart },
    { id: 'compare', label: 'Komparasi', icon: ArrowRightLeft },
    { id: 'swim_programs', label: 'Program Renang', icon: Waves },
    { id: 'physical_programs', label: 'Program Fisik', icon: Dumbbell },
    { id: 'recovery', label: 'Recovery', icon: HeartPulse },
    { id: 'targets', label: 'Target', icon: Target },
    { id: 'training_logs', label: 'Log Latihan', icon: ClipboardList },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 no-print">
      {/* Top Bar with Brand, Athlete Selector & Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Sidebar Toggle & Brand */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                title="Buka / Tutup Sidebar"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5 text-cyan-400" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-xl tracking-tighter shrink-0">
              ST
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  SWIM TRACKER
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Performance & Training
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sistem Analisis Waktu & Rekomendasi Latihan Renang
              </p>
            </div>
          </div>

          {/* Quick Athlete Switcher & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Swimmer Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 hidden md:inline font-medium">Atlet:</span>
              <select
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-3"
              >
                {data.athletes.map((ath) => (
                  <option key={ath.id} value={ath.id} className="bg-slate-900 text-white">
                    {ath.namaPanggilan} ({ath.kelompokUsia.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setCurrentRole('coach')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentRole === 'coach'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Pelatih (Akses Penuh)"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Pelatih</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentRole('athlete')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentRole === 'athlete'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Atlet (Lihat Target, Program & Isi Kondisi)"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Atlet</span>
              </button>
            </div>

            {/* Quick Action: Catat Time Trial */}
            <button
              onClick={onOpenAddResult}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Catat Hasil</span>
            </button>
          </div>
        </div>

        {/* Selected Swimmer Quick Ribbon (Banner) */}
        {selectedAthlete && (
          <div className="py-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sedang dipantau:</span>
              <strong className="text-white font-semibold">{selectedAthlete.namaLengkap}</strong>
              <span className="text-slate-400">• {selectedAthlete.klub}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-400 font-mono-num font-semibold">
                {selectedAthlete.kelompokUsia}
              </span>
            </div>
            <div className="text-slate-400 flex items-center gap-3 text-[11px]">
              <span>Nomor Utama: <strong className="text-cyan-300">{selectedAthlete.nomorUtama}</strong></span>
              <span>Pelatih: <span className="text-slate-300">{selectedAthlete.pelatih}</span></span>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-900">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
