export type ParsedClipUrl =
  | {
      ok: true;
      provider: "tiktok";
      videoId: string | null;
      shortLink: boolean;
      normalized: string;
    }
  | {
      ok: true;
      provider: "youtube";
      videoId: string;
      shortsPath: boolean;
      normalized: string;
    }
  | { ok: false; error: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function hostOf(url: URL): string {
  return url.hostname.replace(/^www\./, "").toLowerCase();
}

export function parseClipUrl(raw: string): ParsedClipUrl {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "El enlace no es una URL válida." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Solo se aceptan enlaces http o https." };
  }
  const host = hostOf(url);

  if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    return parseYoutube(url, host);
  }
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const match = url.pathname.match(/\/video\/(\d{8,22})/);
    const shortLink =
      host.startsWith("vm.") || host.startsWith("vt.") || /^\/t\/[^/]+/.test(url.pathname);
    return {
      ok: true,
      provider: "tiktok",
      videoId: match?.[1] ?? null,
      shortLink,
      normalized: url.toString(),
    };
  }
  return { ok: false, error: "Solo se aceptan enlaces de TikTok o YouTube." };
}

function parseYoutube(url: URL, host: string): ParsedClipUrl {
  let videoId = "";
  let shortsPath = false;
  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (url.pathname.startsWith("/shorts/")) {
    shortsPath = true;
    videoId = url.pathname.split("/")[2] ?? "";
  } else if (url.pathname.startsWith("/embed/")) {
    videoId = url.pathname.split("/")[2] ?? "";
  } else if (url.pathname.startsWith("/live/")) {
    return { ok: false, error: "Los enlaces de YouTube Live no se registran como clips." };
  } else {
    videoId = url.searchParams.get("v") ?? "";
  }
  videoId = videoId.slice(0, 11);
  if (!YOUTUBE_ID.test(videoId)) {
    return { ok: false, error: "No se identificó un video de YouTube en ese enlace." };
  }
  const normalized = shortsPath
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;
  return { ok: true, provider: "youtube", videoId, shortsPath, normalized };
}

export function parseIsoDuration(iso: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return null;
  if (!match[1] && !match[2] && !match[3]) return null;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

/** Shorts URL is authoritative. Over 3 minutes cannot be a Short. Otherwise unknown. */
export function classifyYoutube(input: {
  shortsPath: boolean;
  durationSeconds: number | null;
}): "youtube_shorts" | "youtube_video" | "unknown" {
  if (input.durationSeconds != null && input.durationSeconds > 180) return "youtube_video";
  if (input.shortsPath) return "youtube_shorts";
  return "unknown";
}
