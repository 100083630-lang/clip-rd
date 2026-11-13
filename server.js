import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3847;
const app = express();

const clipsDir = path.join(__dirname, "clips");
const thumbsDir = path.join(__dirname, "thumbs");
const downloadsDir = path.join(__dirname, "downloads");

for (const dir of [clipsDir, thumbsDir, downloadsDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

app.use(cors({ origin: true, methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "2mb" }));
app.use("/clips", express.static(clipsDir));
app.use("/thumbs", express.static(thumbsDir));
app.use(express.static(__dirname));

const jobs = new Map();

function createJob() {
  const id = randomUUID().slice(0, 12);
  const job = { id, status: "queued", phase: "En cola", message: "Preparando el trabajo…", progress: 2, createdAt: new Date().toISOString(), clips: [], error: null };
  jobs.set(id, job);
  return job;
}
function updateJob(job, patch) { Object.assign(job, patch, { updatedAt: new Date().toISOString() }); }
function jobReporter(job) {
  return (patch) => updateJob(job, patch);
}

const liveState = {
  running: false,
  startedAt: null,
  sourceUrl: null,
  markedMoments: [],
  generatedClips: []
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      ...options
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => { stdout += data.toString(); });
    child.stderr?.on("data", (data) => { stderr += data.toString(); });

    child.on("error", (error) => {
      reject(new Error(`${command} no pudo iniciarse: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} terminó con código ${code}. ${stderr || stdout}`));
    });
  });
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function sanitizeName(value) {
  return String(value || "clip")
    .replace(/[^a-z0-9áéíóúñ_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "clip";
}

async function getDuration(filePath) {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath
  ]);

  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("No se pudo obtener la duración del video.");
  }
  return duration;
}

function findDownloadedFile(jobId) {
  const prefix = `source-${jobId}.`;
  const candidates = fs.readdirSync(downloadsDir)
    .filter(name => name.startsWith(prefix) && /\.(mp4|mkv|webm|mov|m4v)$/i.test(name))
    .map(name => path.join(downloadsDir, name))
    .filter(file => {
      try { return fs.existsSync(file) && fs.statSync(file).size > 1024; }
      catch { return false; }
    })
    .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  return candidates[0] || null;
}

function cleanupPartialDownload(jobId) {
  const prefix = `source-${jobId}.`;
  for (const name of fs.readdirSync(downloadsDir)) {
    if (!name.startsWith(prefix)) continue;
    try { fs.rmSync(path.join(downloadsDir, name), { force: true }); } catch {}
  }
}

function shortError(error) {
  const message = String(error?.message || error || "").replace(/\s+/g, " ").trim();
  if (/SABR|Only images are available/i.test(message)) return "SABR: este cliente no recibió streams descargables";
  if (/n challenge|Signature solving failed/i.test(message)) return "challenge de YouTube no resuelto por este cliente";
  if (/timed out|ETIMEDOUT|ECONNRESET/i.test(message)) return "timeout/conexión inestable";
  if (/Requested format is not available/i.test(message)) return "no hay un formato compatible para este intento";
  return message.slice(0, 420);
}

async function assertLocalTools() {
  const [yt, ffmpeg, ffprobe] = await Promise.all([
    run("yt-dlp", ["--version"]),
    run("ffmpeg", ["-version"]),
    run("ffprobe", ["-version"])
  ]);
  return {
    ytDlp: yt.stdout.trim().split(/\r?\n/)[0] || "ok",
    ffmpeg: ffmpeg.stdout.trim().split(/\r?\n/)[0] || "ok",
    ffprobe: ffprobe.stdout.trim().split(/\r?\n/)[0] || "ok"
  };
}

