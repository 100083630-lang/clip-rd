import { getSql } from "@/lib/db";
import { extractTikTokPlayCount, secretState, type SecretState } from "@/lib/cliprd/integrations";
import { ensureServerEnv } from "@/lib/cliprd/server-env";

export type OEmbed = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

export type TikTokVideo = {
  id: string;
  title?: string;
  cover_image_url?: string;
  duration?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
};

type TokenBundle = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  open_id?: string;
  scope?: string;
};

export type IntegrationConfig = {
  youtube: SecretState;
  youtubeKey: string | null;
  tiktok: boolean;
  tiktokKey: string | null;
  tiktokSecret: string | null;
  youtubeHint: string | null;
  tiktokHint: string | null;
};

let integrationCache: { at: number; value: IntegrationConfig } | null = null;

export function invalidateIntegrations(): void {
  integrationCache = null;
}

function pickSecret(stored: string | null | undefined, envValue: string | undefined): string {
  const fromDb = stored?.trim() ?? "";
  if (secretState(fromDb) === "ready") return fromDb;
  const fromEnv = envValue?.trim() ?? "";
  return secretState(fromEnv) === "ready" ? fromEnv : fromDb || fromEnv;
}

function hint(value: string): string | null {
  if (secretState(value) !== "ready") return null;
  return `••••${value.slice(-4)}`;
}

export async function loadIntegrations(): Promise<IntegrationConfig> {
  if (integrationCache && Date.now() - integrationCache.at < 10_000) return integrationCache.value;
  ensureServerEnv();
  let stored = {
    youtube_api_key: null as string | null,
    tiktok_client_key: null as string | null,
    tiktok_client_secret: null as string | null,
  };
  try {
    const sql = await getSql();
    const rows = await sql<typeof stored>`
      select youtube_api_key, tiktok_client_key, tiktok_client_secret
      from agency_settings where id = 1
    `;
    if (rows[0]) stored = rows[0];
  } catch {
    // Migration not applied yet. Environment variables still count.
  }
  const youtubeRaw = pickSecret(stored.youtube_api_key, process.env.YOUTUBE_API_KEY);
  const tiktokKeyRaw = pickSecret(stored.tiktok_client_key, process.env.TIKTOK_CLIENT_KEY);
  const tiktokSecretRaw = pickSecret(stored.tiktok_client_secret, process.env.TIKTOK_CLIENT_SECRET);
  const youtube = secretState(youtubeRaw);
  const value: IntegrationConfig = {
    youtube,
    youtubeKey: youtube === "ready" ? youtubeRaw : null,
    tiktok: secretState(tiktokKeyRaw) === "ready" && secretState(tiktokSecretRaw) === "ready",
    tiktokKey: secretState(tiktokKeyRaw) === "ready" ? tiktokKeyRaw : null,
    tiktokSecret: secretState(tiktokSecretRaw) === "ready" ? tiktokSecretRaw : null,
    youtubeHint: hint(youtubeRaw),
    tiktokHint: hint(tiktokKeyRaw),
  };
  integrationCache = { at: Date.now(), value };
  return value;
}

export async function fetchOembed(url: string): Promise<OEmbed | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return (await response.json()) as OEmbed;
  } catch {
    return null;
  }
}

export async function readTikTokPublic(pageUrl: string): Promise<{
  title?: string;
  author?: string;
  thumbnail?: string;
  views: number | null;
}> {
  const embed = await fetchOembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(pageUrl)}`);
  let views: number | null = null;
  try {
    const response = await fetch(pageUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
      headers: {
        accept: "text/html",
        "user-agent": "Mozilla/5.0 (compatible; CLIPRD/1.0; +https://cliprd.app)",
      },
    });
    if (response.ok) {
      const html = (await response.text()).slice(0, 1_500_000);
      views = extractTikTokPlayCount(html);
    }
  } catch {
    views = null;
  }
  return {
    title: embed?.title,
    author: embed?.author_name,
    thumbnail: embed?.thumbnail_url,
    views,
  };
}

function randomUrlSafe(size = 48): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Buffer.from(digest).toString("base64url");
}

export async function buildTikTokAuth(input: { redirectUri: string }): Promise<{
  url: string;
  state: string;
  verifier: string;
}> {
  const { tiktokKey } = await loadIntegrations();
  if (!tiktokKey) throw new Error("Faltan TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET en el servidor.");
  const state = randomUrlSafe(24);
  const verifier = randomUrlSafe(48);
  const challenge = await codeChallenge(verifier);
  const endpoint = new URL("https://www.tiktok.com/v2/auth/authorize/");
  endpoint.searchParams.set("client_key", tiktokKey);
  endpoint.searchParams.set("scope", "user.info.basic,video.list");
  endpoint.searchParams.set("response_type", "code");
  endpoint.searchParams.set("redirect_uri", input.redirectUri);
  endpoint.searchParams.set("state", state);
  endpoint.searchParams.set("code_challenge", challenge);
  endpoint.searchParams.set("code_challenge_method", "S256");
  return { url: endpoint.toString(), state, verifier };
}

async function postToken(body: URLSearchParams): Promise<TokenBundle> {
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(12000),
  });
  const payload = (await response.json().catch(() => null)) as
    | (TokenBundle & { error?: string; error_description?: string })
    | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || `TikTok respondió ${response.status}.`);
  }
  return payload;
}

export async function exchangeTikTokCode(input: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<TokenBundle> {
  const { tiktokKey, tiktokSecret } = await loadIntegrations();
  if (!tiktokKey || !tiktokSecret) throw new Error("La app de TikTok no está configurada.");
  const body = new URLSearchParams({
    client_key: tiktokKey,
    client_secret: tiktokSecret,
    code: input.code,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code_verifier: input.verifier,
  });
  return postToken(body);
}

export async function refreshTikTokToken(refreshToken: string): Promise<TokenBundle> {
  const { tiktokKey, tiktokSecret } = await loadIntegrations();
  if (!tiktokKey || !tiktokSecret) throw new Error("La app de TikTok no está configurada.");
  const body = new URLSearchParams({
    client_key: tiktokKey,
    client_secret: tiktokSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return postToken(body);
}

export async function tiktokProfile(accessToken: string): Promise<{ display_name?: string; open_id?: string }> {
  const endpoint = new URL("https://open.tiktokapis.com/v2/user/info/");
  endpoint.searchParams.set("fields", "open_id,display_name");
  const response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return {};
  const body = (await response.json()) as { data?: { user?: { display_name?: string; open_id?: string } } };
  return body.data?.user ?? {};
}

export async function tiktokVideoPages(
  accessToken: string,
  pages = 3,
): Promise<TikTokVideo[]> {
  const videos: TikTokVideo[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < pages; page += 1) {
    const endpoint = new URL("https://open.tiktokapis.com/v2/video/list/");
    endpoint.searchParams.set(
      "fields",
      "id,title,cover_image_url,duration,view_count,like_count,comment_count,share_count",
    );
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(cursor == null ? { max_count: 20 } : { max_count: 20, cursor }),
      signal: AbortSignal.timeout(12000),
    });
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string; code?: string };
      data?: { videos?: TikTokVideo[]; cursor?: number; has_more?: boolean };
    } | null;
    if (!response.ok || (body?.error?.code && body.error.code !== "ok")) {
      throw new Error(body?.error?.message || `TikTok video.list respondió ${response.status}.`);
    }
    videos.push(...(body?.data?.videos ?? []));
    if (!body?.data?.has_more || body.data.cursor == null) break;
    cursor = body.data.cursor;
  }
  return videos;
}
