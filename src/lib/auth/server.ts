/**
 * Self-hosted Better Auth for THIS app (server-only).
 * Configuración simplificada: solo email/password con bcrypt y reset de contraseña.
 */
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { pgliteDialect } from "./pglite-dialect";
import { PREVIEW_ALLOWED_HOSTS } from "./preview";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

const globalAuthRef = globalThis as typeof globalThis & {
  __grokAuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__grokAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__grokAuthPreviewSecret__;
}

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const authDisabled = env("VITE_AUTH_ENABLED") === "false";
export const authConfigured = !authDisabled;

// ── Base URL (EXPLÍCITA) ─────────────────────────────────────────────────
// Se usa directamente la variable de entorno. Vercel la inyecta en producción.
// En desarrollo local, se usa el fallback a localhost.
const baseURL =
  env("BETTER_AUTH_URL") ??
  (process.env.NODE_ENV === "production"
    ? "https://clip-rd.vercel.app" // Fallback de seguridad para producción
    : "http://localhost:8080");

// ── Orígenes de confianza ───────────────────────────────────────────────
const trustedOrigins: string[] = [
  baseURL,
  "https://clip-rd.vercel.app",
  "https://clip-rd-ten.vercel.app",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:3000",
  ...PREVIEW_ALLOWED_HOSTS.map((host) => `https://${host}`),
];

// ── Database ──────────────────────────────────────────────────────────────
const databaseUrl = env("DATABASE_URL");
if (process.env.NODE_ENV === "production" && !databaseUrl) {
  throw new Error(
    "[auth] DATABASE_URL is required in production. Configure a persistent Postgres/Neon database; PGLite is only a local/preview fallback.",
  );
}

const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const SESSION_TOKEN_COOKIE = "__Host-grok-auth.session_token";

// ── Better Auth instance ─────────────────────────────────────────────────
export const auth = betterAuth({
  baseURL, // <-- AHORA ES UNA CADENA FIJA
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,

  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        return await hash(password, 10);
      },
      verify: async ({ password, hash: stored }: { password: string; hash: string }) => {
        return await compare(password, stored);
      },
    },
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Enlace de restablecimiento para ${user.email}: ${url}`);
    },
  },

  session: { cookieCache: { enabled: true, maxAge: 300 } },

  advanced: {
    database: { generateId: "uuid" },
    disableOriginCheck: true,
    disableCSRFCheck: true,
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-grok-auth.session_data" },
      account_data: { name: "__Host-grok-auth.account_data" },
      dont_remember: { name: "__Host-grok-auth.dont_remember" },
    },
  },

  plugins: [
    bearer(),
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
