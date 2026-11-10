import http from "node:http";
import { spawn } from "node:child_process";
import { mkdir, rm, readdir, stat, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 3847);
const HOST = process.env.HOST || "127.0.0.1";
const OUT = path.resolve(process.env.CLIPRD_OUTPUT_DIR || path.join(os.homedir(), "CLIPRD-Clips"));
const BROWSER = (process.env.YTDLP_BROWSER || "").trim();
const COOKIE_FILE = (process.env.YTDLP_COOKIE_FILE || "").trim();

await mkdir(OUT, { recursive: true });

function run(cmd, args, cwd, timeoutMs = 0) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, windowsHide: true });
    let out = "", err = "";
    p.stdout.on("data", d => out += d);
    p.stderr.on("data", d => err += d);
    p.on("error", e => reject(new Error(`${cmd} no está disponible: ${e.message}`)));
    let timer = null;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        p.kill();
        reject(new Error(`${cmd} superó el tiempo máximo de espera`));
      }, timeoutMs);
    }
    p.on("close", code => {
      if (timer) clearTimeout(timer);
      code === 0 ? resolve({out, err}) : reject(new Error((err || out || `${cmd} terminó con código ${code}`).slice(-5000)));
    });
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400"
  };
}

function json(res, code, body) {
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    ...corsHeaders()
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 2_000_000) throw new Error("Solicitud demasiado grande");
  }
  return raw ? JSON.parse(raw) : {};
}

function safeClips(clips) {
  if (!Array.isArray(clips) || !clips.length) throw new Error("No hay clips para generar");
  return clips.slice(0, 12).map((c, i) => {
    const start = Number(c.start), end = Number(c.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end - start > 600) {
      throw new Error(`Segmento inválido #${i + 1}`);
    }
    return { start, end };
  });
}

async function commandVersion(cmd, args) {
  try {
    const result = await run(cmd, args, undefined, 15000);
    return (result.out || result.err || "").trim().split(/\r?\n/)[0] || "ok";
  } catch (error) {
    return null;
  }
}

async function dependencyStatus() {
  let cookieFile = null;
  if (COOKIE_FILE) {
    try { await access(COOKIE_FILE); cookieFile = true; } catch { cookieFile = false; }
  }
  const [ytDlp, ffmpeg] = await Promise.all([
    commandVersion("yt-dlp", ["--version"]),
    commandVersion("ffmpeg", ["-version"])
  ]);
  return {
    ytDlp,
    ffmpeg,
    browser: BROWSER || null,
    cookieFile: COOKIE_FILE ? (cookieFile ? "configured" : "missing") : null
  };
}

async function renderJob(sourceUrl, clips) {
  const job = crypto.randomUUID();
  const work = path.join(os.tmpdir(), "cliprd", job);
  const jobOut = path.join(OUT, job);
  await mkdir(work, { recursive: true });
  await mkdir(jobOut, { recursive: true });

  try {
    const template = path.join(work, "source.%(ext)s");
    const baseArgs = [
      "--no-playlist",
      "--restrict-filenames",
      "-f", "bv*+ba/b/best",
      "--merge-output-format", "mp4",
      "-o", template,
      sourceUrl
    ];

    // En Windows NO intentamos leer Chrome automáticamente: la protección DPAPI/App-Bound
    // puede fallar aunque yt-dlp esté correctamente instalado. Preferimos un cookies.txt
    // exportado explícitamente y solo usamos --cookies-from-browser si el usuario lo pide.
    const downloadArgs = [...baseArgs];
    if (COOKIE_FILE) {
      downloadArgs.unshift("--cookies", COOKIE_FILE);
    } else if (BROWSER) {
      downloadArgs.unshift("--cookies-from-browser", BROWSER);
    }

    try {
      await run("yt-dlp", downloadArgs, work);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/Failed to decrypt with DPAPI/i.test(message)) {
        throw new Error(
          "Windows bloqueó la lectura directa de cookies del navegador (DPAPI). CLIPRD ya no debe usar Chrome automáticamente. " +
          "Configura YTDLP_COOKIE_FILE con la ruta completa de un cookies.txt exportado en formato Netscape, o elimina YTDLP_BROWSER."
        );
      }
      throw error;
    }

    const files = await readdir(work);
    const sourceName = files.find(f => /\.(mp4|mkv|webm|mov)$/i.test(f));
    if (!sourceName) throw new Error("yt-dlp terminó pero no produjo un archivo de video utilizable");
    const source = path.join(work, sourceName);

    const outputs = [];
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const name = `clip-${String(i + 1).padStart(2, "0")}-${Math.round(c.start)}-${Math.round(c.end)}.mp4`;
      const dest = path.join(jobOut, name);
      await run("ffmpeg", [
        "-y", "-ss", String(c.start), "-to", String(c.end), "-i", source,
        "-map", "0:v:0", "-map", "0:a?",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
        "-c:a", "aac", "-movflags", "+faststart", dest
      ], work);
      outputs.push({ index: i + 1, start: c.start, end: c.end, file: `/files/${encodeURIComponent(job)}/${encodeURIComponent(name)}` });
    }
    return { job, outputs };
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => {});
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders());
      return res.end();
    }
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/health") {
      const dependencies = await dependencyStatus();
      const ok = Boolean(dependencies.ytDlp && dependencies.ffmpeg) && dependencies.cookieFile !== "missing";
      return json(res, ok ? 200 : 503, {
        ok,
        service: "CLIPRD Local Agent",
        version: "1.0.3",
        outputDir: OUT,
        dependencies
      });
    }

    if (req.method === "POST" && url.pathname === "/render") {
      const body = await readBody(req);
      const sourceUrl = String(body.sourceUrl || "").trim();
      if (!/^https?:\/\//i.test(sourceUrl)) throw new Error("La URL debe comenzar con http:// o https://");
      const clips = safeClips(body.clips);
      const result = await renderJob(sourceUrl, clips);
      const origin = `http://${HOST === "0.0.0.0" ? "127.0.0.1" : HOST}:${PORT}`;
      result.outputs = result.outputs.map(x => ({ ...x, url: origin + x.file }));
      return json(res, 200, result);
    }

    if (req.method === "GET" && url.pathname.startsWith("/files/")) {
      const rel = decodeURIComponent(url.pathname.slice("/files/".length));
      const target = path.resolve(OUT, rel);
      if (!target.startsWith(OUT + path.sep)) return json(res, 403, { error: "Ruta inválida" });
      const info = await stat(target);
      if (!info.isFile()) return json(res, 404, { error: "Archivo no encontrado" });
      res.writeHead(200, { "content-type": "video/mp4", "content-length": info.size, "access-control-allow-origin": "*" });
      return (await import("node:fs")).createReadStream(target).pipe(res);
    }

    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, HOST, () => console.log(`CLIPRD Local Agent v1.0.3 listo en http://${HOST}:${PORT}`));
