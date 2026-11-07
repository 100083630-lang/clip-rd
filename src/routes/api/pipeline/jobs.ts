import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

type JobStatus = "queued" | "processing" | "ready" | "failed";
type ClipJob = {
  id: string;
  status: JobStatus;
  sourceUrl: string | null;
  transcript: string;
  mode: "short" | "viral" | "long";
  clips: unknown[];
  outputUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

declare global { var __cliprdPool: Pool | undefined; var __cliprdJobs: Map<string, ClipJob> | undefined; }

const memory = globalThis.__cliprdJobs ?? (globalThis.__cliprdJobs = new Map());
const pool = process.env.DATABASE_URL
  ? (globalThis.__cliprdPool ?? (globalThis.__cliprdPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 })))
  : null;

async function ensureTable() {
  if (!pool) return;
  await pool.query(`create table if not exists cliprd_pipeline_jobs (
    id text primary key,
    status text not null,
    source_url text,
    transcript text not null default '',
    mode text not null,
    clips jsonb not null default '[]'::jsonb,
    output_url text,
    error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
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
  return {
    id: row.id, status: row.status, sourceUrl: row.source_url, transcript: row.transcript, mode: row.mode,
    clips: row.clips, outputUrl: row.output_url, error: row.error,
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
  } satisfies ClipJob;
}

async function listJobs(limit = 20) {
  if (!pool) return [...memory.values()].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  await ensureTable();
  const result = await pool.query(`select * from cliprd_pipeline_jobs order by created_at desc limit $1`, [limit]);
  return result.rows.map((row) => ({
    id: row.id, status: row.status, sourceUrl: row.source_url, transcript: row.transcript, mode: row.mode,
    clips: row.clips, outputUrl: row.output_url, error: row.error,
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

async function dispatch(job: ClipJob) {
  const renderer = process.env.CLIPRD_RENDERER_URL;
  if (!renderer) return { dispatched: false, message: "Renderer not configured. Job is safely queued." };
  const response = await fetch(renderer, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.CLIPRD_RENDERER_TOKEN ? { Authorization: `Bearer ${process.env.CLIPRD_RENDERER_TOKEN}` } : {}),
    },
    body: JSON.stringify(job),
  });
  if (!response.ok) throw new Error(`Renderer rejected job (${response.status})`);
  return { dispatched: true };
}

export const Route = createFileRoute("/api/pipeline/jobs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (id) {
          const job = await getJob(id);
          return job ? json(job) : json({ error: "Job not found" }, 404);
        }
        return json({ jobs: await listJobs(Number(url.searchParams.get("limit") ?? 20)) });
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json() as Partial<ClipJob> & { action?: string };
          if (body.action === "status" && body.id) {
            const job = await getJob(body.id);
            return job ? json(job) : json({ error: "Job not found" }, 404);
          }
          const now = new Date().toISOString();
          const job: ClipJob = {
            id: randomUUID(),
            status: "queued",
            sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl : null,
            transcript: typeof body.transcript === "string" ? body.transcript : "",
            mode: body.mode === "short" || body.mode === "long" ? body.mode : "viral",
            clips: Array.isArray(body.clips) ? body.clips : [],
            outputUrl: null,
            error: null,
            createdAt: now,
            updatedAt: now,
          };
          await save(job);
          try {
            const dispatch = await dispatch(job);
            if (dispatch.dispatched) {
              job.status = "processing";
              job.updatedAt = new Date().toISOString();
              await save(job);
            }
            return json({ job, ...dispatch }, 202);
          } catch (error) {
            job.status = "failed";
            job.error = error instanceof Error ? error.message : "Unknown renderer error";
            job.updatedAt = new Date().toISOString();
            await save(job);
            return json({ job }, 502);
          }
        } catch (error) {
          return json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
        }
      },
    },
  },
});
