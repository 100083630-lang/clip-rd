import http from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const port = Number(process.env.PORT || 8080);
const token = process.env.CLIPRD_RENDERER_TOKEN || "";
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const bucket = process.env.CLIPRD_STORAGE_BUCKET || "cliprd-renders";

function send(res, status, data) {
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
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.slice(-2000) || "ffmpeg failed")));
  });
}
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.slice(-2000) || cmd + " failed")));
  });
}
function isYouTube(url) {
  return /youtube\.com|youtu\.be|music\.youtube\.com/i.test(url);
}
function getVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v") || "";
  } catch { return ""; }
}
async function downloadViaPiped(url, destination) {
  const id = getVideoId(url);
  if (!id) throw new Error("No video id");
  const instances = ["https://piped.video", "https://pipedapi.kavin.rocks", "https://pipedapi.adminforge.de"];
  let lastErr = "";
  for (const base of instances) {
    try {
      const res = await fetch(base + "/streams/" + id, { headers: { "user-agent": "Mozilla/5.0" } });
      const data = await res.json();
      const streams = [...(data.audioStreams || []), ...(data.videoStreams || [])];
      const combined = (data.videoStreams || []).find(s => s.mimeType && s.mimeType.includes("mp4") && s.url);
      const pick = combined || streams.find(s => s.url);
      if (!pick?.url) { lastErr = "no stream in " + base; continue; }
      const dl = await fetch(pick.url, { headers: { "user-agent": "Mozilla/5.0" } });
      if (!dl.ok || !dl.body) throw new Error("Piped download " + dl.status);
      await pipeline(Readable.fromWeb(dl.body), createWriteStream(destination));
      return;
    } catch (e) { lastErr = String(e).slice(0, 300); }
  }
  throw new Error("Piped failed: " + lastErr);
}
async function downloadWithYtDlp(url, destination) {
  const base = (client) => ["--no-playlist", "--js-runtimes", "node:deno", "--extractor-args", "youtube:player_client=" + client, "--extractor-args", "youtube:player_skip=webpage,configs", "--no-check-certificates", "--geo-bypass", "--no-warnings", "-f", "bv*[height<=720]+ba/b[height<=720]/b", "--remux-video", "mp4", "--recode-video", "mp4", "-o", destination, url];
  const clients = ["android", "mediaconnect", "tv", "web_embedded", "ios", "tv_embedded"];
  for (let i = 0; i < clients.length; i++) {
    try { await run("yt-dlp", base(clients[i])); return; }
    catch (e) { console.log("yt-dlp " + clients[i] + " failed:", String(e).slice(0, 300)); }
  }
  await downloadViaPiped(url, destination);
}
async function download(url, destination) {
  if (isYouTube(url)) { await downloadWithYtDlp(url, destination); return; }
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
  const bytes = await (await import("node:fs/promises")).readFile(file);
  const headers = { authorization: "Bearer " + serviceKey, apikey: serviceKey, "content-type": "video/mp4", "x-upsert": "true" };
  const put = await fetch(supabaseUrl + "/storage/v1/object/" + encodeURIComponent(bucket) + "/" + objectName.split("/").map(encodeURIComponent).join("/"), { method: "POST", headers, body: bytes });
  if (!put.ok) throw new Error("Storage upload failed: " + put.status);
  const signed = await fetch(supabaseUrl + "/storage/v1/object/sign/" + encodeURIComponent(bucket) + "/" + objectName.split("/").map(encodeURIComponent).join("/"), { method: "POST", headers: { authorization: "Bearer " + serviceKey, apikey: serviceKey, "content-type": "application/json" }, body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7 }) });
  if (!signed.ok) return null;
  const data = await signed.json();
  return supabaseUrl + "/storage/v1" + data.signedURL;
}
async function render(job) {
  if (!job.sourceUrl || !/^https?:\/\//i.test(job.sourceUrl)) throw new Error("sourceUrl must be an authorized http(s) URL");
  const work = "/tmp/cliprd-" + randomUUID();
  await mkdir(work, { recursive: true });
  try {
    const input = work + "/source";
    await download(job.sourceUrl, input);
    const clips = Array.isArray(job.clips) ? job.clips.slice(0, 6) : [];
    if (!clips.length) throw new Error("No clip segments selected");
    const outputs = [];
    for (let i = 0; i < clips.length; i += 1) {
      const clip = clips[i] || {};
      const start = Math.max(0, toSeconds(clip.start));
      const end = Math.max(start + 1, toSeconds(clip.end));
      const output = work + "/clip-" + (i + 1) + ".mp4";
      await ffmpeg(["-ss", String(start), "-to", String(end), "-i", input, "-map", "0:v:0?", "-map", "0:a:0?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart", output]);
      const url = await upload(output, "jobs/" + job.id + "/clip-" + (i + 1) + ".mp4");
      outputs.push({ index: i + 1, url, start, end });
    }
    return { outputs };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true, service: "cliprd-renderer" });
    if (req.method !== "POST" || req.url !== "/jobs") return send(res, 404, { error: "Not found" });
    if (token && req.headers.authorization !== "Bearer " + token) return send(res, 401, { error: "Unauthorized" });
    const job = await readJson(req);
    const result = await render(job);
    return send(res, 200, { ok: true, jobId: job.id, ...result });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : "Renderer failed" });
  }
});
server.listen(port, "0.0.0.0", () => console.log("CLIPRD renderer listening on " + port));
