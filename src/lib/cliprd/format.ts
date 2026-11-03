import { amountToCents } from "./money";

export function formatUsd(amount: string | number): string {
  const cents =
    typeof amount === "number"
      ? Math.round(amount * 100)
      : amountToCents(amount);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  return `${negative ? "-" : ""}US$${dollars}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatViews(value: number): string {
  return new Intl.NumberFormat("es-DO").format(value);
}

export function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAgo(value: string | null): string {
  if (!value) return "sin actividad";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "sin actividad";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function clipPoster(clip: {
  provider: string;
  externalId: string;
  thumbnailUrl?: string | null;
}): string | null {
  if (clip.thumbnailUrl) return clip.thumbnailUrl;
  if (clip.provider === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(clip.externalId)) {
    return `https://i.ytimg.com/vi/${clip.externalId}/hqdefault.jpg`;
  }
  return null;
}

export function maskAccount(value: string): string {
  const digits = value.replace(/\s/g, "");
  if (digits.length <= 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
}
