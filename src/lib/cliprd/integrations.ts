const PLACEHOLDER =
  /^(mi_clave_de_youtube|your[-_ ]?api[-_ ]?key|changeme|xxx+|todo|placeholder|api[-_ ]?key[-_ ]?here|insert[-_ ]?key)$/i;

export type SecretState = "missing" | "placeholder" | "ready";

export function secretState(value: string | undefined): SecretState {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "missing";
  if (PLACEHOLDER.test(trimmed)) return "placeholder";
  return "ready";
}

/** Public TikTok HTML sometimes embeds playCount. It is not an official statistic. */
export function extractTikTokPlayCount(html: string): number | null {
  const match = /"(?:playCount|play_count)"\s*:\s*"?(\d{1,15})"?/.exec(html);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isSafeInteger(value) || value < 0) return null;
  return value;
}
