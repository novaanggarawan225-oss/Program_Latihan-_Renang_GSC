import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AppDatabase,
  Athlete,
  SwimResult,
  TrainingLog,
  SwimProgram,
  PhysicalProgram,
  TargetWaktu,
  EvaluationItem,
  RecoveryLog,
  UserRole,
  StrokeStyle,
} from '../types';
import { initialDatabase } from '../utils/initialData';
import { parseTimeToSeconds, formatSecondsToTime } from '../utils/timeFormat';

interface DataContextType {
  data: AppDatabase;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedAthleteId: string;
  setSelectedAthleteId: (id: string) => void;
  selectedAthlete: Athlete | undefined;
  
  // Athlete actions
  addAthlete: (athlete: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAthlete: (athlete: Athlete) => void;
  deleteAthlete: (id: string) => void;

  // Swim Result actions
  addSwimResult: (result: Omit<SwimResult, 'id' | 'createdAt' | 'updatedAt' | 'waktuDetik' | 'isPB' | 'selisihSebelumnya' | 'persentasePerubahan' | 'waktuSebelumnya'>) => { result: SwimResult; evaluation: EvaluationItem };
  updateSwimResult: (result: SwimResult) => void;
  deleteSwimResult: (id: string) => void;

  // Training Log actions
  addTrainingLog: (log: Omit<TrainingLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteTrainingLog: (id: string) => void;

  // Programs
  addSwimProgram: (program: Omit<SwimProgram, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSwimProgram: (program: SwimProgram) => void;
  addPhysicalProgram: (program: Omit<PhysicalProgram, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePhysicalProgram: (program: PhysicalProgram) => void;

  // Targets
  addTarget: (target: Omit<TargetWaktu, 'id' | 'createdAt' | 'updatedAt' | 'selisihDetik' | 'pbSaatIniDetik' | 'waktuTargetDetik'>) => void;
  updateTarget: (target: TargetWaktu) => void;
  deleteTarget: (id: string) => void;

  // Recovery Log
  addRecoveryLog: (log: Omit<RecoveryLog, 'id' | 'createdAt' | 'updatedAt'>) => void;

  // AI & Analytics Helpers
  getAthleteResults: (athleteId: string, stroke?: StrokeStyle, distance?: string) => SwimResult[];
  getAthletePB: (athleteId: string, stroke: StrokeStyle, distance: string) => SwimResult | undefined;
  getAthleteTargets: (athleteId: string) => TargetWaktu[];
  getAthleteTrainingLogs: (athleteId: string) => TrainingLog[];
  getAthleteEvaluations: (athleteId: string) => EvaluationItem[];
  getAthleteRecoveryLogs: (athleteId: string) => RecoveryLog[];

  // Utility
  resetToDemoData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
}

const STORAGE_KEY = 'swim_tracker_db_v1';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppDatabase>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse localStorage data:', e);
      }
    }
    return initialDatabase;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('coach');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(() => {
    return data.athletes[0]?.id || 'ath-1';
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Proactively post to backend API for background file persistence
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {
        // Ignore offline errors
      });
    } catch (e) {
      console.error('Error saving data:', e);
    }
  }, [data]);

  const selectedAthlete = data.athletes.find((a) => a.id === selectedAthleteId);

  // Athlete CRUD
  const addAthlete = (newAthData: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `ath-${Date.now()}`;
    const now = new Date().toISOString();
    const newAthlete: Athlete = {
      ...newAthData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      athletes: [...prev.athletes, newAthlete],
    }));
    setSelectedAthleteId(id);
    return id;
  };

  const updateAthlete = (athlete: Athlete) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      athletes: prev.athletes.map((a) => (a.id === athlete.id ? { ...athlete, updatedAt: now } : a)),
    }));
  };

  const deleteAthlete = (id: string) => {
    setData((prev) => ({
      ...prev,
      athletes: prev.athletes.filter((a) => a.id !== id),
      swim_results: prev.swim_results.filter((r) => r.athleteId !== id),
      training_logs: prev.training_logs.filter((t) => t.athleteId !== id),
      swim_programs: prev.swim_programs.filter((p) => p.athleteId !== id),
      physical_programs: prev.physical_programs.filter((p) => p.athleteId !== id),
      targets: prev.targets.filter((tg) => tg.athleteId !== id),
      evaluations: prev.evaluations.filter((e) => e.athleteId !== id),
      recovery_logs: prev.recovery_logs.filter((r) => r.athleteId !== id),
    }));
    const remaining = data.athletes.filter((a) => a.id !== id);
    if (remaining.length > 0) {
      setSelectedAthleteId(remaining[0].id);
    }
  };

  // Helper to query athlete results
  const getAthleteResults = (athleteId: string, stroke?: StrokeStyle, distance?: string) => {
    return data.swim_results
      .filter((r) => r.athleteId === athleteId)
      .filter((r) => (!stroke ? true : r.gaya === stroke))
      .filter((r) => (!distance ? true : r.jarak.toLowerCase() === distance.toLowerCase()))
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  };

  const getAthletePB = (athleteId: string, stroke: StrokeStyle, distance: string) => {
    const matching = data.swim_results
      .filter((r) => r.athleteId === athleteId && r.gaya === stroke && r.jarak.toLowerCase() === distance.toLowerCase());
    if (matching.length === 0) return undefined;
    return matching.reduce((min, curr) => (curr.waktuDetik < min.waktuDetik ? curr : min), matching[0]);
  };

  const getAthleteTargets = (athleteId: string) => {
    return data.targets.filter((t) => t.athleteId === athleteId);
  };

  const getAthleteTrainingLogs = (athleteId: string) => {
    return data.training_logs
      .filter((t) => t.athleteId === athleteId)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  };

  const getAthleteEvaluations = (athleteId: string) => {
    return data.evaluations
      .filter((e) => e.athleteId === athleteId)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  };

  const getAthleteRecoveryLogs = (athleteId: string) => {
    return data.recovery_logs
      .filter((r) => r.athleteId === athleteId)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  };

  // Automated Swim Result Entry & Comparative Analysis (Sections 4, 5, 7, 10)
  const addSwimResult = (
    inputResult: Omit<SwimResult, 'id' | 'createdAt' | 'updatedAt' | 'waktuDetik' | 'isPB' | 'selisihSebelumnya' | 'persentasePerubahan' | 'waktuSebelumnya'>
  ) => {
    const waktuDetik = parseTimeToSeconds(inputResult.waktu);
    const existingSame = getAthleteResults(inputResult.athleteId, inputResult.gaya, inputResult.jarak);
    const prevResult = existingSame.length > 0 ? existingSame[existingSame.length - 1] : undefined;
    
    // Overall current PB before this new entry
    const currentPB = existingSame.length > 0
      ? existingSame.reduce((min, curr) => (curr.waktuDetik < min.waktuDetik ? curr : min), existingSame[0])
      : undefined;

    const isPB = !currentPB || waktuDetik < currentPB.waktuDetik;
    const selisihSebelumnya = prevResult ? +(waktuDetik - prevResult.waktuDetik).toFixed(2) : 0;
    const persentasePerubahan = prevResult && prevResult.waktuDetik > 0
      ? +((selisihSebelumnya / prevResult.waktuDetik) * 100).toFixed(2)
      : 0;

    const resultId = `sr-${Date.now()}`;
    const now = new Date().toISOString();

    const newResult: SwimResult = {
      ...inputResult,
      id: resultId,
      waktuDetik,
      isPB,
      selisihSebelumnya,
      persentasePerubahan,
      waktuSebelumnya: prevResult ? prevResult.waktu : undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Automated Evaluation Generation (Section 7, 10)
    let performaWaktu: 'lebih cepat' | 'relatif sama' | 'lebih lambat' = 'relatif sama';
    if (selisihSebelumnya < -0.05) performaWaktu = 'lebih cepat';
    else if (selisihSebelumnya > 0.05) performaWaktu = 'lebih lambat';

    const deltaSign = selisihSebelumnya <= 0 ? `${selisihSebelumnya.toFixed(2)} detik` : `+${selisihSebelumnya.toFixed(2)} detik`;
    const pbBestTime = isPB ? inputResult.waktu : currentPB ? currentPB.waktu : inputResult.waktu;

    // Categorized next focuses based on stroke and notes
    const technicalFocuses: string[] = [];
    if (inputResult.teknikKategori && inputResult.teknikKategori.length > 0) {
      inputResult.teknikKategori.forEach((cat) => {
        if (cat === 'Start') technicalFocuses.push('Reaksi dan daya dorong eksplosif dari balok loncat');
        if (cat === 'Streamline') technicalFocuses.push('Kunci posisi streamline kepala di antara lengan');
        if (cat === 'Underwater') technicalFocuses.push('Optimasi 5-6 dolphin kicks kuat sebelum breakout');
        if (cat === 'Stroke technique') technicalFocuses.push('Efisiensi tangkapan (high elbow catch) dan jarak per kayuhan (DPS)');
        if (cat === 'Breathing') technicalFocuses.push('Ritme pernapasan teratur dan minimalkan elevasi kepala');
        if (cat === 'Turn') technicalFocuses.push('Kecepatan rotasi flip turn dan tolakan dinding bertenaga');
        if (cat === 'Finish') technicalFocuses.push('Sentuhan finish tajam dengan akselerasi tanpa bernapas 5m akhir');
        if (cat === 'Pacing') technicalFocuses.push('Konsistensi pembagian tempo 25m pertama dan kedua');
      });
    }

    if (technicalFocuses.length === 0) {
      technicalFocuses.push('Start & Breakout 15 meter awal', 'Kecepatan dan efisiensi stroke di paruh kedua', 'Touch finish tajam');
    }

    // Safety check based on recent recovery
    const athleteRecovery = getAthleteRecoveryLogs(inputResult.athleteId);
    const latestRec = athleteRecovery.length > 0 ? athleteRecovery[0] : null;
    let safetyNote: string | undefined = undefined;
    if (latestRec && (latestRec.tingkatKelelahan >= 4 || latestRec.nyeriOtot >= 4 || latestRec.kualitasTidur <= 2)) {
      safetyNote = 'Peringatan Pemulihan: Atlet terindikasi memiliki skor kelelahan tinggi atau tidur kurang optimal. Pelatih disarankan mengevaluasi intensitas latihan berikutnya dan memprioritaskan pemulihan.';
    }

    const newEvaluation: EvaluationItem = {
      id: `ev-${Date.now()}`,
      athleteId: inputResult.athleteId,
      swimResultId: resultId,
      tanggal: inputResult.tanggal,
      nomor: `${inputResult.jarak} ${inputResult.gaya}`,
      pb: pbBestTime,
      hasilTerbaru: inputResult.waktu,
      perubahanWaktu: deltaSign,
      performaWaktu,
      trenStatus: isPB
        ? 'Mencapai Personal Best Baru (PB) dengan tren menanjak!'
        : performaWaktu === 'lebih cepat'
        ? 'Performa membaik lebih cepat dibanding sesi sebelumnya.'
        : performaWaktu === 'relatif sama'
        ? 'Performa relatif stabil dan konsisten pada race pace.'
        : 'Performa sedikit di bawah waktu sebelumnya, perlu evaluasi recovery & teknis.',
      isPB,
      konsistensiStatus: Math.abs(selisihSebelumnya) < 0.6 ? 'Konsistensi tinggi (fluktuasi stabil)' : 'Fluktuasi moderat dalam adaptasi beban',
      fokusBerikutnya: technicalFocuses.slice(0, 4),
      rekomendasiRenang: [
        `Drill teknik spesifik ${inputResult.gaya} (Catch & Streamline)`,
        `Pace simulation ${inputResult.jarak} terbagi interval teratur`,
        'Latihan start dive dan akselerasi breakout 15m',
        'Latihan sentuhan finish touch pad',
      ],
      rekomendasiFisik: [
        'Core stability: Front & Side plank hold, dead bug',
        'Mobilitas bahu dan pergelangan kaki (ankle plantar flexion)',
        'Latihan koordinasi dan kekuatan sesuai kelompok usia atlet',
      ],
      fokusPemulihan: [
        'Prioritaskan tidur 8-9 jam untuk pemulihan optimal',
        'Asupan cairan dan nutrisi karbohidrat-protein teratur',
        'Peregangan dinamis & active recovery setelah sesi intensif',
      ],
      catatanKeamanan: safetyNote,
      aiGenerated: false,
      createdAt: now,
      updatedAt: now,
    };

    setData((prev) => ({
      ...prev,
      swim_results: [...prev.swim_results, newResult],
      evaluations: [newEvaluation, ...prev.evaluations],
    }));

    return { result: newResult, evaluation: newEvaluation };
  };

  const updateSwimResult = (result: SwimResult) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      swim_results: prev.swim_results.map((r) => (r.id === result.id ? { ...result, updatedAt: now } : r)),
    }));
  };

  const deleteSwimResult = (id: string) => {
    setData((prev) => ({
      ...prev,
      swim_results: prev.swim_results.filter((r) => r.id !== id),
      evaluations: prev.evaluations.filter((e) => e.swimResultId !== id),
    }));
  };

  // Training Log
  const addTrainingLog = (logData: Omit<TrainingLog, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `tl-${Date.now()}`;
    const now = new Date().toISOString();
    const newLog: TrainingLog = {
      ...logData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      training_logs: [newLog, ...prev.training_logs],
    }));
  };

  const deleteTrainingLog = (id: string) => {
    setData((prev) => ({
      ...prev,
      training_logs: prev.training_logs.filter((t) => t.id !== id),
    }));
  };

  // Programs
  const addSwimProgram = (programData: Omit<SwimProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `sp-${Date.now()}`;
    const now = new Date().toISOString();
    const newProgram: SwimProgram = {
      ...programData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      swim_programs: [newProgram, ...prev.swim_programs],
    }));
  };

  const updateSwimProgram = (program: SwimProgram) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      swim_programs: prev.swim_programs.map((p) => (p.id === program.id ? { ...program, updatedAt: now } : p)),
    }));
  };

  const addPhysicalProgram = (programData: Omit<PhysicalProgram, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `pp-${Date.now()}`;
    const now = new Date().toISOString();
    const newProgram: PhysicalProgram = {
      ...programData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      physical_programs: [newProgram, ...prev.physical_programs],
    }));
  };

  const updatePhysicalProgram = (program: PhysicalProgram) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      physical_programs: prev.physical_programs.map((p) => (p.id === program.id ? { ...program, updatedAt: now } : p)),
    }));
  };

  // Targets
  const addTarget = (targetData: Omit<TargetWaktu, 'id' | 'createdAt' | 'updatedAt' | 'selisihDetik' | 'pbSaatIniDetik' | 'waktuTargetDetik'>) => {
    const id = `tgt-${Date.now()}`;
    const now = new Date().toISOString();
    const pbSaatIniDetik = parseTimeToSeconds(targetData.pbSaatIni);
    const waktuTargetDetik = parseTimeToSeconds(targetData.waktuTarget);
    const selisihDetik = +(pbSaatIniDetik - waktuTargetDetik).toFixed(2);

    const newTarget: TargetWaktu = {
      ...targetData,
      id,
      pbSaatIniDetik,
      waktuTargetDetik,
      selisihDetik,
      createdAt: now,
      updatedAt: now,
    };

    setData((prev) => ({
      ...prev,
      targets: [newTarget, ...prev.targets],
    }));
  };

  const updateTarget = (target: TargetWaktu) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      targets: prev.targets.map((t) => (t.id === target.id ? { ...target, updatedAt: now } : t)),
    }));
  };

  const deleteTarget = (id: string) => {
    setData((prev) => ({
      ...prev,
      targets: prev.targets.filter((t) => t.id !== id),
    }));
  };

  // Recovery Log
  const addRecoveryLog = (logData: Omit<RecoveryLog, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `rl-${Date.now()}`;
    const now = new Date().toISOString();
    const newLog: RecoveryLog = {
      ...logData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      recovery_logs: [newLog, ...prev.recovery_logs],
    }));
  };

  // Reset & Backup
  const resetToDemoData = () => {
    setData(initialDatabase);
    localStorage.removeItem(STORAGE_KEY);
    setSelectedAthleteId('ath-1');
  };

  const exportDatabaseJSON = () => {
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.athletes && parsed.swim_results) {
        setData(parsed);
        if (parsed.athletes.length > 0) {
          setSelectedAthleteId(parsed.athletes[0].id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        data,
        currentRole,
        setCurrentRole,
        selectedAthleteId,
        setSelectedAthleteId,
        selectedAthlete,
        addAthlete,
        updateAthlete,
        deleteAthlete,
        addSwimResult,
        updateSwimResult,
        deleteSwimResult,
        addTrainingLog,
        deleteTrainingLog,
        addSwimProgram,
        updateSwimProgram,
        addPhysicalProgram,
        updatePhysicalProgram,
        addTarget,
        updateTarget,
        deleteTarget,
        addRecoveryLog,
        getAthleteResults,
        getAthletePB,
        getAthleteTargets,
        getAthleteTrainingLogs,
        getAthleteEvaluations,
        getAthleteRecoveryLogs,
        resetToDemoData,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
