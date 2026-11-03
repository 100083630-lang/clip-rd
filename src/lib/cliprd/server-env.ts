import { readFileSync } from "node:fs";
import { join } from "node:path";

const ALLOW = new Set([
  "YOUTUBE_API_KEY",
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
  "TIKTOK_REDIRECT_URI",
  "CRON_SECRET",
]);

let loaded = false;

/** Server-only. Reads allowlisted keys from `.env.local` when the process does not already have them. */
export function ensureServerEnv(): void {
  if (loaded) return;
  loaded = true;
  let text = "";
  try {
    text = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (!ALLOW.has(key) || process.env[key]?.trim()) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) process.env[key] = value;
  }
}
