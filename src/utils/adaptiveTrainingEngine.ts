import { Athlete, SwimResult, TrainingLog, RecoveryLog, SwimProgram, PhysicalProgram, PeriodizationPhase } from '../types';

export interface AdaptiveInsights {
  athleteId: string;
  readinessLevel: 'optimal' | 'moderate' | 'fatigued' | 'recovery_needed';
  readinessScore: number; // 0 - 100
  readinessLabel: string;
  readinessColor: string;
  
  // Previous training summary
  avgRpeLast7Days: number;
  totalVolumeLast7Days: number;
  sessionCountLast7Days: number;
  lastSessionDate: string;
  lastSessionType: string;
  lastSessionRpe: number;
  lastSessionFatigue: number;
  activePainComplaint: string | null;

  // Previous test summary
  lastTestResult: SwimResult | null;
  lastTestDelta: number | null;
  lastTestIsPb: boolean;
  lastTestTechniqueNote: string | null;
  stagnantOrSlower: boolean;

  // Recommendations for Swim Program
  swimAdjustments: {
    recommendedVolume: number;
    volumeAdjustmentReason: string;
    intensityGuidance: string;
    focusDrills: string[];
    mainSetRpe: number;
    recommendedMainSet: {
      rep: number;
      jarak: number;
      stroke: string;
      interval: string;
      rpe: number;
      recovery: string;
      note: string;
    }[];
    speedSetGuidance: string;
    aerobicSetGuidance: string;
    warmupGuidance: string;
    cooldownGuidance: string;
    adaptiveNotes: string[];
  };

  // Recommendations for Physical Program
  physicalAdjustments: {
    mobilityFocus: string[];
    coreFocus: string[];
    strengthFocus: string[];
    powerFocus: string[];
    coordinationFocus: string[];
    conditioningFocus: string[];
    safetyNote: string;
    adaptiveNotes: string[];
  };
}

