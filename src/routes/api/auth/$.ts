import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", request.headers.get("origin") ?? "*");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Vary", "Origin");
  return headers;
}

async function withCors(request: Request): Promise<Response> {
  const response = await auth.handler(request);
  const headers = corsHeaders(request);
  response.headers.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => new Response(null, { status: 204, headers: corsHeaders(request) }),
      GET: ({ request }) => withCors(request),
      POST: ({ request }) => withCors(request),
    },
  },
});
