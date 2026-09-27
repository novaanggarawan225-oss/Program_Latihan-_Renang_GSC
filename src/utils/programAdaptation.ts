import { Athlete, SwimResult, TrainingLog, RecoveryLog, PeriodizationPhase, SwimProgram, PhysicalProgram } from '../types';

export interface AdaptationContext {
  athlete: Athlete;
  latestResult: SwimResult | null;
  previousTrainingLog: TrainingLog | null;
  latestRecoveryLog: RecoveryLog | null;
  athletePB: SwimResult | null;
  fatigueScore: number; // 1-5
  isFatigued: boolean;
  hasMusclePain: boolean;
  painLocation?: string;
  sleepQuality: number; // 1-5
  recentTechnicalNote: string;
  recommendedPhase: PeriodizationPhase;
  recommendedVolumeMeter: number;
  adaptationReason: string;
  technicalFocusArea: string;
  physicalFocusArea: string;
}

/**
 * Analyzes athlete's previous swim results, training volume, RPE, and recovery
 * to determine the optimal adaptation for the next swim & dryland session.
 */
export function getAthleteAdaptationContext(
  athlete: Athlete,
  results: SwimResult[],
  trainingLogs: TrainingLog[],
  recoveryLogs: RecoveryLog[]
): AdaptationContext {
  // 1. Sort and get latest swim test result
  const sortedResults = [...results].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );
  const latestResult = sortedResults[0] || null;

  // 2. Sort and get latest training log
  const sortedTraining = [...trainingLogs].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );
  const previousTrainingLog = sortedTraining[0] || null;

  // 3. Sort and get latest recovery log
  const sortedRecovery = [...recoveryLogs].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );
  const latestRecoveryLog = sortedRecovery[0] || null;

  // 4. Find PB for primary stroke and distance
  const primaryStrokeResults = results.filter((r) => r.gaya === athlete.gayaUtama);
  let athletePB: SwimResult | null = null;
  if (primaryStrokeResults.length > 0) {
    athletePB = primaryStrokeResults.reduce((best, curr) =>
      curr.waktuDetik < best.waktuDetik ? curr : best
    );
  }

  // 5. Calculate fatigue & recovery metrics
  const fatigueFromRecovery = latestRecoveryLog?.tingkatKelelahan ?? 2;
  const fatigueFromTraining = previousTrainingLog?.kelelahanSetelah ?? 2;
  const fatigueScore = Math.max(fatigueFromRecovery, fatigueFromTraining);

  const sleepQuality = latestRecoveryLog?.kualitasTidur ?? previousTrainingLog?.tidurSebelum ?? 4;
  const hasMusclePain = Boolean(previousTrainingLog?.adaKeluhanNyeri || (latestRecoveryLog?.nyeriOtot && latestRecoveryLog.nyeriOtot >= 4));
  const painLocation = previousTrainingLog?.lokasiNyeri || latestRecoveryLog?.keluhanFisik;

  const isFatigued = Boolean(fatigueScore >= 4 || sleepQuality <= 2 || (previousTrainingLog?.rpe && previousTrainingLog.rpe >= 9));

  // 6. Identify technical focus from latest result
  let recentTechnicalNote = latestResult?.catatanTeknik || '';
  if (!recentTechnicalNote && latestResult?.catatanPelatih) {
    recentTechnicalNote = latestResult.catatanPelatih;
  }
  if (!recentTechnicalNote) {
    recentTechnicalNote = 'Stroke efficiency & streamline off the wall';
  }

  // 7. Determine recommended periodization phase & volume
  let recommendedPhase: PeriodizationPhase = 'Development';
  const prevVolume = previousTrainingLog?.volumeMeter || 3000;
  let recommendedVolumeMeter = prevVolume;

  if (hasMusclePain || (isFatigued && sleepQuality <= 2)) {
    recommendedPhase = 'Recovery/Transition';
    // Deload volume safely by 25-35%
    recommendedVolumeMeter = Math.max(1600, Math.round((prevVolume * 0.7) / 100) * 100);
  } else if (latestResult?.isPB && !isFatigued) {
    // Athlete is in great form, progressive overload in Development / Pre-Competition
    recommendedPhase = 'Development';
    recommendedVolumeMeter = Math.min(4500, Math.round((prevVolume * 1.05) / 100) * 100);
  } else if (isFatigued) {
    recommendedPhase = 'Preparation';
    recommendedVolumeMeter = Math.max(2000, Math.round((prevVolume * 0.85) / 100) * 100);
  }

  // 8. Generate concise reason
  let adaptationReason = '';
  if (hasMusclePain) {
    adaptationReason = `Penyesuaian Perlindungan Otot: Terdapat keluhan rasa nyeri (${painLocation || 'otot'}). Program renang difokuskan pada mobilitas sendi, teknik santai, dan de-load volume. Latihan beban fisik dihentikan sementara.`;
  } else if (isFatigued) {
    adaptationReason = `Penyesuaian Regenerasi: Indikasi kelelahan sesi lalu (skor ${fatigueScore}/5, tidur ${sleepQuality}/5). Volume air diturunkan bertahap dan intensitas RPE dijaga moderat untuk mencegah overtraining.`;
  } else if (latestResult?.isPB) {
    adaptationReason = `Penyesuaian Progresi Performa: Atlet baru mencetak PB ${latestResult.waktu}s pada ${latestResult.jarak} ${latestResult.gaya}. Program ditingkatkan ke simulasi race pace dan akselerasi breakout 15m.`;
  } else {
    adaptationReason = `Penyesuaian Teknikal: Disesuaikan dengan hasil tes ${latestResult ? `${latestResult.jarak} ${latestResult.gaya} (${latestResult.waktu}s)` : 'terakhir'} dengan fokus perbaikan ${recentTechnicalNote}.`;
  }

  // 9. Technical & Physical focus
  const techLower = recentTechnicalNote.toLowerCase();
  let technicalFocusArea = 'Stroke Efficiency & Body Position';
  let physicalFocusArea = 'Core Stability & Thoracic Mobility';

  if (techLower.includes('start') || techLower.includes('breakout') || techLower.includes('loncat')) {
    technicalFocusArea = 'Reaksi Start Balok & Streamline Breakout 15m';
    physicalFocusArea = 'Eksplosivitas Tungkai (Broad Jump) & Stabilitas Ankle';
  } else if (techLower.includes('turn') || techLower.includes('balikan') || techLower.includes('putaran')) {
    technicalFocusArea = 'Kecepatan Flip Turn & Dorongan Kuat Dinding';
    physicalFocusArea = 'Fleksibilitas Panggul & Core Rotational Control';
  } else if (techLower.includes('stroke') || techLower.includes('catch') || techLower.includes('kayuhan')) {
    technicalFocusArea = 'High Elbow Catch & Distance Per Stroke (DPS)';
    physicalFocusArea = 'Mobilitas Sendi Bahu & Rotator Cuff Band Work';
  } else if (techLower.includes('pacing') || techLower.includes('finish') || techLower.includes('lelah')) {
    technicalFocusArea = 'Distribusi Pacing Balapan & Sentuhan Finis Tegas';
    physicalFocusArea = 'Daya Tahan Otot Core & Latihan Pernapasan Ritmis';
  }

  return {
    athlete,
    latestResult,
    previousTrainingLog,
    latestRecoveryLog,
    athletePB,
    fatigueScore,
    isFatigued,
    hasMusclePain,
    painLocation,
    sleepQuality,
    recentTechnicalNote,
    recommendedPhase,
    recommendedVolumeMeter,
    adaptationReason,
    technicalFocusArea,
    physicalFocusArea,
  };
}

