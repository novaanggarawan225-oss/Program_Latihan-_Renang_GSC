import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { ActiveTab } from '../Navigation';
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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Award,
  Calendar,
  Activity,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddResult: () => void;
  onOpenAddTraining: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddResult,
  onOpenAddTraining,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { data, selectedAthleteId, setSelectedAthleteId, currentRole, setCurrentRole, selectedAthlete } = useData();

  // Navigation items categorized
  const navCategories = [
    {
      group: 'Utama & Analisis',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, badge: null },
        { id: 'athletes', label: 'Daftar Atlet', icon: Users, badge: `${data.athletes.length}` },
        { id: 'results', label: 'Hasil Renang', icon: Timer, badge: `${data.swim_results.length}` },
        { id: 'analysis', label: 'Analisis & AI', icon: LineChart, badge: 'AI' },
        { id: 'compare', label: 'Komparasi Atlet', icon: ArrowRightLeft, badge: 'H2H' },
      ],
    },
    {
      group: 'Program & Latihan',
      items: [
        { id: 'swim_programs', label: 'Program Renang', icon: Waves, badge: `${data.swim_programs.length}` },
        { id: 'physical_programs', label: 'Program Fisik', icon: Dumbbell, badge: null },
        { id: 'targets', label: 'Target Waktu', icon: Target, badge: `${data.targets.length}` },
      ],
    },
    {
      group: 'Monitoring & Riwayat',
      items: [
        { id: 'recovery', label: 'Recovery & Kondisi', icon: HeartPulse, badge: null },
        { id: 'training_logs', label: 'Log Latihan', icon: ClipboardList, badge: `${data.training_logs.length}` },
        { id: 'reports', label: 'Laporan & Ekspor', icon: FileSpreadsheet, badge: 'PDF' },
        { id: 'settings', label: 'Pengaturan', icon: Settings, badge: null },
      ],
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-950 border-r border-slate-800/90 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-72 shadow-2xl`}
      >
        {/* Sidebar Header with Brand */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-xl tracking-tighter shrink-0">
              ST
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black tracking-tight text-white whitespace-nowrap">
                    SWIM TRACKER
                  </h1>
                </div>
                <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                  Coach & Athlete Pro
                </p>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Swimmer Quick Card (when expanded) */}
        {(!isCollapsed || isMobileOpen) && selectedAthlete && (
          <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800/90 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Atlet Terpilih
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                {selectedAthlete.kelompokUsia.split(' ')[0]}
              </span>
            </div>

            <select
              value={selectedAthleteId}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer mb-2"
            >
              {data.athletes.map((ath) => (
                <option key={ath.id} value={ath.id} className="bg-slate-900 text-white">
                  {ath.namaLengkap} ({ath.namaPanggilan})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span className="truncate">Gaya: <strong className="text-white font-medium">{selectedAthlete.nomorUtama}</strong></span>
              <span className="truncate text-cyan-400 font-medium">{selectedAthlete.klub}</span>
            </div>
          </div>
        )}

        {/* Compact Swimmer Avatar when collapsed */}
        {isCollapsed && !isMobileOpen && selectedAthlete && (
          <div className="p-2 flex flex-col items-center border-b border-slate-800/80 shrink-0">
            <div
              title={`${selectedAthlete.namaLengkap} (${selectedAthlete.klub})`}
              className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 text-sm shadow-sm cursor-pointer hover:border-cyan-400 transition-colors"
            >
              {selectedAthlete.namaPanggilan.charAt(0)}
            </div>
          </div>
        )}

        {/* Navigation Links Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {navCategories.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id as ActiveTab)}
                    title={isCollapsed && !isMobileOpen ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between px-3'
                    } py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/40 shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                      {(!isCollapsed || isMobileOpen) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {(!isCollapsed || isMobileOpen) && item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Quick Actions (Catat Hasil & Catat Latihan) */}
        {(!isCollapsed || isMobileOpen) ? (
          <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0 bg-slate-950/60">
            <button
              onClick={onOpenAddResult}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Catat Hasil Renang</span>
            </button>
            <button
              onClick={onOpenAddTraining}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
              <span>Log Latihan Harian</span>
            </button>
          </div>
        ) : (
          <div className="p-2 border-t border-slate-800/80 flex flex-col gap-2 shrink-0 items-center">
            <button
              onClick={onOpenAddResult}
              title="Catat Hasil Renang"
              className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105"
            >
              <PlusCircle className="w-5 h-5 text-slate-950" />
            </button>
          </div>
        )}

        {/* User Role Switcher & Collapse Toggle Footer */}
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center justify-between w-full">
              {/* Role Toggle */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setCurrentRole('coach')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    currentRole === 'coach'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Pelatih</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentRole('athlete')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    currentRole === 'athlete'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Atlet</span>
                </button>
              </div>

              {/* Collapse button for desktop */}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title="Ciutkan Sidebar"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title="Bentangkan Sidebar"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-cyan-400" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
