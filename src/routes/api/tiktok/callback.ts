import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tiktok/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        const { finishTikTokOAuth } = await import("@/server/domain.server");
        const target = await finishTikTokOAuth({
          userId: user?.id ?? null,
          code: url.searchParams.get("code"),
          state: url.searchParams.get("state"),
          error: url.searchParams.get("error_description") ?? url.searchParams.get("error"),
        });
        return new Response(null, { status: 302, headers: { location: target } });
      },
    },
  },
});
