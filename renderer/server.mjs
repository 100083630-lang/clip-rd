import http from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const port = Number(process.env.PORT || 8080);
const token = process.env.CLIPRD_RENDERER_TOKEN || "";
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const bucket = process.env.CLIPRD_STORAGE_BUCKET || "cliprd-renders";
const cookiesBase64 = process.env.YTDLP_COOKIES_BASE64 || "";

function cors(res) {
  res.setHeader("access-control-allow-origin", process.env.CLIPRD_ALLOWED_ORIGIN || "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,authorization");
}
function send(res, status, data) {
  cors(res);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(data));
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { body += chunk; if (body.length > 2_000_000) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(body || "{}")); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function toSeconds(value) {
  if (typeof value === "number") return value;
  const parts = String(value || "").split(":").map(Number);
  if (parts.some((x) => !Number.isFinite(x))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}
function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.slice(-2500) || "ffmpeg failed")));
  });
}
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.slice(-3000) || cmd + " failed")));
  });
}
function isYouTube(url) { return /youtube\.com|youtu\.be|music\.youtube\.com/i.test(url); }

async function createCookiesFile(work) {
  if (!cookiesBase64) return null;
  const raw = Buffer.from(cookiesBase64, "base64").toString("utf8");
  if (!raw.includes("Netscape HTTP Cookie File") && !raw.includes("\t")) throw new Error("YTDLP_COOKIES_BASE64 no contiene un archivo cookies.txt valido");
  const file = work + "/cookies.txt";
  await writeFile(file, raw, { mode: 0o600 });
  return file;
}

async function runCapture(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => resolve({ code: -1, stdout, stderr: String(error) }));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function downloadWithYtDlp(url, destination, work) {
  const cookieFile = await createCookiesFile(work);
  const clients = cookieFile ? ["web", "android", "tv", "ios"] : ["android", "tv", "web_embedded", "ios"];
  let lastError = "";

  for (const client of clients) {
    const common = [
      "--no-playlist", "--force-ipv4", "--no-warnings", "--geo-bypass",
      "--extractor-args", "youtube:player_client=" + client,
      "--socket-timeout", "30"
    ];
    if (cookieFile) common.push("--cookies", cookieFile);

    const formats = await runCapture("yt-dlp", [...common, "--list-formats", "--no-colors", url]);
    if (formats.code !== 0) {
      lastError = (formats.stderr || formats.stdout).slice(-3000);
      console.log("yt-dlp format listing failed for " + client + ": " + lastError.slice(-500));
      continue;
    }

    const selectors = [
      "bv*+ba/b",
      "bestvideo+bestaudio/best",
      "best[ext=mp4]/best"
    ];

    for (const selector of selectors) {
      const result = await runCapture("yt-dlp", [
        ...common,
        "-f", selector,
        "--merge-output-format", "mp4",
        "--remux-video", "mp4",
        "-o", destination,
        url
      ]);
      if (result.code === 0) return;
      lastError = (result.stderr || result.stdout).slice(-3000);
      console.log("yt-dlp selector " + selector + " failed for " + client + ": " + lastError.slice(-500));
    }
  }

  const hint = cookieFile
    ? "yt-dlp pudo autenticarse pero no encontro un formato descargable compatible para este video."
    : "YouTube solicito autenticacion. Para contenido propio o autorizado, configura YTDLP_COOKIES_BASE64 o usa una URL directa de MP4.";
  throw new Error(hint + " " + lastError.slice(-900));
}

async function download(url, destination, work) {
  if (isYouTube(url)) return downloadWithYtDlp(url, destination, work);
  const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok || !response.body) throw new Error("Source download failed: " + response.status);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
}

