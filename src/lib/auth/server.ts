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

// ── Base URL (FORZADA EXPLÍCITAMENTE) ─────────────────────────────────────
// En producción, usamos el dominio de Vercel de forma fija.
// En desarrollo, usamos localhost. Esto elimina cualquier dependencia de
// variables de entorno que puedan no estar disponibles.
const baseURL = process.env.NODE_ENV === "production"
  ? "https://clip-rd.vercel.app"
  : "http://localhost:8080";

// Agrega un log para confirmar qué valor se está usando en el servidor.
console.log(`[auth] Inicializando Better Auth con baseURL: ${baseURL}`);

const trustedOrigins: string[] = [
  baseURL,
  "https://clip-rd.vercel.app",
  "https://clip-rd-ten.vercel.app",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  ...PREVIEW_ALLOWED_HOSTS.map((host) => `https://${host}`),
];

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

export const auth = betterAuth({
  baseURL, // <-- AHORA ES UNA CADENA FIJA
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,

  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => await hash(password, 10),
      verify: async ({ password, hash: stored }: { password: string; hash: string }) =>
        await compare(password, stored),
    },
    sendResetPassword: async ({ user, token }) => {
      // Construimos el enlace manualmente usando el baseURL forzado.
      const resetLink = `${baseURL}/reset-password?token=${token}`;
      console.log(`[auth] Enlace de restablecimiento para ${user.email}: ${resetLink}`);
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

  plugins: [bearer(), tanstackStartCookies()],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
