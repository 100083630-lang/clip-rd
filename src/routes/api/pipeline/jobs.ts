import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

type JobStatus = "queued" | "processing" | "ready" | "failed";
type ClipJob = {
  id: string; status: JobStatus; sourceUrl: string | null; transcript: string;
  mode: "short" | "viral" | "long"; clips: unknown[]; outputUrl: string | null;
  error: string | null; createdAt: string; updatedAt: string;
};
type RenderOutput = { index: number; url: string | null; start: number; end: number };

declare global { var __cliprdPool: Pool | undefined; var __cliprdJobs: Map<string, ClipJob> | undefined; }
const memory = globalThis.__cliprdJobs ?? (globalThis.__cliprdJobs = new Map());
const pool = process.env.DATABASE_URL
  ? (globalThis.__cliprdPool ?? (globalThis.__cliprdPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 })))
  : null;

async function ensureTable() {
  if (!pool) return;
  await pool.query(`create table if not exists cliprd_pipeline_jobs (
    id text primary key, status text not null, source_url text, transcript text not null default '',
    mode text not null, clips jsonb not null default '[]'::jsonb, output_url text, error text,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
  )`);
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
async function save(job: ClipJob) {
  if (!pool) { memory.set(job.id, job); return job; }
  await ensureTable();
  await pool.query(
    `insert into cliprd_pipeline_jobs (id,status,source_url,transcript,mode,clips,output_url,error,created_at,updated_at)
     values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)
     on conflict (id) do update set status=excluded.status, clips=excluded.clips, output_url=excluded.output_url, error=excluded.error, updated_at=excluded.updated_at`,
    [job.id, job.status, job.sourceUrl, job.transcript, job.mode, JSON.stringify(job.clips), job.outputUrl, job.error, job.createdAt, job.updatedAt],
  );
  return job;
}
async function getJob(id: string) {
  if (!pool) return memory.get(id) ?? null;
  await ensureTable();
  const result = await pool.query(`select * from cliprd_pipeline_jobs where id=$1`, [id]);
  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id, status: row.status, sourceUrl: row.source_url, transcript: row.transcript, mode: row.mode, clips: row.clips, outputUrl: row.output_url, error: row.error, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString() } satisfies ClipJob;
}
async function listJobs(limit = 20) {
  if (!pool) return [...memory.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  await ensureTable();
  const result = await pool.query(`select * from cliprd_pipeline_jobs order by created_at desc limit $1`, [Math.min(100, Math.max(1, limit))]);
  return result.rows.map((row) => ({ id: row.id, status: row.status, sourceUrl: row.source_url, transcript: row.transcript, mode: row.mode, clips: row.clips, outputUrl: row.output_url, error: row.error, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString() }));
}
function seconds(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !/^\d{1,3}:\d{2}(?::\d{2})?$/.test(value)) return NaN;
  return value.split(":").map(Number).reduce((total, part) => total * 60 + part, 0);
}
async function dispatch(job: ClipJob): Promise<{ dispatched: boolean; message?: string; outputs?: RenderOutput[] }> {
  const renderer = process.env.CLIPRD_RENDERER_URL;
  if (!renderer) return { dispatched: false, message: "Renderer no configurado. Trabajo guardado en cola." };
  const token = process.env.CLIPRD_RENDERER_TOKEN;
  if (!token) throw new Error("Falta CLIPRD_RENDERER_TOKEN en Vercel.");
  const response = await fetch(renderer, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(job) });
  const result = await response.json().catch(() => ({})) as { outputs?: RenderOutput[]; error?: string };
  if (!response.ok) throw new Error(result.error || `Renderer rechazó el trabajo (${response.status}).`);
  if (!Array.isArray(result.outputs) || result.outputs.length !== job.clips.length || result.outputs.some((item) => typeof item.url !== "string" || !item.url.startsWith("https://"))) {
    throw new Error("El renderer no entregó todos los MP4 almacenados.");
  }
  return { dispatched: true, outputs: result.outputs };
}
export const Route = createFileRoute("/api/pipeline/jobs")({
  server: { handlers: {
    GET: async ({ request }) => {
      try {
        const url = new URL(request.url); const id = url.searchParams.get("id");
        if (id) { const job = await getJob(id); return job ? json(job) : json({ error: "Job not found" }, 404); }
        return json({ jobs: await listJobs(Number(url.searchParams.get("limit") ?? 20)) });
      } catch (error) { return json({ error: error instanceof Error ? error.message : "Database error" }, 500); }
    },
    POST: async ({ request }) => {
      try {
        const body = await request.json() as Partial<ClipJob>;
        if (typeof body.sourceUrl !== "string" || !/^https:\/\//i.test(body.sourceUrl)) return json({ error: "Se requiere una URL HTTPS directa y descargable de un video que tengas derecho a procesar. Un enlace normal de YouTube/TikTok no es un archivo de video." }, 400);
        if (!Array.isArray(body.clips) || body.clips.length < 1 || body.clips.length > 6) return json({ error: "Selecciona entre 1 y 6 momentos." }, 400);
        const valid = body.clips.every((item) => {
          if (!item || typeof item !== "object") return false;
          const clip = item as { start?: unknown; end?: unknown };
          const start = seconds(clip.start); const end = seconds(clip.end);
          return Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start && end - start <= 180;
        });
        if (!valid) return json({ error: "Los tiempos no son válidos. Cada clip debe durar entre 1 y 180 segundos." }, 400);
        const now = new Date().toISOString();
        const job: ClipJob = { id: randomUUID(), status: "queued", sourceUrl: body.sourceUrl, transcript: typeof body.transcript === "string" ? body.transcript.slice(0, 200000) : "", mode: body.mode === "short" || body.mode === "long" ? body.mode : "viral", clips: body.clips, outputUrl: null, error: null, createdAt: now, updatedAt: now };
        await save(job);
        try {
          const result = await dispatch(job);
          if (result.dispatched) {
            const outputs = result.outputs ?? [];
            job.clips = job.clips.map((clip, index) => ({ ...(clip && typeof clip === "object" ? clip : {}), outputUrl: outputs[index]?.url ?? null }));
            job.outputUrl = outputs[0]?.url ?? null; job.status = job.outputUrl ? "ready" : "failed";
            job.error = job.outputUrl ? null : "No se generó un archivo MP4 descargable."; job.updatedAt = new Date().toISOString(); await save(job);
          }
          return json({ job, ...result }, result.dispatched ? 200 : 202);
        } catch (error) {
          job.status = "failed"; job.error = error instanceof Error ? error.message : "Renderer failed"; job.updatedAt = new Date().toISOString(); await save(job);
          return json({ job }, 502);
        }
      } catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid request" }, 400); }
    },
  } },
});