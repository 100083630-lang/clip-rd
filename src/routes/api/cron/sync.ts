import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cron/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret) {
          return Response.json(
            { ok: false, error: "CRON_SECRET no está configurada. No hay sincronización automática." },
            { status: 503 },
          );
        }
        if (request.headers.get("authorization") !== `Bearer ${secret}`) {
          return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
        }
        const { runScheduledSync } = await import("@/server/domain.server");
        const result = await runScheduledSync();
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