export function computeAdaptiveInsights(
  athlete: Athlete,
  trainingLogs: TrainingLog[],
  swimResults: SwimResult[],
  recoveryLogs: RecoveryLog[],
  phase: PeriodizationPhase = 'Development'
): AdaptiveInsights {
  const athleteTrainingLogs = trainingLogs
    .filter((l) => l.athleteId === athlete.id)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const athleteSwimResults = swimResults
    .filter((r) => r.athleteId === athlete.id)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const athleteRecoveryLogs = recoveryLogs
    .filter((r) => r.athleteId === athlete.id)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  // Recent 7 days metrics
  const recentLogs = athleteTrainingLogs.slice(0, 5);
  const sessionCount = recentLogs.length;
  const totalVolume = recentLogs.reduce((acc, l) => acc + (l.volumeMeter || 0), 0);
  const avgRpe = sessionCount > 0
    ? Number((recentLogs.reduce((acc, l) => acc + (l.rpe || 7), 0) / sessionCount).toFixed(1))
    : 7.0;

  const lastSession = recentLogs[0] || null;
  const lastSessionRpe = lastSession?.rpe || 7;
  const lastSessionFatigue = lastSession?.kelelahanSetelah || 2;
  const lastSessionType = lastSession?.jenisLatihan || 'Renang';
  const lastSessionDate = lastSession?.tanggal || 'Belum ada catatan';

  // Pain complaint check
  let activePain: string | null = null;
  const logWithPain = recentLogs.find((l) => l.adaKeluhanNyeri && l.lokasiNyeri);
  if (logWithPain) {
    activePain = `${logWithPain.lokasiNyeri}: ${logWithPain.catatan || 'Nyeri pasca latihan'}`;
  }
  const recoveryWithPain = athleteRecoveryLogs.find((r) => r.keluhanFisik && r.keluhanFisik !== '-');
  if (!activePain && recoveryWithPain) {
    activePain = recoveryWithPain.keluhanFisik || null;
  }

  // Last test result
  const lastTest = athleteSwimResults[0] || null;
  const lastTestDelta = lastTest?.selisihSebelumnya ?? null;
  const lastTestIsPb = !!lastTest?.isPB;
  const lastTestTechniqueNote = lastTest?.catatanTeknik || null;
  const stagnantOrSlower = (lastTestDelta !== null && lastTestDelta >= 0) && !lastTestIsPb;

  // Sleep and fatigue from recovery logs
  const latestRecovery = athleteRecoveryLogs[0] || null;
  const recoveryFatigue = latestRecovery?.tingkatKelelahan || 2;
  const sleepQuality = latestRecovery?.kualitasTidur || 4;

  // Determine readiness score (0-100)
  let readinessScore = 85;
  if (avgRpe >= 8.5) readinessScore -= 20;
  else if (avgRpe >= 8.0) readinessScore -= 10;

  if (lastSessionFatigue >= 4) readinessScore -= 15;
  if (recoveryFatigue >= 4) readinessScore -= 15;
  if (sleepQuality <= 2) readinessScore -= 15;
  if (activePain) readinessScore -= 20;

  readinessScore = Math.max(20, Math.min(100, readinessScore));

  let readinessLevel: 'optimal' | 'moderate' | 'fatigued' | 'recovery_needed' = 'optimal';
  let readinessLabel = 'Kondisi Prima & Siap Berlatih Intensif';
  let readinessColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  if (readinessScore < 45 || activePain) {
    readinessLevel = 'recovery_needed';
    readinessLabel = 'Perlu Penyesuaian Pemulihan / Keluhan Fisik';
    readinessColor = 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  } else if (readinessScore < 65) {
    readinessLevel = 'fatigued';
    readinessLabel = 'Kelelahan Terakumulasi - Kurangi Beban Sesi';
    readinessColor = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  } else if (readinessScore < 80) {
    readinessLevel = 'moderate';
    readinessLabel = 'Kondisi Terjaga - Beban Terkontrol';
    readinessColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
  }

  // --- SWIM ADJUSTMENTS ---
  const swimAdaptiveNotes: string[] = [];
  let baseVolume = 3200;

  // Adjust volume based on readiness
  if (readinessLevel === 'recovery_needed') {
    baseVolume = 1800;
    swimAdaptiveNotes.push('Volume dikurangi ~40% karena indikasi kelelahan/keluhan nyeri untuk regenerasi jaringan otot.');
  } else if (readinessLevel === 'fatigued') {
    baseVolume = 2400;
    swimAdaptiveNotes.push('Volume dikurangi ~25% karena rata-rata RPE sesi sebelumnya tinggi (RPE ' + avgRpe + ').');
  } else if (readinessLevel === 'moderate') {
    baseVolume = 2900;
    swimAdaptiveNotes.push('Volume dijaga seimbang pada level moderat dengan penekanan kualitas teknis.');
  } else {
    baseVolume = 3400;
    swimAdaptiveNotes.push('Kondisi atlet prima (skor pemulihan ' + readinessScore + '/100). Siap menerima volume progresif.');
  }

  // Adjust drills based on previous test technique notes & stagnation
  const focusDrills: string[] = [];
  const primaryStroke = athlete.gayaUtama || 'Freestyle';

  if (lastTestTechniqueNote) {
    const noteLower = lastTestTechniqueNote.toLowerCase();
    if (noteLower.includes('start') || noteLower.includes('reaksi') || noteLower.includes('loncat')) {
      focusDrills.push('Reaksi Start & Dive Angle: 6x dive start eksplosif fokus masuk air tajam (clean entry)');
      swimAdaptiveNotes.push('Menambahkan drill khusus Start & Breakout merujuk catatan tes terakhir: "' + lastTestTechniqueNote + '"');
    }
    if (noteLower.includes('underwater') || noteLower.includes('dolphin') || noteLower.includes('breakout')) {
      focusDrills.push('Underwater Dolphin Kick: 8x25m underwater dolphin streamline kedalaman 0.8m');
      swimAdaptiveNotes.push('Latihan efisiensi underwater ditambahkan untuk perbaikan breakout 15 meter.');
    }
    if (noteLower.includes('catch') || noteLower.includes('elbow') || noteLower.includes('tarikan') || noteLower.includes('kayuhan')) {
      focusDrills.push(`Catch & High Elbow: 4x50m Catch-up drill + 4x50m Fingertip drag (${primaryStroke})`);
      swimAdaptiveNotes.push('Fokus High Elbow Catch untuk memaksimalkan daya dorong kayuhan.');
    }
    if (noteLower.includes('turn') || noteLower.includes('pembalikan') || noteLower.includes('flip')) {
      focusDrills.push('Somersault Quick Turn: 6x25m approach cepat 5m sebelum dinding dan tolakan streamline');
      swimAdaptiveNotes.push('Latihan turn cepat di dinding kolam untuk menghemat pecahan detik.');
    }
    if (noteLower.includes('napas') || noteLower.includes('breathing') || noteLower.includes('ritme')) {
      focusDrills.push('Breathing Control: 400m pull buoy dengan pola napas alternating 3-5-3 tempo tenang');
      swimAdaptiveNotes.push('Stabilisasi ritme pernapasan agar oksigenasi efisien di paruh akhir jarak.');
    }
  }

  // Fallback drills if none detected
  if (focusDrills.length === 0) {
    focusDrills.push(`Drill High Elbow & Body Alignment: 4x50m ${primaryStroke} (fokus rotasi pinggul)`);
    focusDrills.push('Streamline Glide Off the Wall: 4x25m push off maksimum meluncur tanpa kayuhan');
  }

  // Adjust Main Set based on previous training results
  let mainSetRpe = 8;
  const recommendedMainSet: AdaptiveInsights['swimAdjustments']['recommendedMainSet'] = [];

  if (readinessLevel === 'recovery_needed') {
    mainSetRpe = 5;
    recommendedMainSet.push({
      rep: 6,
      jarak: 50,
      stroke: `${primaryStroke} Aerobic Easy-Loose (Teknik Sempurna)`,
      interval: '1:45',
      rpe: 5,
      recovery: '30s rest aktif',
      note: 'Fokus kayuhan santai, jangan paksakan kecepatan, pemulihan aktif',
    });
    recommendedMainSet.push({
      rep: 4,
      jarak: 50,
      stroke: 'Pilihan Gaya Punggung / Gaya Dada Santai',
      interval: '2:00',
      rpe: 4,
      recovery: '45s rest rileks',
      note: 'Regenerasi detak jantung dan peregangan di dalam air',
    });
  } else if (readinessLevel === 'fatigued') {
    mainSetRpe = 7;
    recommendedMainSet.push({
      rep: 6,
      jarak: 50,
      stroke: `${primaryStroke} Sub-max Controlled Pace`,
      interval: '1:30',
      rpe: 7,
      recovery: '25s rest',
      note: 'Pertahankan panjang kayuhan (DPS), kendalikan detak jantung',
    });
    recommendedMainSet.push({
      rep: 4,
      jarak: 25,
      stroke: `${primaryStroke} Build-up Tempo (bukan all-out)`,
      interval: '1:10',
      rpe: 7,
      recovery: '30s napas tenang',
      note: 'Transisi kayuhan halus tanpa kekakuan otot leher/bahu',
    });
  } else {
    mainSetRpe = stagnantOrSlower ? 9 : 8;
    recommendedMainSet.push({
      rep: 4,
      jarak: 50,
      stroke: `${primaryStroke} Target Race Pace Simulasi`,
      interval: '1:30',
      rpe: mainSetRpe,
      recovery: '30s rest aktif',
      note: stagnantOrSlower
        ? 'Perbaikan pecahan waktu: dorong kuat dinding & pertahankan stroke rate'
        : 'Pertahankan rekor personal best dengan breakout tajam',
    });
    recommendedMainSet.push({
      rep: 6,
      jarak: 25,
      stroke: `${primaryStroke} High Speed Sprint`,
      interval: '1:15',
      rpe: 9,
      recovery: '45s rest',
      note: 'Reaksi kayuhan pertama eksplosif pasca breakout 15m',
    });
  }

  // --- PHYSICAL (DRYLAND) ADJUSTMENTS ---
  const physicalAdaptiveNotes: string[] = [];
  const mobilityFocus: string[] = [];
  const coreFocus: string[] = [];
  const strengthFocus: string[] = [];
  const powerFocus: string[] = [];
  const coordinationFocus: string[] = [];
  const conditioningFocus: string[] = [];

  let safetyNote = `Latihan dryland disesuaikan untuk kelompok usia ${athlete.kelompokUsia}. Utamakan form sempurna dan koordinasi motorik. Dilarang angkat beban di atas kepala jika terdapat keluhan otot.`;

  if (activePain) {
    safetyNote = `PERHATIAN MEDIS: Terdeteksi keluhan fisik (${activePain}). Program difokuskan pada dekompresi, mobilitas sendi santai, dan relaksasi otot. Hindari beban benturan atau gerakan yang memicu nyeri.`;
    physicalAdaptiveNotes.push(`Modifikasi program: Mengurangi beban sendi karena keluhan "${activePain}".`);
  }

  if (readinessLevel === 'recovery_needed' || readinessLevel === 'fatigued') {
    mobilityFocus.push('Shoulder CARs santai tanpa beban (2 set x 8 rep)');
    mobilityFocus.push('Thoracic spine foam rolling & ekstensi dada (4 menit)');
    mobilityFocus.push('Ankle & Hip capsule opener stretch (2 set x 30s)');
    
    coreFocus.push('Dead Bug tempo lambat terkontrol (2 set x 8 rep/sisi)');
    coreFocus.push('Bird Dog isometric hold dengan napas diafragma (2 set x 8 rep)');
    
    strengthFocus.push('Isometric wall sit tanpa beban (2 set x 30s)');
    strengthFocus.push('Resistance band pull-apart ringan untuk postur (2 set x 12 rep)');
    
    powerFocus.push('Tidak ada latihan power eksplosif pada sesi pemulihan ini.');
    coordinationFocus.push('Single leg balance mata terbuka (2 set x 20s/kaki)');
    conditioningFocus.push('Peregangan statis seluruh tubuh + latihan napas diafragma (5 menit)');

    physicalAdaptiveNotes.push('Komponen kekuatan berat ditiadakan; difokuskan pada dekompresi tulang belakang dan mobilitas.');
  } else {
    // Normal / Optimal
    mobilityFocus.push('Shoulder band pass-through dinamis (2 set x 12 rep)');
    mobilityFocus.push('Thoracic rotation dengan roller (3 menit)');
    mobilityFocus.push('Hip 90/90 mobility drill (2 set x 10 rep)');

    coreFocus.push('Front Plank hold dengan aktivasi glute (3 set x 45s)');
    coreFocus.push('Side Plank dengan rotasi siku (3 set x 30s/sisi)');
    coreFocus.push('Hollow Body Hold untuk postur streamline (3 set x 25s)');

    strengthFocus.push('Bodyweight Inverted Rows / Pull-ups terkontrol (3 set x 8-10 rep)');
    strengthFocus.push('Push-up tempo 3 detik turun 1 detik naik (3 set x 10 rep)');
    strengthFocus.push('Goblet Squat beban ringan / Bodyweight (3 set x 12 rep)');

    if (stagnantOrSlower) {
      powerFocus.push('Broad Jump eksplosif pendaratan lembut (3 set x 5 rep) - perbaikan daya tolak balok');
      powerFocus.push('Medicine Ball Chest Pass ke dinding (3 set x 8 rep) - daya dorong tangan');
      physicalAdaptiveNotes.push('Menambahkan stimulasi power tungkai bawah untuk memperbaiki tolak dorong start lomba.');
    } else {
      powerFocus.push('Vertical Jump dengan kontak tanah cepat (3 set x 5 rep)');
      powerFocus.push('Medicine Ball Slam ringan (3 set x 6 rep)');
    }

    coordinationFocus.push('Agility ladder quick feet in-out (3 repetisi)');
    coordinationFocus.push('Single leg balance toss ball (2 set x 10 rep)');
    conditioningFocus.push('Jump rope interval 3 x 90 detik (istirahat 45 detik)');

    physicalAdaptiveNotes.push('Kondisi atlet prima: Latihan power fungsional dan core streamline ditingkatkan secara terukur.');
  }

  return {
    athleteId: athlete.id,
    readinessLevel,
    readinessScore,
    readinessLabel,
    readinessColor,
    avgRpeLast7Days: avgRpe,
    totalVolumeLast7Days: totalVolume,
    sessionCountLast7Days: sessionCount,
    lastSessionDate,
    lastSessionType,
    lastSessionRpe,
    lastSessionFatigue,
    activePainComplaint: activePain,
    lastTestResult: lastTest,
    lastTestDelta,
    lastTestIsPb,
    lastTestTechniqueNote,
    stagnantOrSlower,
    swimAdjustments: {
      recommendedVolume: baseVolume,
      volumeAdjustmentReason:
        readinessLevel === 'recovery_needed'
          ? 'Volume diturunkan drastis untuk pemulihan dan proteksi keluhan nyeri.'
          : readinessLevel === 'fatigued'
          ? 'Volume diturunkan 25% agar terhindar dari overtraining pasca sesi berat.'
          : 'Volume optimal sesuai fase periodisasi dengan kondisi fisik siap.',
      intensityGuidance: `RPE Target Main Set: ${mainSetRpe}/10 (${readinessLevel === 'optimal' ? 'Intensif Race Pace' : 'Aerobic & Teknik Terkontrol'})`,
      focusDrills,
      mainSetRpe,
      recommendedMainSet,
      speedSetGuidance:
        readinessLevel === 'recovery_needed'
          ? 'Speed set ditiadakan - ganti dengan 200m easy kick santai'
          : '4x15m Breakout eksplosif off-the-wall dengan underwater dolphin kick',
      aerobicSetGuidance:
        readinessLevel === 'recovery_needed'
          ? '300m Choice swim tempo rileks bernapas bebas'
          : '400m Pull Buoy tempo stabil (ritme napas 3-5-3)',
      warmupGuidance: '300m Pemanasan bertahap + 4x50m Dinamis (25m Kick + 25m Drill santai)',
      cooldownGuidance: '200-300m Easy loose swim (Gaya Punggung/Dada santai) untuk membilas asam laktat',
      adaptiveNotes: swimAdaptiveNotes,
    },
    physicalAdjustments: {
      mobilityFocus,
      coreFocus,
      strengthFocus,
      powerFocus,
      coordinationFocus,
      conditioningFocus,
      safetyNote,
      adaptiveNotes: physicalAdaptiveNotes,
    },
  };
}
