import { createFileRoute } from "@tanstack/react-router";

const disabled = () => Response.json(
  { error: "Authentication is temporarily disabled while CLIPRD is rebuilt." },
  { status: 503, headers: { "Cache-Control": "no-store" } },
);

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204 }),
      GET: disabled,
      POST: disabled,
    },
  },
});
