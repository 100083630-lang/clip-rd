import { createFileRoute } from "@tanstack/react-router";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

type JobStatus = "queued" | "processing" | "ready" | "failed";
type ClipMoment = Record<string, unknown> & { start?: unknown; end?: unknown; outputUrl?: string | null };
type ClipJob = {
  id: string;
  status: JobStatus;
  sourceUrl: string | null;
  transcript: string;
  mode: "short" | "viral" | "long";
  clips: ClipMoment[];
  outputUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};
type RenderOutput = { index: number; url: string; start: number; end: number };

declare global {
  var __cliprdPool: Pool | undefined;
  var __cliprdJobs: Map<string, ClipJob> | undefined;
}

const memory = globalThis.__cliprdJobs ?? (globalThis.__cliprdJobs = new Map());
const pool = process.env.DATABASE_URL
  ? (globalThis.__cliprdPool ?? (globalThis.__cliprdPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
    })))
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
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function save(job: ClipJob) {
  if (!pool) {
    memory.set(job.id, job);
    return job;
  }

  await ensureTable();
  await pool.query(
    `insert into cliprd_pipeline_jobs
      (id,status,source_url,transcript,mode,clips,output_url,error,created_at,updated_at)
     values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)
     on conflict (id) do update set
       status=excluded.status,
       clips=excluded.clips,
       output_url=excluded.output_url,
       error=excluded.error,
       updated_at=excluded.updated_at`,
    [
      job.id,
      job.status,
      job.sourceUrl,
      job.transcript,
      job.mode,
      JSON.stringify(job.clips),
      job.outputUrl,
      job.error,
      job.createdAt,
      job.updatedAt,
    ],
  );
  return job;
}