async function resolveSource(sourceUrl, report = () => {}) {
  if (!sourceUrl) throw new Error("sourceUrl es obligatorio.");

  if (!isHttpUrl(sourceUrl)) {
    const localPath = path.resolve(sourceUrl);
    if (!fs.existsSync(localPath)) throw new Error(`No existe el archivo local: ${localPath}`);
    return localPath;
  }

  report({ status: "downloading", phase: "Preparando descarga", message: "Verificando herramientas locales…", progress: 8 });
  await assertLocalTools();

  const jobId = randomUUID().slice(0, 8);
  const outputTemplate = path.join(downloadsDir, `source-${jobId}.%(ext)s`);
  const cookiesPath = path.join(__dirname, "cookies.txt");
  const hasCookies = fs.existsSync(cookiesPath);
  const hostname = new URL(sourceUrl).hostname.toLowerCase();
  const isYouTube = hostname === "youtu.be" || hostname.endsWith(".youtu.be") || hostname === "youtube.com" || hostname.endsWith(".youtube.com");

  // Conservador para conexiones lentas: una descarga a la vez, reintentos reales y
  // sin forzar un formato inexistente antes de saber qué stream entrega YouTube.
  const common = [
    "--no-playlist",
    "--newline",
    "--retries", "5",
    "--fragment-retries", "5",
    "--file-access-retries", "3",
    "--socket-timeout", "45",
    "--concurrent-fragments", "1",
    "--merge-output-format", "mp4",
    "--no-part",
    "-o", outputTemplate,
    "--print", "after_move:filepath"
  ];

  // web_safari va primero porque fue el cliente que sí produjo un MP4 válido en tus logs.
  // Los demás son fallbacks independientes; no todos funcionan igual para cada sesión/video.
  const attempts = isYouTube ? [
    { name: "youtube-web_safari", args: ["--extractor-args", "youtube:player_client=web_safari"] },
    { name: "youtube-auto", args: [] },
    ...(hasCookies ? [{ name: "youtube-web_safari-cookies", cookies: true, args: ["--extractor-args", "youtube:player_client=web_safari"] }] : []),
    ...(hasCookies ? [{ name: "youtube-web-cookies", cookies: true, args: ["--extractor-args", "youtube:player_client=web"] }] : []),
    { name: "youtube-mweb", args: ["--extractor-args", "youtube:player_client=mweb"] },
    { name: "youtube-tv", args: ["--extractor-args", "youtube:player_client=tv"] },
    { name: "youtube-android", args: ["--extractor-args", "youtube:player_client=android"] },
    { name: "youtube-ios", args: ["--extractor-args", "youtube:player_client=ios"] }
  ] : [{ name: "auto", args: [] }];

  const errors = [];

  for (const attempt of attempts) {
    cleanupPartialDownload(jobId);

    try {
      const args = [...common, ...attempt.args];
      if (attempt.cookies) args.push("--cookies", cookiesPath);

      report({ status: "downloading", phase: "Descargando fuente", message: `Conectando con ${attempt.name}…`, progress: Math.min(42, 12 + attempts.indexOf(attempt) * 4), client: attempt.name });
      console.log(`YT-DLP [${jobId}] → ${attempt.name}`);
      const result = await run("yt-dlp", [...args, sourceUrl]);

      const printed = (result.stdout || "").trim().split(/\r?\n/).filter(Boolean);
      const printedPath = printed.find(line => {
        try { return fs.existsSync(line) && fs.statSync(line).size > 1024; }
        catch { return false; }
      });

      const found = printedPath || findDownloadedFile(jobId);
      if (found) {
        report({ status: "analyzing", phase: "Fuente lista", message: `Descarga completada con ${attempt.name}. Analizando video…`, progress: 45, client: attempt.name });
        console.log(`YT-DLP [${jobId}] ✓ descargado con ${attempt.name}: ${found}`);
        return found;
      }

      throw new Error("yt-dlp terminó sin producir un archivo de video válido.");
    } catch (error) {
      const reason = shortError(error);
      errors.push({ client: attempt.name, reason });
      console.error(`YT-DLP [${jobId}] ✗ ${attempt.name}: ${reason}`);
    }
  }

  cleanupPartialDownload(jobId);

  const summary = errors.map(x => `• ${x.client}: ${x.reason}`).join("\n");
  throw new Error(
    "No se pudo obtener un stream descargable para este video.\n" +
    summary +
    "\n\nCLIPRD probó fallbacks independientes. Si todos fallan, el video/sesión actual no está entregando un stream compatible a yt-dlp."
  );
}
function makeMetadata(index, start, end, sourceTitle) {
  const title = `${sourceTitle} · Clip ${index + 1}`;
  const description = `Momento seleccionado automáticamente desde ${Math.floor(start)}s hasta ${Math.floor(end)}s.`;
  const duration = Math.max(0, end - start);
  const viralScore = Math.min(100, Math.max(1, Math.round(
    55 +
    (duration >= 30 && duration <= 60 ? 18 : 6) +
    (index % 3) * 5
  )));

  return {
    title,
    description,
    clipTranscript: "",
    viralScore
  };
}

