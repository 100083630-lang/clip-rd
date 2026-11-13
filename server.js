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

async function resolveSource(sourceUrl) {
  if (!sourceUrl) throw new Error("sourceUrl es obligatorio.");

  if (!isHttpUrl(sourceUrl)) {
    const localPath = path.resolve(sourceUrl);
    if (!fs.existsSync(localPath)) throw new Error(`No existe el archivo local: ${localPath}`);
    return localPath;
  }

  const jobId = randomUUID().slice(0, 8);
  const outputTemplate = path.join(downloadsDir, `source-${jobId}.%(ext)s`);
  const formats = ["bestvideo+bestaudio/best", "bv*+ba/best", "best", "worst"];
  let lastError = null;

  for (const format of formats) {
    try {
      console.log(`YT-DLP: intentando formato "${format}"…`);
      const result = await run("yt-dlp", [
        "--no-playlist",
        "-f", format,
        "--merge-output-format", "mp4",
        "--newline",
        "-o", outputTemplate,
        "--print", "after_move:filepath",
        sourceUrl
      ]);
      const printed = (result.stdout || "").trim().split(/\r?\n/).filter(Boolean);
      const printedPath = printed.find(line => fs.existsSync(line));
      if (printedPath) return printedPath;

      const candidates = fs.readdirSync(downloadsDir)
        .filter(name => name.startsWith(`source-${jobId}.`) && /\.(mp4|mkv|webm|mov|m4v)$/i.test(name))
        .map(name => path.join(downloadsDir, name))
        .filter(file => fs.existsSync(file));
      if (candidates.length) return candidates[0];

      throw new Error("yt-dlp terminó pero no se encontró el archivo descargado.");
    } catch (error) {
      lastError = error;
      console.error(`YT-DLP falló con formato "${format}":`, error.message || error);
    }
  }

  throw new Error(`No se pudo descargar el video. ${lastError?.message || ""}`);
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

async function buildClips({ sourceUrl, clipLength = 45, maxClips = 3 }) {
  const sourcePath = await resolveSource(sourceUrl);
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

const healthPayload = () => ({ ok: true, status: "online", engine: "cliprd", port: PORT });
app.get("/health", (_req, res) => res.json(healthPayload()));
app.get("/api/health", (_req, res) => res.json(healthPayload()));

app.post("/auto-clips", async (req, res) => {
  try {
    const clips = await buildClips(req.body || {});
    res.json({
      ok: true,
      clips,
      outputs: clips,
      count: clips.length
    });
  } catch (error) {
    console.error("AUTO-CLIPS ERROR:", error);
    res.status(500).json({
      ok: false,
      error: error.message || "No se pudieron generar los clips."
    });
  }
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
