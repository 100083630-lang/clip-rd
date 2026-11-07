import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/pipeline/health")({
  server: {
    handlers: {
      GET: () => new Response(JSON.stringify({
        ok: true,
        service: "cliprd-pipeline",
        rendererConfigured: Boolean(process.env.CLIPRD_RENDERER_URL),
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        now: new Date().toISOString(),
      }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }),
    },
  },
});
