import { spawn } from "node:child_process";
import fs from "node:fs";

function escapeDrawtext(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/\n/g, " ");
}

export async function renderClip({ inputPath, outputPath, start, end, width, height, captions = [], jobId = "clip" }) {
  if (!fs.existsSync(inputPath)) throw new Error(`Input no existe: ${inputPath}`);
  if (end <= start) throw new Error(`Rango invalido: start=${start} end=${end}`);

  const w = width || 1080;
  const h = height || 1920;

  let vf = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30`;

  // Captions simples, uno por uno con drawtext
  if (captions.length > 0) {
    for (const c of captions) {
      const text = escapeDrawtext(c.text);
      if (!text) continue;
      const from = Math.max(0, (c.start ?? start) - start);
      const to = Math.max(0, (c.end ?? end) - start);
      vf += `,drawtext=text='${text}':fontsize=48:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-220:enable='between(t,${from.toFixed(2)},${to.toFixed(2)})'`;
    }
  }

  const args = [
    "-ss", String(start),
    "-to", String(end),
    "-i", inputPath,
    "-vf", vf,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y", outputPath,
  ];

  console.log(`[${jobId}] ffmpeg start ${start} -> ${end} ${w}x${h}`);

  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args);
    let stderr = "";
    let lastLog = Date.now();

    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      const now = Date.now();
      if (now - lastLog > 2000) {
        lastLog = now;
        const m = stderr.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (m) console.log(`[${jobId}] progreso ${m[1]}`);
      }
    });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        console.log(`[${jobId}] listo: ${outputPath}`);
        resolve({ outputPath });
      } else {
        reject(new Error(`ffmpeg fallo code=${code}\n${stderr.slice(-3000)}`));
      }
    });
  });
}
