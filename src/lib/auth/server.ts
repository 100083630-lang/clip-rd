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
import { PREVIEW_ALLOWED_HOSTS } from "./preview"; // solo para orígenes de preview

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

// ── Base URL ──────────────────────────────────────────────────────────────
const rawBetterAuthURL = env("BETTER_AUTH_URL");
const explicitBaseURL = rawBetterAuthURL
  ? new URL(rawBetterAuthURL).origin
  : undefined;

const rawVercelURL = env("VERCEL_URL");
const normalizedVercelHost = rawVercelURL
  ?.replace("https://", "")
  .replace("http://", "")
  .replace(/\/$/, "");
const vercelOrigin = normalizedVercelHost
  ? `https://${normalizedVercelHost}`
  : undefined;

const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const APP_ORIGINS: string[] = [
  "https://clip-rd.vercel.app",
  "https://clip-rd-ten.vercel.app",
  ...LOCAL_DEV_ORIGINS,
];

const baseURL = explicitBaseURL ?? {
  allowedHosts: [...previewAllowedHosts, "localhost", "127.0.0.1", "[::1]"],
  protocol: "auto" as const,
  fallback: "http://localhost:8080",
};

const trustedOrigins: string[] = [
  ...(explicitBaseURL ? [explicitBaseURL] : []),
  ...(vercelOrigin ? [vercelOrigin] : []),
  ...previewAllowedHosts,
  ...previewAllowedHosts.flatMap((host) => [`https://${host}`, `http://${host}`]),
  ...APP_ORIGINS,
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
  baseURL,
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,

  trustedOrigins,

  // Solo email/password. Sin OAuth, sin Grok.
  emailAndPassword: {
    enabled: true,
    password: {
      // Hashear nuevas contraseñas con bcrypt (compatible con usuarios existentes)
      hash: async (password: string) => {
        return await hash(password, 10);
      },
      // Verificar contraseñas existentes con bcrypt
      verify: async ({ password, hash: stored }: { password: string; hash: string }) => {
        return await compare(password, stored);
      },
    },
    // Flujo de "Olvidé mi contraseña": Better Auth genera `url` con el token.
    // Reemplaza el console.log por tu proveedor (Resend, SMTP, etc.).
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Enlace de restablecimiento para ${user.email}: ${url}`);
      // Ejemplo con Resend:
      // await resend.emails.send({
      //   from: 'no-reply@tudominio.com',
      //   to: user.email,
      //   subject: 'Restablece tu contraseña',
      //   html: `<a href="${url}">Haz clic aquí</a>`,
      // });
    },
  },

  session: { cookieCache: { enabled: true, maxAge: 300 } },

  advanced: {
    database: { generateId: "uuid" },
    // Recomiendo habilitar estas comprobaciones en producción; las dejo como estaban para no romper tu entorno actual.
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
    // gateIdentitySessions() se elimina si era parte del flujo de Grok.
    // Si lo necesitas para otra cosa, vuelve a añadirlo.
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