/**
 * Builds an adapted Swim Program based on previous results
 */
export function buildAdaptedSwimProgram(context: AdaptationContext): Omit<SwimProgram, 'id'> {
  const {
    athlete,
    latestResult,
    isFatigued,
    hasMusclePain,
    painLocation,
    recommendedPhase,
    recommendedVolumeMeter,
    technicalFocusArea,
    adaptationReason,
  } = context;

  const stroke = athlete.gayaUtama || 'Freestyle';
  const distance = athlete.nomorUtama.split(' ')[0] || '50m';

  if (hasMusclePain || (isFatigued && context.sleepQuality <= 2)) {
    // RECOVERY / DE-LOAD PROGRAM
    return {
      athleteId: athlete.id,
      namaProgram: `Program Pemulihan Aktif & Perbaikan Gaya (Disesuaikan dari Sesi Lalu)`,
      tanggal: new Date().toISOString().split('T')[0],
      fasePeriodisasi: 'Recovery/Transition',
      level: athlete.kelompokUsia,
      pemanasan: `400m Choice santai (100m Gaya Bebas halus + 100m Punggung + 200m Kaki rileks)`,
      teknikDrill: `6 x 50m Drill perbaikan posisi tubuh (Streamline glide + Single-arm focus) @ interval santai 1:30`,
      mainSet: [
        {
          id: `ms-rec-${Date.now()}-1`,
          rep: 6,
          jarak: 50,
          stroke: `${stroke} Aerobik Ringan (DPS Fokus)`,
          interval: '1:45',
          rpe: 5,
          recovery: '35 detik istirahat',
          note: `Fokus kayuhan halus tanpa hentakan mendadak (menjaga ${painLocation || 'otot'})`,
        },
        {
          id: `ms-rec-${Date.now()}-2`,
          rep: 4,
          jarak: 50,
          stroke: `Gaya Punggung / Bebas Lemas`,
          interval: '1:50',
          rpe: 4,
          recovery: '40 detik istirahat',
          note: 'Dekontraksi bahu dan peregangan aktif di air',
        },
      ],
      speedSet: 'TIDAK DIBERIKAN SPRINT: Mengutamakan regenerasi otot dan menghindari cedera',
      aerobicSet: '300m Pull buoy santai tanpa kayuhan eksplosif, pernapasan ritme 3',
      coolDown: '300m Easy backstroke & stretching ringan di tepi kolam',
      totalVolumeMeter: recommendedVolumeMeter,
      fokusProgram: adaptationReason,
      disetujuiPelatih: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // ACTIVE PROGRESSIVE PROGRAM ADAPTED TO LATEST TIME TRIAL & TECHNICAL NOTE
  return {
    athleteId: athlete.id,
    namaProgram: `Sesi ${recommendedPhase}: Adaptasi ${technicalFocusArea} (${stroke} ${distance})`,
    tanggal: new Date().toISOString().split('T')[0],
    fasePeriodisasi: recommendedPhase,
    level: athlete.kelompokUsia,
    pemanasan: `300m Choice swim santai + 4x50m Dinamis (25m Kick bertenaga + 25m Drill kayuhan) @ 1:15`,
    teknikDrill: `6x50m Drill khusus: 3x50m Catch-up drill + 3x50m Fingertip drag fokus ${technicalFocusArea} @ 1:20`,
    mainSet: [
      {
        id: `ms-prog-${Date.now()}-1`,
        rep: 6,
        jarak: 50,
        stroke: `${stroke} Target Race Pace (${latestResult ? `Simulasi sub ${latestResult.waktu}s` : 'RPE 8'})`,
        interval: '1:25',
        rpe: 8,
        recovery: '25-30 detik aktif',
        note: `Breakout kencang 15m pertama + streamline rapat`,
      },
      {
        id: `ms-prog-${Date.now()}-2`,
        rep: 4,
        jarak: 25,
        stroke: `${stroke} Max Effort Explosive`,
        interval: '1:10',
        rpe: 9,
        recovery: '45 detik napas santai',
        note: `Simulasi 15m finish touch tanpa napas di 5m terakhir`,
      },
    ],
    speedSet: `4x15m Dive start reaksi dari balok loncat + breakout dolphin kick eksplosif (rest 1:00)`,
    aerobicSet: `400m Aerobic base building: Pull buoy ritme 3-5-3 konsisten`,
    coolDown: `200m Easy loose swim (Gaya Punggung / Gaya Dada rileks)`,
    totalVolumeMeter: recommendedVolumeMeter,
    fokusProgram: adaptationReason,
    disetujuiPelatih: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Builds an adapted Physical / Dryland Program based on previous results
 */
export function buildAdaptedPhysicalProgram(context: AdaptationContext): Omit<PhysicalProgram, 'id'> {
  const {
    athlete,
    hasMusclePain,
    painLocation,
    isFatigued,
    recommendedPhase,
    physicalFocusArea,
    adaptationReason,
  } = context;

  if (hasMusclePain) {
    return {
      athleteId: athlete.id,
      namaProgram: `Dryland Restoratif & Dekompresi Otot (Penyesuaian Nyeri ${painLocation || 'Otot'})`,
      tanggal: new Date().toISOString().split('T')[0],
      fasePeriodisasi: 'Recovery/Transition',
      mobility: [
        'Gentle Shoulder pendulum & passive band stretch (2 set x 10 rep)',
        'Thoracic spine gentle roller extension (3-4 menit santai)',
        'Ankle & hamstring mobility stretch (2 set x 30s)',
        'Cat-Cow spine decompression (2 set x 10 rep)',
      ],
      core: [
        'Dead Bug tempo sangat lambat tanpa beban (2 set x 8 rep)',
        'Glute Bridge isometric hold (2 set x 20s)',
        'Bird Dog ringan untuk kestabilan punggung (2 set x 8 rep/sisi)',
      ],
      strength: [
        'Istirahat total dari angkat beban / push-up berat',
        'Latihan isometrik ringan tanpa nyeri sendi',
      ],
      power: [
        'LATIHAN POWER DITIADAKAN: Menghindari beban impak tinggi hingga keluhan pulih',
      ],
      coordination: [
        'Single leg standing balance dengan mata terbuka (2 set x 15s/kaki)',
        'Breathing diaphragmatic control (3 menit relaksasi)',
      ],
      conditioning: [
        'Jalan santai / active walk ringan (10-15 menit)',
      ],
      catatanKeamanan: `PERHATIAN MEDIS/PELATIH: Atlet melaporkan keluhan ${painLocation || 'nyeri'}. Hindari beban overhead dan hentikan segera jika terasa ngilu.`,
      disetujuiPelatih: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Active Dryland Adapted to Swimmer Age & Performance Goal
  return {
    athleteId: athlete.id,
    namaProgram: `Dryland ${recommendedPhase}: Penguatan ${physicalFocusArea}`,
    tanggal: new Date().toISOString().split('T')[0],
    fasePeriodisasi: recommendedPhase,
    mobility: [
      'Shoulder pass-through dengan resistance band elastis (2 set x 12 rep)',
      'Thoracic spine foam roller extension & rotation (3 menit)',
      'Ankle plantar & dorsiflexion mobility untuk dorongan kaki kuat (2 set x 30s)',
      'Hip 90/90 mobility drill untuk rotasi panggul (2 set x 10 rep)',
    ],
    core: [
      'Front Plank hold dengan postur streamline sempurna (3 set x 45s)',
      'Side Plank with gentle arm reach (3 set x 30s per sisi)',
      'Dead Bug tempo terkontrol (3 set x 12 rep)',
      'Hollow Body hold untuk meniru streamline di air (3 set x 20s)',
    ],
    strength: [
      'Bodyweight Pull-ups / Inverted Row (3 set x 8-10 rep)',
      'Push-up tempo terkontrol dada rapat (3 set x 12 rep)',
      'Bodyweight Squat dengan paha sejajar lantai (3 set x 12 rep)',
      'Band pull-apart untuk penguatan rotator cuff belakang (3 set x 15 rep)',
    ],
    power: [
      'Broad Jump dengan pendaratan lembut lutut ditekuk (3 set x 5 rep)',
      'Medicine Ball Chest Pass eksplosif ke dinding (3 set x 6 rep)',
      'Squat Jump terkontrol tanpa beban tambahan (3 set x 6 rep)',
    ],
    coordination: [
      'Single-leg balance dengan bola tenis / hand toss (2 set x 10 rep/kaki)',
      'Agility footwork ladder drill untuk kecepatan reaksi (3 putaran)',
    ],
    conditioning: [
      'Jump rope ritme teratur (3 set x 2 menit, istirahat 1 menit)',
    ],
    catatanKeamanan: `Standar Usia Muda (${athlete.kelompokUsia}): Tanpa beban angkat ekstrem di atas kepala. Selalu awasi teknik pendaratan dan kontrol postur punggung.`,
    disetujuiPelatih: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
