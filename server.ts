import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data folder exists for persistence
const dataDir = path.resolve(__dirname, 'data');
const dbFilePath = path.join(dataDir, 'swim_tracker_db.json');

if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Data persistence endpoints
app.get('/api/data', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(dbFilePath)) {
      const content = fs.readFileSync(dbFilePath, 'utf-8');
      return res.json(JSON.parse(content));
    }
    return res.json({ status: 'no_saved_data' });
  } catch (error) {
    console.error('Error reading db file:', error);
    return res.status(500).json({ error: 'Failed to read data file' });
  }
});

app.post('/api/data', (req: Request, res: Response) => {
  try {
    const data = req.body;
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving db file:', error);
    return res.status(500).json({ error: 'Failed to write data file' });
  }
});

// Gemini AI Coach Analysis endpoint
app.post('/api/gemini/coach-analysis', async (req: Request, res: Response) => {
  try {
    const { athlete, latestResult, history, trainingLogs, recoveryLogs, target } = req.body;

    if (!aiClient) {
      // Fallback rule-based structured analysis if GEMINI_API_KEY is not configured yet
      return res.json({
        success: true,
        aiGenerated: false,
        source: 'local-analytics-engine',
        analysis: generateRuleBasedAnalysis(athlete, latestResult, history, trainingLogs, recoveryLogs, target),
      });
    }

    const systemInstruction = `Anda adalah ASISTEN PELATIH RENANG PROFESIONAL (AI Coach Assistant) untuk aplikasi SWIM PERFORMANCE & TRAINING TRACKER.
Tugas Anda adalah menganalisis data atlet renang dengan prinsip:
1. Membantu pelatih, BUKAN menggantikan keputusan pelatih atau tenaga medis profesional.
2. AI TIDAK boleh mengklaim diagnosis medis.
3. AI TIDAK boleh menaikkan beban latihan secara agresif hanya karena hasil waktu belum membaik.
4. Jangan pernah menyatakan atlet "buruk", "lemah", atau label negatif lainnya. Gunakan bahasa konstruktif, suportif, dan berbasis data objektif.
5. Jika ada tanda kelelahan (skor kelelahan tinggi, kualitas tidur rendah, atau keluhan nyeri otot), prioritaskan evaluasi beban latihan, istirahat, recovery aktif, dan anjurkan diskusi dengan pelatih/tenaga profesional.
6. Semua rekomendasi latihan harus bersifat usulan yang dapat diedit dan disetujui pelatih sebelum diterapkan.
7. Format output HARUS JSON valid dengan struktur yang telah ditentukan.`;

    const prompt = `Analisis data atlet renang berikut:
Nama Atlet: ${athlete?.namaLengkap || 'Atlet'} (${athlete?.kelompokUsia || 'KU'})
Gaya Utama: ${athlete?.gayaUtama || 'Freestyle'} - ${athlete?.nomorUtama || '50m'}
Hasil Tes Terbaru:
- Tanggal: ${latestResult?.tanggal || '-'}
- Jenis Tes: ${latestResult?.jenisTes || 'Time Trial'}
- Nomor: ${latestResult?.jarak || '50m'} ${latestResult?.gaya || 'Freestyle'}
- Waktu: ${latestResult?.waktu || '-'} detik
- Catatan Teknik: ${latestResult?.catatanTeknik || 'Tidak ada'}
- Catatan Pelatih: ${latestResult?.catatanPelatih || 'Tidak ada'}
- Stroke Rate / Count: ${latestResult?.strokeRate || '-'} SPM / ${latestResult?.strokeCount || '-'} Strokes

Riwayat 3-5 Hasil Terakhir:
${JSON.stringify(history?.slice(-5) || [], null, 2)}

Target Waktu:
${target ? `${target.jarak} ${target.gaya} - Target: ${target.waktuTarget}s (Batas: ${target.batasWaktu})` : 'Belum ditentukan'}

Log Latihan 7 Hari Terakhir:
${JSON.stringify(trainingLogs?.slice(-5) || [], null, 2)}

Kondisi Pemulihan & Recovery:
${JSON.stringify(recoveryLogs?.slice(-3) || [], null, 2)}

Tolong kembalikan response dalam bentuk JSON murni (tanpa format markdown tambahan selain teks json) dengan key:
{
  "ringkasanPerforma": "string ringkasan performa yang jelas dan suportif",
  "perubahanWaktu": "string perbandingan dengan tes sebelumnya dan status PB",
  "trenPerforma": "string analisis tren dari 3-5 hasil terakhir",
  "areaPerhatian": ["string 1", "string 2"],
  "fokusTeknik": ["string start/breakout", "string stroke efficiency", "string turn/finish"],
  "rekomendasiRenang": ["string drill teknik", "string main set terstruktur", "string sprint/pace"],
  "rekomendasiFisik": ["string mobility dryland", "string core stability", "string strength/power sesuai usia"],
  "rekomendasiRecovery": ["string tidur", "string hidrasi dan nutrisi", "string hari latihan ringan/rest"],
  "fokusEvaluasiBerikutnya": "string apa yang harus dipantau pada sesi berikutnya",
  "peringatanKeselamatan": "string peringatan jika terindikasi kelelahan/nyeri, atau null jika kondisi prima"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch {
      // In case json has markdown ticks
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      aiGenerated: true,
      source: 'gemini-3.8-flash',
      analysis: parsedData,
    });
  } catch (error: any) {
    console.error('Error generating AI Coach analysis:', error);
    // Graceful fallback to rule-based analysis so user is never blocked
    const { athlete, latestResult, history, trainingLogs, recoveryLogs, target } = req.body;
    return res.json({
      success: true,
      aiGenerated: false,
      source: 'fallback-analytics-engine',
      errorNote: error?.message || 'AI request failed, fallback used',
      analysis: generateRuleBasedAnalysis(athlete, latestResult, history, trainingLogs, recoveryLogs, target),
    });
  }
});

// Program generator endpoint adapted to previous training results
app.post('/api/gemini/generate-program', async (req: Request, res: Response) => {
  try {
    const { athlete, stroke, distance, phase, focusWeakness, level, trainingLogs, swimResults, recoveryLogs } = req.body;

    if (!aiClient) {
      return res.json({
        success: true,
        aiGenerated: false,
        program: generateDefaultProgram(athlete, stroke, distance, phase, focusWeakness, trainingLogs, swimResults, recoveryLogs),
      });
    }

    const systemInstruction = `Anda adalah Penyusun Program Latihan Renang dan Fisik (Dryland) Profesional untuk atlet renang.
Prinsip Utama:
1. SESUAIKAN DENGAN HASIL LATIHAN & TES SEBELUMNYA:
   - Jika sesi sebelumnya mencatat RPE tinggi (>=8) atau kelelahan, kurangi volume/intensitas latihan (deload/recovery active) untuk mencegah overtraining.
   - Jika ada keluhan nyeri fisik (bahu/lutut/pinggang), sesuaikan drill dan hilangkan beban pada area tersebut.
   - Jika tes terakhir menunjukkan stagnasi atau catatan teknik tertentu (misal: start lambat, underwater pendek, atau stroke rate turun), prioritaskan drill dan set spesifik untuk memperbaiki kelemahan tersebut.
   - Jika tes terakhir mencatat Personal Best (PB), berikan progresi terukur pada race pace speed set.
2. Tidak memberikan program beban berlebih / overhead heavy weights untuk anak & remaja.
3. Gunakan prinsip periodisasi (Preparation, Development, Pre-Competition, Competition, Recovery/Transition).
4. Struktur program renang: Pemanasan, Drill Teknik, Main Set, Speed/Aerobic Set, Cool Down.
5. Program fisik: Mobility, Core, Strength sesuai usia, Power terkontrol, Coordination, Conditioning.
6. Format output JSON valid.`;

    const recentLogsStr = trainingLogs && trainingLogs.length > 0
      ? JSON.stringify(trainingLogs.slice(-3), null, 2)
      : 'Belum ada log latihan sebelumnya';

    const recentTestsStr = swimResults && swimResults.length > 0
      ? JSON.stringify(swimResults.slice(-3), null, 2)
      : 'Belum ada hasil tes sebelumnya';

    const recentRecoveryStr = recoveryLogs && recoveryLogs.length > 0
      ? JSON.stringify(recoveryLogs.slice(-2), null, 2)
      : 'Belum ada data recovery';

    const prompt = `Buatkan program latihan renang & dryland yang DISESUAIKAN LANGSUNG DENGAN HASIL LATIHAN & TES SEBELUMNYA:
Data Atlet:
- Nama: ${athlete?.namaLengkap || 'Atlet'}
- Kelompok Usia: ${athlete?.kelompokUsia || 'KU II (14-15)'}
- Gaya Utama: ${stroke || 'Freestyle'} (${distance || '50m'})
- Fase Periodisasi: ${phase || 'Development'}
- Level: ${level || 'Kompetisi Remaja'}
- Fokus Area Tambahan: ${focusWeakness || 'Start, Breakout 15m, Stroke efficiency'}

Hasil Latihan Sebelumnya (Training Logs Terakhir):
${recentLogsStr}

Hasil Tes / Lomba Renang Sebelumnya (Swim Results Terakhir):
${recentTestsStr}

Kondisi Pemulihan & Keluhan (Recovery):
${recentRecoveryStr}

Instruksi Penyesuaian:
- Sesuaikan volume (meter), repetisi main set, interval, dan drill renang serta latihan fisik berdasarkan beban dan catatan teknik dari sesi latihan & tes sebelumnya di atas.
- Cantumkan rangkuman penyesuaian adaptif tersebut pada field 'catatanPenyesuaianLatihanSebelumnya'.

Format response JSON murni:
{
  "namaProgram": "string judul program",
  "catatanPenyesuaianLatihanSebelumnya": "string ringkasan mengapa volume/drill/intensitas disesuaikan berdasarkan hasil latihan & tes sebelumnya",
  "pemanasan": "string pemanasan renang (meter dan rincian)",
  "teknikDrill": "string drill teknik spesifik untuk perbaikan kelemahan sesi sebelumnya",
  "mainSet": [
    {
      "rep": 4,
      "jarak": 50,
      "stroke": "string gaya dan intensitas",
      "interval": "string e.g. 1:30",
      "rpe": 8,
      "recovery": "string e.g. 20-30s rest",
      "note": "string petunjuk fokus"
    }
  ],
  "speedSet": "string latihan kecepatan/sprint",
  "aerobicSet": "string latihan aerobik pendukung",
  "coolDown": "string pendinginan",
  "totalVolumeMeter": 3000,
  "fokusProgram": "string rangkuman fokus sesi",
  "programFisik": {
    "namaProgram": "string judul dryland disesuaikan",
    "catatanPenyesuaianFisik": "string penyesuaian fisik berdasarkan beban latihan kemarin",
    "mobility": ["string", "string"],
    "core": ["string", "string"],
    "strength": ["string", "string"],
    "power": ["string", "string"],
    "coordination": ["string", "string"],
    "conditioning": ["string", "string"],
    "catatanKeamanan": "string keselamatan dryland atlet usia muda"
  }
} `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      aiGenerated: true,
      program: parsedData,
    });
  } catch (error: any) {
    console.error('Error generating program with AI:', error);
    const { athlete, stroke, distance, phase, focusWeakness, trainingLogs, swimResults, recoveryLogs } = req.body;
    return res.json({
      success: true,
      aiGenerated: false,
      program: generateDefaultProgram(athlete, stroke, distance, phase, focusWeakness, trainingLogs, swimResults, recoveryLogs),
    });
  }
});

function generateRuleBasedAnalysis(
  athlete: any,
  latestResult: any,
  history: any[],
  trainingLogs: any[],
  recoveryLogs: any[],
  target: any
) {
  const isPb = latestResult?.isPB;
  const delta = latestResult?.selisihSebelumnya ?? 0;
  const perfStatus = delta < -0.05 ? 'lebih cepat' : delta > 0.05 ? 'lebih lambat' : 'relatif sama';

  // Check fatigue indicators
  const latestRecovery = recoveryLogs && recoveryLogs.length > 0 ? recoveryLogs[recoveryLogs.length - 1] : null;
  const latestLog = trainingLogs && trainingLogs.length > 0 ? trainingLogs[trainingLogs.length - 1] : null;

  const highFatigue = (latestRecovery?.tingkatKelelahan >= 4) || (latestLog?.kelelahanSetelah >= 4) || (latestLog?.adaKeluhanNyeri);
  const lowSleep = (latestRecovery?.kualitasTidur <= 2) || (latestLog?.tidurSebelum <= 2);

  let warning: string | null = null;
  if (highFatigue || lowSleep) {
    warning = 'PERINGATAN MONITORING: Terindikasi tanda kelelahan atau tidur belum optimal. Pelatih disarankan mengevaluasi beban sesi berikutnya, tidak menaikkan intensitas secara mendadak, dan mengutamakan pemulihan aktif.';
  }

  let ringkasan = `Catatan waktu ${latestResult?.jarak || '50m'} ${latestResult?.gaya || 'Freestyle'} terbaru adalah ${latestResult?.waktu || '-'} detik. Performa tercatat ${perfStatus} dibandingkan hasil sebelumnya.`;
  if (isPb) {
    ringkasan += ' Selamat! Atlet berhasil mencetak rekor waktu terbaik pribadi (Personal Best baru).';
  }

  return {
    ringkasanPerforma: ringkasan,
    perubahanWaktu: `${delta < 0 ? delta.toFixed(2) : `+${delta.toFixed(2)}`} detik (${isPb ? 'PB BARU' : 'Evaluasi Progres'})`,
    trenPerforma: history?.length >= 3 ? 'Tren 3-5 sesi menunjukkan konsistensi ritme yang baik dengan progresi bertahap.' : 'Data tes awal tercatat dengan baik sebagai baseline evaluasi.',
    areaPerhatian: [
      'Breakout 15 meter awal dan transisi stroke pertama',
      'Efisiensi ayunan tangan (Distance per Stroke) di paruh akhir jarak lomba',
      'Kerapian sentuhan finish pada bantalan/dinding kolam'
    ],
    fokusTeknik: [
      'Start & Streamline: Sudut masuk kepala netral dan kunci kedua siku rapat',
      'Underwater: 5-6 dolphin kicks bertenaga sebelum breakout',
      'Pacing & Finish: Pertahankan stroke rate tanpa melompatkan nafas di 5m terakhir'
    ],
    rekomendasiRenang: [
      'Drill Catch-up & Fingertip Drag (4 x 50m) untuk memperbaiki efisiensi kayuhan',
      'Main set Pace Simulation (4-6 x 50m @ interval 1:30) dengan target konsisten',
      'Latihan start reaksi dari balok loncat (4 x repetisi dive + 15m breakout eksplosif)'
    ],
    rekomendasiFisik: [
      'Mobilitas Bahu & Thoracic Spine menggunakan resistance band ringan',
      'Core Stability: Front Plank, Side Plank, dan Dead Bug teratur (3 set x 30-45s)',
      'Latihan kekuatan bodyweight yang aman untuk usia atlet (Pull-up dibantu, push-up bertempo)'
    ],
    rekomendasiRecovery: [
      'Pastikan tidur teratur 8-9 jam untuk regenerasi otot',
      'Konsumsi asupan cairan dan makanan bergizi seimbang pasca latihan',
      'Sesi active recovery / stretching santai setelah hari latihan intens'
    ],
    fokusEvaluasiBerikutnya: 'Pantau catatan split 25m pertama serta konsistensi stroke count pada time trial berikutnya.',
    peringatanKeselamatan: warning
  };
}

function generateDefaultProgram(
  athlete: any,
  stroke: string,
  distance: string,
  phase: string,
  focusWeakness: string,
  trainingLogs?: any[],
  swimResults?: any[],
  recoveryLogs?: any[]
) {
  // Analyze previous training logs
  const lastLog = trainingLogs && trainingLogs.length > 0 ? trainingLogs[trainingLogs.length - 1] : null;
  const lastRpe = lastLog?.intensitasRPE || 7;
  const lastFatigue = lastLog?.kelelahanSetelah || 2;
  const hasPain = lastLog?.adaKeluhanNyeri;

  // Analyze previous test
  const lastTest = swimResults && swimResults.length > 0 ? swimResults[swimResults.length - 1] : null;
  const isPb = lastTest?.isPB;
  const delta = lastTest?.selisihSebelumnya ?? 0;
  const lastTechNote = lastTest?.catatanTeknik || '';

  let volume = 3000;
  let mainSetRpe = 8;
  let adaptiveNote = 'Program disusun optimal untuk fase kompetisi.';

  if (hasPain || lastFatigue >= 4 || lastRpe >= 8.5) {
    volume = 2000;
    mainSetRpe = 6;
    adaptiveNote = `Volume dikurangi ke ${volume}m dan RPE diturunkan (RPE ${mainSetRpe}) karena sesi sebelumnya mencatat beban tinggi (RPE ${lastRpe}) atau tanda kelelahan/keluhan otot.`;
  } else if (isPb) {
    volume = 3200;
    mainSetRpe = 8;
    adaptiveNote = `Progresi volume & intensitas dinaikkan karena atlet mencetak Personal Best baru pada tes terakhir (-${Math.abs(delta).toFixed(2)}s).`;
  } else if (delta > 0.1) {
    volume = 2800;
    mainSetRpe = 8;
    adaptiveNote = `Penekanan khusus pada drill teknik dan efisiensi stroke untuk membalik tren stagnasi waktu tes sebelumnya (+${delta.toFixed(2)}s).`;
  }

  const primaryStroke = stroke || athlete?.gayaUtama || 'Freestyle';
  const drillText = lastTechNote
    ? `4x50m Drill spesifik perbaikan teknik: ${lastTechNote}`
    : `4x50m Drill spesifik ${primaryStroke} (fokus pada ${focusWeakness || 'Catch & Streamline'})`;

  return {
    namaProgram: `Program Renang Fase ${phase || 'Development'} - ${distance || '50m'} ${primaryStroke}`,
    catatanPenyesuaianLatihanSebelumnya: adaptiveNote,
    pemanasan: '300m Choice swim santai + 4x50m Dinamis (25m Kick + 25m Drill) interval 1:15',
    teknikDrill: drillText,
    mainSet: [
      {
        rep: 4,
        jarak: 50,
        stroke: `${primaryStroke} Race Pace Target`,
        interval: '1:30',
        rpe: mainSetRpe,
        recovery: '30 detik aktif',
        note: hasPain ? 'Kayuhan santai, jangan memaksa bahu' : 'Breakout streamline kuat tiap dorongan dinding'
      },
      {
        rep: 6,
        jarak: 25,
        stroke: `${primaryStroke} Max Effort Sprint`,
        interval: '1:15',
        rpe: Math.min(9, mainSetRpe + 1),
        recovery: '45 detik napas tenang',
        note: 'Fokus reaksi start dan stroke rate tinggi'
      }
    ],
    speedSet: hasPain ? 'Diganti dengan 200m easy kick relaksasi' : '4x15m Explosive breakout off the wall with underwater dolphin kick',
    aerobicSet: '300m Pull buoy breathing alternating rhythm',
    coolDown: '200m Easy loose swim (Backstroke/Freestyle)',
    totalVolumeMeter: volume,
    fokusProgram: `Disesuaikan dengan hasil latihan sebelumnya: ${adaptiveNote}`,
    programFisik: {
      namaProgram: `Program Dryland Pendukung Fase ${phase || 'Development'}`,
      catatanPenyesuaianFisik: hasPain ? 'Beban dikurangi, fokus dekompresi tulang belakang dan mobilitas.' : 'Program fungsional penguatan core dan power start.',
      mobility: [
        'Shoulder band pass-through (2 set x 10 rep)',
        'Thoracic extension foam roller (3 menit)',
        'Ankle mobility stretch (2 set x 30s)'
      ],
      core: [
        'Front Plank hold (3 set x 45s)',
        'Dead Bug control (3 set x 12 rep)',
        'Bird Dog isometric hold (3 set x 10 rep/sisi)'
      ],
      strength: [
        'Bodyweight pull-ups / inverted rows (3 set x 8 rep)',
        'Squat tanpa beban dengan kontrol lutut (3 set x 12 rep)'
      ],
      power: [
        'Broad jump dengan pendaratan lembut (3 set x 5 rep)',
        'Medicine ball chest push (3 set x 6 rep)'
      ],
      coordination: [
        'Single leg balance test (2 set x 20s/kaki)',
        'Agility ladder drill'
      ],
      conditioning: [
        'Jump rope 3x2 menit dengan 1 menit rest'
      ],
      catatanKeamanan: 'Utamakan teknik yang benar daripada beban berlebih. Selalu didampingi pelatih.'
    }
  };
}

// Development vs Production serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Swim Tracker Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
