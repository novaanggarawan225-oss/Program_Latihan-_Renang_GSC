import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Navigation, ActiveTab } from './components/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { AthletesView } from './components/views/AthletesView';
import { SwimResultsView } from './components/views/SwimResultsView';
import { AnalysisView } from './components/views/AnalysisView';
import { SwimProgramsView } from './components/views/SwimProgramsView';
import { PhysicalProgramsView } from './components/views/PhysicalProgramsView';
import { RecoveryView } from './components/views/RecoveryView';
import { TargetsView } from './components/views/TargetsView';
import { TrainingLogsView } from './components/views/TrainingLogsView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { AthleteComparisonView } from './components/views/AthleteComparisonView';
import { Sidebar } from './components/layout/Sidebar';
import { Taskbar } from './components/layout/Taskbar';
import { AddSwimResultModal } from './components/modals/AddSwimResultModal';
import { AddTrainingLogModal } from './components/modals/AddTrainingLogModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddResultOpen, setIsAddResultOpen] = useState(false);
  const [isAddTrainingOpen, setIsAddTrainingOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarMobileOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-white">
      {/* SIDEBAR (Collapsible Desktop & Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddResult={() => setIsAddResultOpen(true)}
        onOpenAddTraining={() => setIsAddTrainingOpen(true)}
        isMobileOpen={isSidebarMobileOpen}
        setIsMobileOpen={setIsSidebarMobileOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* MAIN LAYOUT WRAPPER (Shifted by sidebar width on large displays) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header & Sticky Navigation */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddResult={() => setIsAddResultOpen(true)}
          onToggleSidebar={toggleSidebar}
        />

        {/* Main Content Area - padded bottom for Taskbar */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddResult={() => setIsAddResultOpen(true)}
              onOpenAddTraining={() => setIsAddTrainingOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'athletes' && <AthletesView />}
          {activeTab === 'results' && (
            <SwimResultsView onOpenAddResult={() => setIsAddResultOpen(true)} />
          )}
          {activeTab === 'analysis' && <AnalysisView />}
          {activeTab === 'compare' && <AthleteComparisonView />}
          {activeTab === 'swim_programs' && <SwimProgramsView />}
          {activeTab === 'physical_programs' && <PhysicalProgramsView />}
          {activeTab === 'recovery' && <RecoveryView />}
          {activeTab === 'targets' && <TargetsView />}
          {activeTab === 'training_logs' && <TrainingLogsView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        {/* Footer (Hidden in print) */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mb-16 text-center text-xs text-slate-500 no-print mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">SWIM PERFORMANCE & TRAINING TRACKER</span>
              <span>•</span>
              <span>Alat Bantu Analisis Pelatih & Atlet Renang</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Data tersimpan jangka panjang • Periodisasi • Recovery Monitoring • Asisten AI Coach
            </div>
          </div>
        </footer>

        {/* FIXED BOTTOM TASKBAR */}
        <Taskbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddResult={() => setIsAddResultOpen(true)}
          onOpenAddTraining={() => setIsAddTrainingOpen(true)}
          onToggleSidebar={toggleSidebar}
        />
      </div>

      {/* Global Modals */}
      <AddSwimResultModal
        isOpen={isAddResultOpen}
        onClose={() => setIsAddResultOpen(false)}
      />
      <AddTrainingLogModal
        isOpen={isAddTrainingOpen}
        onClose={() => setIsAddTrainingOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
}