async function ensureBucket() {
  if (!supabaseUrl || !serviceKey) return false;
  const headers = { authorization: "Bearer " + serviceKey, apikey: serviceKey, "content-type": "application/json" };
  const check = await fetch(supabaseUrl + "/storage/v1/bucket/" + encodeURIComponent(bucket), { headers });
  if (check.ok) return true;
  const create = await fetch(supabaseUrl + "/storage/v1/bucket", { method: "POST", headers, body: JSON.stringify({ id: bucket, name: bucket, public: false }) });
  if (!create.ok && create.status !== 409) throw new Error("Unable to create storage bucket");
  return true;
}
async function upload(file, objectName) {
  if (!await ensureBucket()) return null;
  const bytes = await readFile(file);
  const headers = { authorization: "Bearer " + serviceKey, apikey: serviceKey, "content-type": "video/mp4", "x-upsert": "true" };
  const objectPath = objectName.split("/").map(encodeURIComponent).join("/");
  const put = await fetch(supabaseUrl + "/storage/v1/object/" + encodeURIComponent(bucket) + "/" + objectPath, { method: "POST", headers, body: bytes });
  if (!put.ok) throw new Error("Storage upload failed: " + put.status);
  const signed = await fetch(supabaseUrl + "/storage/v1/object/sign/" + encodeURIComponent(bucket) + "/" + objectPath, {
    method: "POST", headers: { authorization: "Bearer " + serviceKey, apikey: serviceKey, "content-type": "application/json" },
    body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7 })
  });
  if (!signed.ok) return null;
  const data = await signed.json();
  return supabaseUrl + "/storage/v1" + data.signedURL;
}

async function render(job) {
  if (!job.sourceUrl || !/^https?:\/\//i.test(job.sourceUrl)) throw new Error("sourceUrl must be an authorized http(s) URL");
  const work = "/tmp/cliprd-" + randomUUID();
  await mkdir(work, { recursive: true });
  try {
    const input = work + "/source.mp4";
    await download(job.sourceUrl, input, work);
    const clips = Array.isArray(job.clips) ? job.clips.slice(0, 6) : [];
    if (!clips.length) throw new Error("No clip segments selected");
    const outputs = [];
    for (let i = 0; i < clips.length; i += 1) {
      const clip = clips[i] || {};
      const start = Math.max(0, toSeconds(clip.start));
      const end = Math.max(start + 1, toSeconds(clip.end));
      const output = work + "/clip-" + (i + 1) + ".mp4";
      await ffmpeg(["-ss", String(start), "-to", String(end), "-i", input, "-map", "0:v:0?", "-map", "0:a:0?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart", output]);
      const url = await upload(output, "jobs/" + (job.id || randomUUID()) + "/clip-" + (i + 1) + ".mp4");
      outputs.push({ index: i + 1, url, start, end });
    }
    return { outputs };
  } finally { await rm(work, { recursive: true, force: true }); }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }
    if (req.method === "GET" && (req.url === "/" || req.url === "")) return send(res, 200, {
      ok: true,
      service: "cliprd-renderer",
      status: "online",
      endpoints: { health: "/health", jobs: "/jobs (POST)" },
      youtubeCookiesConfigured: Boolean(cookiesBase64),
      storageConfigured: Boolean(supabaseUrl && serviceKey)
    });
    if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true, service: "cliprd-renderer", status: "online", youtubeCookiesConfigured: Boolean(cookiesBase64), storageConfigured: Boolean(supabaseUrl && serviceKey) });
    if (req.method !== "POST" || req.url !== "/jobs") return send(res, 404, { error: "Not found", endpoints: { health: "/health", jobs: "/jobs (POST)" } });
    if (token && req.headers.authorization !== "Bearer " + token) return send(res, 401, { error: "Unauthorized" });
    const job = await readJson(req);
    const result = await render({ id: job.id || randomUUID(), ...job });
    return send(res, 200, { ok: true, jobId: job.id, ...result });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: error instanceof Error ? error.message : "Renderer failed" });
  }
});
server.listen(port, "0.0.0.0", () => console.log("CLIPRD renderer listening on " + port));
