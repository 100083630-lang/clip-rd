import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { renderClip } from "./renderer.mjs";

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Falta env var: ${name}`);
  return v;
}

function supabaseUrl(bucket, filePath) {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  return `${base}/storage/v1/object/${bucket}/${filePath}`;
}

async function downloadFromSupabase(bucket, filePath, destPath) {
  const url = supabaseUrl(bucket, filePath);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}` },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Download fallo ${res.status} ${url} ${txt.slice(0, 500)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  return destPath;
}

async function uploadToSupabase(bucket, filePath, localPath, contentType = "video/mp4") {
  const url = supabaseUrl(bucket, filePath);
  const fileBuffer = fs.readFileSync(localPath);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: fileBuffer,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload fallo ${res.status} ${txt.slice(0, 500)}`);
  }
  return url;
}

export async function runClipPipeline({
  jobId,
  inputBucket,
  inputPath,
  outputBucket,
  outputPath,
  start,
  end,
  width = 1080,
  height = 1920,
  captions = [],
}) {
  const safeJobId = String(jobId || `clip-${Date.now()}`).replace(/[^a-zA-Z0-9-_]/g, "");
  const tmpDir = os.tmpdir();
  const localInput = path.join(tmpDir, `${safeJobId}-input.mp4`);
  const localOutput = path.join(tmpDir, `${safeJobId}-output.mp4`);

  console.log(`[${safeJobId}] pipeline start ${inputBucket}/${inputPath} -> ${outputBucket}/${outputPath}`);

  try {
    await downloadFromSupabase(inputBucket, inputPath, localInput);
    console.log(`[${safeJobId}] descargado ${localInput}`);

    await renderClip({
      inputPath: localInput,
      outputPath: localOutput,
      start: Number(start),
      end: Number(end),
      width: Number(width),
      height: Number(height),
      captions,
      jobId: safeJobId,
    });

    const publicUrl = await uploadToSupabase(outputBucket, outputPath, localOutput);
    console.log(`[${safeJobId}] subido ${publicUrl}`);

    return { jobId: safeJobId, outputPath, publicUrl, localOutput };
  } finally {
    // Limpieza, no dejamos basura en /tmp
    for (const p of [localInput, localOutput]) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }
  }
}