async function createThumbnails(clipPath, clipName, duration) {
  const percentages = [0.10, 0.50, 0.85];
  const thumbnails = [];

  for (let i = 0; i < percentages.length; i++) {
    const seconds = Math.max(0.05, duration * percentages[i]);
    const thumbName = `${clipName}-${i + 1}.jpg`;
    const thumbPath = path.join(thumbsDir, thumbName);

    report({ status: "processing", phase: `Creando clip ${index + 1} de ${clipCount}`, message: `Procesando el corte ${index + 1}/${clipCount}…`, progress: 52 + Math.round((index / Math.max(1, clipCount)) * 35), currentClip: index + 1, totalClips: clipCount });
    await run("ffmpeg", [
      "-y",
      "-ss", String(seconds),
      "-i", clipPath,
      "-frames:v", "1",
      "-q:v", "2",
      thumbPath
    ]);

    thumbnails.push(`http://127.0.0.1:${PORT}/thumbs/${encodeURIComponent(thumbName)}`);
  }

  return thumbnails;
}

async function buildClips({ sourceUrl, clipLength = 45, maxClips = 3 }, report = () => {}) {
  const sourcePath = await resolveSource(sourceUrl, report);
  report({ status: "analyzing", phase: "Analizando video", message: "Leyendo duración y preparando cortes…", progress: 50 });
  const sourceDuration = await getDuration(sourcePath);

  const safeClipLength = Math.min(Math.max(Number(clipLength) || 45, 5), 600);
  const safeMaxClips = Math.min(Math.max(Number(maxClips) || 3, 1), 50);

  const clipCount = Math.min(
    safeMaxClips,
    Math.max(1, Math.ceil(sourceDuration / safeClipLength))
  );

  const baseTitle = sanitizeName(path.basename(sourcePath, path.extname(sourcePath)));
  const results = [];

  for (let index = 0; index < clipCount; index++) {
    const start = Math.min(index * safeClipLength, Math.max(0, sourceDuration - 0.1));
    if (start >= sourceDuration) break;

    const end = Math.min(start + safeClipLength, sourceDuration);
    const actualDuration = Math.max(0.1, end - start);
    const id = randomUUID().slice(0, 8);
    const clipName = `${baseTitle}-clip-${String(index + 1).padStart(2, "0")}-${id}`;
    const fileName = `${clipName}.mp4`;
    const outputPath = path.join(clipsDir, fileName);

    await run("ffmpeg", [
      "-y",
      "-ss", String(start),
      "-i", sourcePath,
      "-t", String(actualDuration),
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-c:a", "aac",
      "-movflags", "+faststart",
      outputPath
    ]);

    const clipDuration = await getDuration(outputPath);
    report({ status: "processing", phase: `Finalizando clip ${index + 1} de ${clipCount}`, message: "Generando previsualizaciones…", progress: 58 + Math.round(((index + 0.65) / Math.max(1, clipCount)) * 32), currentClip: index + 1, totalClips: clipCount });
    const thumbnails = await createThumbnails(outputPath, clipName, clipDuration);
    const metadata = makeMetadata(index, start, end, baseTitle);

    results.push({
      id: clipName,
      url: `http://127.0.0.1:${PORT}/clips/${encodeURIComponent(fileName)}`,
      title: metadata.title,
      description: metadata.description,
      clipTranscript: metadata.clipTranscript,
      start,
      end,
      viralScore: metadata.viralScore,
      thumbnails,
      coverUrl: thumbnails[1] || thumbnails[0] || null
    });
  }

  return results;
}

const healthPayload = () => ({ ok: true, status: "online", engine: "cliprd", port: PORT, time: new Date().toISOString() });
app.get("/health", (_req, res) => res.json(healthPayload()));
app.get("/api/health", (_req, res) => res.json(healthPayload()));
app.get("/api/diagnostics", async (_req, res) => { try { const tools = await assertLocalTools(); res.json({ ...healthPayload(), tools }); } catch (error) { res.status(500).json({ ok:false, status:"degraded", error:error.message || String(error) }); } });

app.get("/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: "Trabajo no encontrado." });
  res.json({ ok: true, ...job });
});

