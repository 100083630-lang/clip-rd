import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for this React SPA (browser-side).
 *
 * Talks to this app's OWN Better Auth at same-origin `/api/auth/*`.
 * Auth methods: email/password only (no OAuth, no Grok).
 *
 * To sign out call `signOut()` below, NOT `authClient.signOut()` directly
 * (it clears the bearer token too).
 */
export const authClient = createAuthClient({
  fetchOptions: {
    onRequest(ctx) {
      const token = getBearerToken();
      if (token) ctx.headers.set("Authorization", `Bearer ${token}`);
      return ctx;
    },
  },
});

/**
 * True when sign-in UI should be shown — i.e. whenever `VITE_AUTH_ENABLED` is
 * not `"false"`. The shipped template sets it to `"false"`
 * (`.grok/app-env.json`), which selects the dev user (see `use-current-user`);
 * with the key removed, sign-in is real in preview and when deployed.
 */
export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

// ── Bearer token (kept for middleware / server functions) ────────────────────
// Still used by `@/lib/auth/middleware` to attach a token to server-function
// requests. Empty outside environments that set it, so cookie auth is untouched.
const BEARER_KEY = "grok-auth.bearer-token";

/** The stored bearer token, or null. */
export function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(BEARER_KEY);
  } catch {
    return null;
  }
}

function setBearerToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(BEARER_KEY, token);
    else window.sessionStorage.removeItem(BEARER_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}

/**
 * Redirect to the login page. Kept for API compatibility with callers that
 * previously used the OAuth `signIn()` helper.
 */
export async function signIn(
  _providerId?: string,
  _opts: { callbackURL?: string; errorCallbackURL?: string } = {},
): Promise<void> {
  if (typeof window !== "undefined") window.location.assign("/login");
}

/**
 * Sign out of this app's local session, clear any bearer token, then redirect.
 * Use this, never `authClient.signOut()` directly.
 *
 * Rejects when the server never confirms, so hand-rolled controls can show an
 * error and let the visitor retry.
 */
export async function signOut(redirectTo = "/"): Promise<void> {
  try {
    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message ?? "Sign-out failed");
  } finally {
    setBearerToken(null);
    if (typeof window !== "undefined") window.location.href = redirectTo;
  }
}
