import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/pipeline/health")({
  server: {
    handlers: {
      GET: () => new Response(JSON.stringify({
        ok: true,
        service: "cliprd-pipeline",
        rendererConfigured: Boolean(process.env.CLIPRD_RENDERER_URL),
        rendererEndpoint: process.env.CLIPRD_RENDERER_URL ? process.env.CLIPRD_RENDERER_URL.replace(/\\/+$/, "") + (process.env.CLIPRD_RENDERER_URL.endsWith("/jobs") ? "" : "/jobs") : null,
        rendererTokenConfigured: Boolean(process.env.CLIPRD_RENDERER_TOKEN),
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        storageConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        now: new Date().toISOString(),
      }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }),
    },
  },
});