app.post("/auto-clips", (req, res) => {
  const job = createJob();
  const report = jobReporter(job);

  // Respuesta inmediata: la interfaz puede mostrar progreso real por fases sin congelarse.
  res.status(202).json({ ok: true, jobId: job.id, status: job.status });

  (async () => {
    try {
      report({ status: "downloading", phase: "Iniciando motor", message: "El motor local aceptó el trabajo.", progress: 5 });
      const clips = await buildClips(req.body || {}, report);
      report({ status: "completed", phase: "Completado", message: `${clips.length} clips listos en tu Biblioteca.`, progress: 100, clips });
    } catch (error) {
      console.error("AUTO-CLIPS ERROR:", error);
      report({ status: "error", phase: "Error", message: error.message || "No se pudieron generar los clips.", error: error.message || String(error), progress: 100 });
    }
  })();
});

app.post("/live/start", (req, res) => {
  liveState.running = true;
  liveState.startedAt = new Date().toISOString();
  liveState.sourceUrl = req.body?.sourceUrl || null;
  liveState.markedMoments = [];
  liveState.generatedClips = [];

  res.json({
    ok: true,
    running: true,
    startedAt: liveState.startedAt,
    sourceUrl: liveState.sourceUrl
  });
});

app.get("/live/status", (_req, res) => {
  res.json({
    ok: true,
    running: liveState.running,
    startedAt: liveState.startedAt,
    sourceUrl: liveState.sourceUrl,
    markedMoments: liveState.markedMoments,
    clips: liveState.generatedClips
  });
});

app.post("/live/stop", async (req, res) => {
  try {
    const sourceUrl = req.body?.sourceUrl || liveState.sourceUrl;
    const clipLength = req.body?.clipLength || 45;
    const maxClips = req.body?.maxClips || Math.max(1, liveState.markedMoments.length || 3);

    let clips = [];
    if (sourceUrl) {
      clips = await buildClips({ sourceUrl, clipLength, maxClips });
    }

    liveState.running = false;
    liveState.generatedClips = clips;

    res.json({
      ok: true,
      running: false,
      clips
    });
  } catch (error) {
    console.error("LIVE STOP ERROR:", error);
    liveState.running = false;
    res.status(500).json({
      ok: false,
      error: error.message || "No se pudieron generar los clips del Live Radar."
    });
  }
});

// NUEVO ENDPOINT PARA EL EDITOR
app.post("/export", async (req, res) => {
  try {
    const { sourceUrl, start = 0, end, cropX = 50, title = "clip-editado" } = req.body || {};
    if (!sourceUrl) throw new Error("sourceUrl requerido");

    const sourcePath = await resolveSource(sourceUrl);
    const duration = end ? Math.max(0.5, end - start) : 15;

    const id = randomUUID().slice(0, 8);
    const clipName = `${sanitizeName(title)}-edit-${id}`;
    const fileName = `${clipName}.mp4`;
    const outputPath = path.join(clipsDir, fileName);

    // Crop simple basado en cropX (0-100)
    const cropPercent = Number(cropX) / 100;
    const cropFilter = `crop=iw*0.9:ih:iw*${cropPercent * 0.1}:0`;

    await run("ffmpeg", [
      "-y",
      "-ss", String(start),
      "-i", sourcePath,
      "-t", String(duration),
      "-vf", `scale=1080:1920:force_original_aspect_ratio=increase,${cropFilter},crop=1080:1920`,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "18",
      "-c:a", "aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      outputPath
    ]);

    const clipDuration = await getDuration(outputPath);
    const thumbnails = await createThumbnails(outputPath, clipName, clipDuration);

    res.json({
      ok: true,
      clip: {
        id: clipName,
        url: `http://127.0.0.1:${PORT}/clips/${encodeURIComponent(fileName)}`,
        title: title + " (editado)",
        thumbnails,
        coverUrl: thumbnails[1] || thumbnails[0]
      }
    });
  } catch (error) {
    console.error("EXPORT ERROR:", error);
    res.status(500).json({
      ok: false,
      error: error.message || "Error al exportar"
    });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`CLIPRD Agent listo en http://127.0.0.1:${PORT}`);
  console.log(`Health: http://127.0.0.1:${PORT}/health`);
  console.log(`API Health: http://127.0.0.1:${PORT}/api/health`);
});
