export type UserRole = 'coach' | 'athlete';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  athleteId?: string; // If user is athlete
  createdAt: string;
  updatedAt: string;
}

export type StrokeStyle = 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'Individual Medley';
export type TestType = 'Latihan' | 'Time Trial' | 'Kejuaraan' | 'Evaluasi bulanan' | 'Evaluasi program';
export type AgeGroup = 'KU IV (10-11 th)' | 'KU III (12-13 th)' | 'KU II (14-15 th)' | 'KU I (16-18 th)' | 'Senior (>18 th)';
export type PeriodizationPhase = 'Preparation' | 'Development' | 'Pre-Competition' | 'Competition' | 'Recovery/Transition';

export interface Athlete {
  id: string;
  namaLengkap: string;
  namaPanggilan: string;
  jenisKelamin: 'L' | 'P';
  tanggalLahir: string;
  kelompokUsia: AgeGroup;
  klub: string;
  pelatih: string;
  tanggalMulaiLatihan: string;
  tinggiBadan?: number; // cm
  beratBadan?: number; // kg
  nomorUtama: string; // e.g. "50m Freestyle"
  nomorTambahan: string; // e.g. "100m Freestyle, 50m Butterfly"
  gayaUtama: StrokeStyle;
  gayaTambahan?: StrokeStyle[];
  catatanKhusus?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SwimResult {
  id: string;
  athleteId: string;
  tanggal: string; // YYYY-MM-DD
  jenisTes: TestType;
  jarak: string; // "25 m", "50 m", "100 m", "200 m", "400 m", or custom
  gaya: StrokeStyle;
  waktu: string; // MM:SS.xx or SS.xx
  waktuDetik: number; // For math & charts
  isPB?: boolean;
  selisihSebelumnya?: number; // negative = faster
  persentasePerubahan?: number;
  waktuSebelumnya?: string;
  start?: string; // e.g. "Reaksi cepat 0.65s, streamline kuat"
  split?: string; // e.g. "25m: 17.80s"
  strokeRate?: number; // cycles per min
  strokeCount?: number; // strokes per length
  catatanTeknik?: string;
  teknikKategori?: Array<'Start' | 'Streamline' | 'Underwater' | 'Stroke technique' | 'Breathing' | 'Turn' | 'Finish' | 'Pacing'>;
  kondisiKolam?: string; // "LCM 50m", "SCM 25m", "Indoor", "Outdoor"
  kondisiAtlet?: string; // "Bugar", "Cukup", "Sedikit lelah", etc.
  catatanPelatih?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingLog {
  id: string;
  athleteId: string;
  tanggal: string;
  jenisLatihan: 'Renang' | 'Fisik' | 'Recovery' | 'Rest';
  durasiMenit: number;
  volumeMeter: number;
  rpe: number; // 1-10
  // Kondisi sebelum latihan (1-5)
  energiSebelum: number;
  motivasiSebelum: number;
  tidurSebelum: number;
  // Kondisi setelah latihan (1-5)
  energiSetelah: number;
  kelelahanSetelah: number;
  adaKeluhanNyeri?: boolean;
  lokasiNyeri?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MainSetItem {
  id: string;
  rep: number;
  jarak: number;
  stroke: string;
  interval: string;
  rpe: number;
  recovery: string;
  note?: string;
}

export interface SwimProgram {
  id: string;
  athleteId: string;
  namaProgram: string;
  tanggal: string;
  fasePeriodisasi: PeriodizationPhase;
  level: string;
  pemanasan: string; // e.g. "300m Choice easy + 4x50m Mobility dynamic"
  teknikDrill: string; // e.g. "4x50m Catch-up drill + 4x50m Fingertip drag"
  mainSet: MainSetItem[];
  speedSet?: string; // e.g. "6x25m Max sprint @ interval 1:00"
  aerobicSet?: string; // e.g. "400m Pull buoy breathing every 3"
  coolDown: string; // e.g. "200m Easy backstroke/freestyle loose"
  totalVolumeMeter: number;
  fokusProgram: string;
  disetujuiPelatih: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalProgram {
  id: string;
  athleteId: string;
  namaProgram: string;
  tanggal: string;
  fasePeriodisasi: PeriodizationPhase;
  mobility: string[];
  core: string[];
  strength: string[];
  power: string[];
  coordination: string[];
  conditioning: string[];
  catatanKeamanan: string;
  disetujuiPelatih: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TargetWaktu {
  id: string;
  athleteId: string;
  jarak: string;
  gaya: StrokeStyle;
  pbSaatIni: string;
  pbSaatIniDetik: number;
  waktuTarget: string;
  waktuTargetDetik: number;
  selisihDetik: number;
  targetJangka: '4 minggu' | '8 minggu' | '12 minggu' | 'custom';
  tanggalMulai: string;
  batasWaktu: string;
  status: 'In Progress' | 'Achieved' | 'Expired';
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationItem {
  id: string;
  athleteId: string;
  swimResultId?: string;
  tanggal: string;
  nomor: string;
  pb: string;
  hasilTerbaru: string;
  perubahanWaktu: string;
  performaWaktu: 'lebih cepat' | 'relatif sama' | 'lebih lambat';
  trenStatus: string;
  isPB: boolean;
  konsistensiStatus: string;
  fokusBerikutnya: string[];
  rekomendasiRenang: string[];
  rekomendasiFisik: string[];
  fokusPemulihan: string[];
  catatanKeamanan?: string;
  aiGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryLog {
  id: string;
  athleteId: string;
  tanggal: string;
  kualitasTidur: number; // 1-5
  jamTidur: number;
  tingkatKelelahan: number; // 1-5
  tingkatStres: number; // 1-5
  nyeriOtot: number; // 1-5
  keluhanFisik?: string;
  bebanSekolahLain?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppDatabase {
  users: User[];
  athletes: Athlete[];
  swim_results: SwimResult[];
  training_logs: TrainingLog[];
  swim_programs: SwimProgram[];
  physical_programs: PhysicalProgram[];
  targets: TargetWaktu[];
  evaluations: EvaluationItem[];
  recovery_logs: RecoveryLog[];
}
