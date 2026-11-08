import { createFileRoute } from "@tanstack/react-router";

function getRendererEndpoint() {
  const raw = process.env.CLIPRD_RENDERER_URL;
  if (!raw) return null;

  const base = raw.replace(/\/+$/, "");
  return base.endsWith("/jobs") ? base : `${base}/jobs`;
}

export const Route = createFileRoute("/api/pipeline/health")({
  server: {
    handlers: {
      GET: () => {
        const body = {
          ok: true,
          service: "cliprd-pipeline",
          rendererConfigured: Boolean(process.env.CLIPRD_RENDERER_URL),
          rendererEndpoint: getRendererEndpoint(),
          rendererTokenConfigured: Boolean(process.env.CLIPRD_RENDERER_TOKEN),
          databaseConfigured: Boolean(process.env.DATABASE_URL),
          storageConfigured: Boolean(
            process.env.SUPABASE_URL &&
            process.env.SUPABASE_SERVICE_ROLE_KEY
          ),
          now: new Date().toISOString(),
        };

        return new Response(JSON.stringify(body), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
