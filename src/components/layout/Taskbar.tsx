import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { ActiveTab } from '../Navigation';
import { formatSecondsToTime } from '../../utils/timeFormat';
import {
  Home,
  Timer,
  LineChart,
  ArrowRightLeft,
  Waves,
  ClipboardList,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Clock,
  Menu,
  ChevronUp,
  X,
  Target,
  ShieldCheck,
  UserCheck,
  Zap,
} from 'lucide-react';

interface TaskbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddResult: () => void;
  onOpenAddTraining: () => void;
  onOpenAddTarget?: () => void;
  onToggleSidebar: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddResult,
  onOpenAddTraining,
  onOpenAddTarget,
  onToggleSidebar,
}) => {
  const { data, selectedAthlete, selectedAthleteId, setSelectedAthleteId, currentRole } = useData();

  // Quick Action Menu Popup state
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  // Digital Clock state
  const [currentTime, setCurrentTime] = useState<string>('');

  // Built-in Coach Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState<number>(0); // in milliseconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isStopwatchExpanded, setIsStopwatchExpanded] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Update real-time clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stopwatch interval handler
  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now() - stopwatchTime;
      timerRef.current = setInterval(() => {
        setStopwatchTime(Date.now() - startTime);
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (stopwatchTime > 0) {
      setLaps([stopwatchTime, ...laps]);
    }
  };

  // Format milliseconds into MM:SS.xx
  const formatStopwatch = (ms: number) => {
    const totalSeconds = ms / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  // Taskbar primary quick dock icons
  const dockItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'results', label: 'Hasil', icon: Timer },
    { id: 'analysis', label: 'Analisis', icon: LineChart },
    { id: 'compare', label: 'Komparasi', icon: ArrowRightLeft },
    { id: 'swim_programs', label: 'Program', icon: Waves },
    { id: 'training_logs', label: 'Log', icon: ClipboardList },
  ];

  return (
    <>
      {/* Quick Action Flyout Menu */}
      {isQuickMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs no-print"
          onClick={() => setIsQuickMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-18 left-1/2 -translate-x-1/2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Pintasan Cepat Pelatih
              </span>
              <button
                onClick={() => setIsQuickMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenAddResult();
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold p-3 rounded-xl text-xs flex items-center gap-3 transition-transform hover:scale-[1.02] cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <div className="p-2 rounded-lg bg-slate-950/20 text-slate-950">
                  <Timer className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-black">Catat Hasil Time Trial</div>
                  <div className="text-[10px] text-slate-900 font-medium">
                    Input hasil renang 25m - 400m dengan analisis otomatis
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenAddTraining();
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-white font-semibold p-3 rounded-xl text-xs flex items-center gap-3 transition-colors border border-slate-700 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Log Latihan Harian</div>
                  <div className="text-[10px] text-slate-400">
                    Catat volume air, durasi, dan RPE atlet
                  </div>
                </div>
              </button>

              {onOpenAddTarget && (
                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    onOpenAddTarget();
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-white font-semibold p-3 rounded-xl text-xs flex items-center gap-3 transition-colors border border-slate-700 cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Pasang Target Waktu</div>
                    <div className="text-[10px] text-slate-400">
                      Rancang target 4, 8, atau 12 minggu ke depan
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Stopwatch Tool Modal / Popover */}
      {isStopwatchExpanded && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs no-print flex items-end sm:items-center justify-center p-4"
          onClick={() => setIsStopwatchExpanded(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl z-50 mb-16 sm:mb-0 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-cyan-400" />
                <h4 className="font-black text-white text-sm">Stopwatch Pool Deck Pelatih</h4>
              </div>
              <button
                onClick={() => setIsStopwatchExpanded(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Big Stopwatch Display */}
            <div className="my-5 p-4 rounded-xl bg-slate-950 border border-cyan-950/60 text-center font-mono">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-cyan-400">
                {formatStopwatch(stopwatchTime)}
              </span>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest">
                Menit : Detik . Seperatus
              </div>
            </div>

            {/* Stopwatch Control Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={handleStartPause}
                className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Jeda</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Mulai</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLap}
                disabled={stopwatchTime === 0}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Flag className="w-4 h-4 text-cyan-400" />
                <span>Split / Lap</span>
              </button>

              <button
                onClick={handleReset}
                disabled={stopwatchTime === 0 && !isRunning}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 disabled:opacity-40 disabled:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>

            {/* Laps List */}
            {laps.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 border-t border-slate-800 pt-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Catatan Split ({laps.length} Lap)
                </div>
                {laps.map((lapMs, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-950/60 rounded-lg font-mono"
                  >
                    <span className="text-slate-400">Lap #{laps.length - idx}</span>
                    <span className="font-bold text-white">{formatStopwatch(lapMs)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FIXED BOTTOM TASKBAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl flex items-center px-2 sm:px-4 no-print select-none">
        <div className="w-full flex items-center justify-between gap-1 sm:gap-4">
          {/* Left Wing: Sidebar Launcher & Active Athlete Chip */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sidebar Toggle Button */}
            <button
              onClick={onToggleSidebar}
              title="Buka Menu Sidebar"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Menu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold hidden md:inline">Menu</span>
            </button>

            {/* Active Athlete Quick Badge */}
            {selectedAthlete && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-500/20" />
                <span className="font-bold text-white truncate max-w-[100px] lg:max-w-[130px]">
                  {selectedAthlete.namaPanggilan}
                </span>
                <span className="text-[10px] text-slate-400 hidden lg:inline">
                  • {selectedAthlete.kelompokUsia.split(' ')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Center Dock: Quick Navigation Icons + Glowing Action Button */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 bg-slate-900/70 p-1 rounded-2xl border border-slate-800/80 shadow-inner">
            {dockItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  title={item.label}
                  className={`relative p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-b from-cyan-500/25 to-blue-500/10 text-cyan-400 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
                  <span className="text-[9px] mt-0.5 hidden xs:inline font-medium">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-3 h-0.5 bg-cyan-400 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Central Quick Add Action Button (+) */}
            <button
              onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
              title="Pintasan Catat Cepat (+)"
              className="ml-1 p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="text-xs hidden md:inline font-black">Catat</span>
            </button>
          </div>

          {/* Right Wing: Coach Stopwatch Widget & Digital Clock */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Stopwatch Mini Widget */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 text-xs">
              <button
                onClick={() => setIsStopwatchExpanded(true)}
                title="Buka Stopwatch Pelatih"
                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg hover:bg-slate-800 cursor-pointer font-mono font-bold text-cyan-400"
              >
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline text-[11px]">
                  {formatStopwatch(stopwatchTime)}
                </span>
              </button>

              <button
                onClick={handleStartPause}
                title={isRunning ? 'Jeda Stopwatch' : 'Mulai Stopwatch'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
              >
                {isRunning ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
              </button>
            </div>

            {/* Digital Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