function fromRow(row: any): ClipJob {
  return {
    id: row.id,
    status: row.status,
    sourceUrl: row.source_url,
    transcript: row.transcript,
    mode: row.mode,
    clips: Array.isArray(row.clips) ? row.clips : [],
    outputUrl: row.output_url,
    error: row.error,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function getJob(id: string) {
  if (!pool) return memory.get(id) ?? null;
  await ensureTable();
  const result = await pool.query("select * from cliprd_pipeline_jobs where id=$1", [id]);
  return result.rows[0] ? fromRow(result.rows[0]) : null;
}

async function listJobs(limit = 20) {
  if (!pool) {
    return [...memory.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  await ensureTable();
  const result = await pool.query(
    "select * from cliprd_pipeline_jobs order by created_at desc limit $1",
    [Math.min(100, Math.max(1, limit))],
  );
  return result.rows.map(fromRow);
}

function seconds(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !/^\d{1,3}:\d{2}(?::\d{2})?$/.test(value)) return NaN;

  return value
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}

function rendererEndpoint(raw: string): string {
  const url = new URL(raw);
  const path = url.pathname.replace(/\/+$/, "");

  // Si solo se configuró el dominio, usamos el contrato oficial del renderer.
  if (!path || path === "/") {
    url.pathname = "/render";
  }

  return url.toString();
}

function normalizeOutputs(value: unknown, expected: number): RenderOutput[] {
  const payload = value as { outputs?: unknown };
  if (!Array.isArray(payload.outputs)) {
    throw new Error("El renderer respondió sin el arreglo outputs.");
  }

  if (payload.outputs.length !== expected) {
    throw new Error(`El renderer devolvió ${payload.outputs.length} clips y se esperaban ${expected}.`);
  }

  return payload.outputs.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Salida inválida del renderer en el clip ${index + 1}.`);
    }

    const output = item as Partial<RenderOutput>;
    if (typeof output.url !== "string" || !/^https?:\/\//i.test(output.url)) {
      throw new Error(`El clip ${index + 1} no tiene una URL MP4 válida.`);
    }

    return {
      index: typeof output.index === "number" ? output.index : index,
      url: output.url,
      start: typeof output.start === "number" ? output.start : 0,
      end: typeof output.end === "number" ? output.end : 0,
    };
  });
}

async function dispatch(job: ClipJob): Promise<{ dispatched: boolean; message?: string; outputs?: RenderOutput[]; endpoint?: string }> {
  const renderer = process.env.CLIPRD_RENDERER_URL;
  if (!renderer) {
    return {
      dispatched: false,
      message: "Renderer no configurado. Trabajo guardado en cola.",
    };
  }

  const token = process.env.CLIPRD_RENDERER_TOKEN;
  if (!token) throw new Error("Falta CLIPRD_RENDERER_TOKEN en Vercel.");

  const endpoint = rendererEndpoint(renderer);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: job.id,
        sourceUrl: job.sourceUrl,
        transcript: job.transcript,
        mode: job.mode,
        clips: job.clips.map((clip) => ({
          ...clip,
          start: seconds(clip.start),
          end: seconds(clip.end),
        })),
      }),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = result as { error?: unknown; message?: unknown };
      throw new Error(
        typeof error.error === "string"
          ? error.error
          : typeof error.message === "string"
            ? error.message
            : `Renderer rechazó el trabajo (${response.status}).`,
      );
    }

    return {
      dispatched: true,
      endpoint,
      outputs: normalizeOutputs(result, job.clips.length),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("El renderer tardó demasiado en responder.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const Route = createFileRoute("/api/pipeline/jobs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const id = url.searchParams.get("id");

          if (id) {
            const job = await getJob(id);
            return job ? json(job) : json({ error: "Job not found" }, 404);
          }

          return json({
            jobs: await listJobs(Number(url.searchParams.get("limit") ?? 20)),
          });
        } catch (error) {
          return json(
            { error: error instanceof Error ? error.message : "Database error" },
            500,
          );
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json() as Partial<ClipJob>;

          if (typeof body.sourceUrl !== "string" || !/^https:\/\//i.test(body.sourceUrl)) {
            return json({
              error: "Se requiere una URL HTTPS directa de un video que tengas derecho a procesar.",
            }, 400);
          }

          if (!Array.isArray(body.clips) || body.clips.length < 1 || body.clips.length > 6) {
            return json({ error: "Selecciona entre 1 y 6 momentos." }, 400);
          }

          const clips = body.clips as ClipMoment[];
          const valid = clips.every((clip) => {
            if (!clip || typeof clip !== "object") return false;
            const start = seconds(clip.start);
            const end = seconds(clip.end);
            return Number.isFinite(start)
              && Number.isFinite(end)
              && start >= 0
              && end > start
              && end - start <= 180;
          });

          if (!valid) {
            return json({
              error: "Los tiempos no son válidos. Cada clip debe durar entre 1 y 180 segundos.",
            }, 400);
          }

          const now = new Date().toISOString();
          const job: ClipJob = {
            id: randomUUID(),
            status: "queued",
            sourceUrl: body.sourceUrl,
            transcript: typeof body.transcript === "string"
              ? body.transcript.slice(0, 200000)
              : "",
            mode: body.mode === "short" || body.mode === "long" ? body.mode : "viral",
            clips,
            outputUrl: null,
            error: null,
            createdAt: now,
            updatedAt: now,
          };

          await save(job);

          try {
            const result = await dispatch(job);

            if (!result.dispatched) {
              return json({ job, ...result }, 202);
            }

            const outputs = result.outputs ?? [];
            job.clips = job.clips.map((clip, index) => ({
              ...clip,
              outputUrl: outputs[index]?.url ?? null,
            }));
            job.outputUrl = outputs[0]?.url ?? null;
            job.status = job.outputUrl ? "ready" : "failed";
            job.error = job.outputUrl
              ? null
              : "No se generó un archivo MP4 descargable.";
            job.updatedAt = new Date().toISOString();

            await save(job);
            return json({ job, ...result }, 200);
          } catch (error) {
            job.status = "failed";
            job.error = error instanceof Error ? error.message : "Renderer failed";
            job.updatedAt = new Date().toISOString();
            await save(job);
            return json({ job }, 502);
          }
        } catch (error) {
          return json(
            { error: error instanceof Error ? error.message : "Invalid request" },
            400,
          );
        }
      },
    },
  },
});
