/** Integer-cent earnings. Rate scale is rate × 10_000 (numeric(12,4)). */

export const INITIAL_RATES = {
  tiktok: "0.3000",
  youtube_shorts: "0.8000",
  youtube_video: "1.5000",
} as const;

export function rateScale(rate: string): number {
  const trimmed = rate.trim();
  const negative = trimmed.startsWith("-");
  const clean = trimmed.replace(/^[+-]/, "");
  if (!/^\d+(\.\d+)?$/.test(clean)) throw new Error("Tarifa inválida");
  const [whole, frac = ""] = clean.split(".");
  const scale = Number(whole) * 10_000 + Number((frac + "0000").slice(0, 4));
  if (!Number.isSafeInteger(scale)) throw new Error("Tarifa fuera de rango");
  return negative ? -scale : scale;
}

export function amountToCents(amount: string): number {
  const trimmed = amount.trim();
  const negative = trimmed.startsWith("-");
  const clean = trimmed.replace(/^[+-]/, "");
  if (!/^\d+(\.\d+)?$/.test(clean)) throw new Error("Monto inválido");
  const [whole, frac = ""] = clean.split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isSafeInteger(cents)) throw new Error("Monto fuera de rango");
  return negative ? -cents : cents;
}

export function centsToAmount(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error("Monto fuera de rango");
  const negative = cents < 0;
  const abs = Math.abs(cents);
  return `${negative ? "-" : ""}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** (views / 1000) × rate, rounded half away from zero to the cent. */
export function earningCents(views: number, rate: string): number {
  if (!Number.isInteger(views)) throw new Error("Las vistas deben ser enteras");
  const scale = rateScale(rate);
  const negative = views < 0 !== scale < 0 && views !== 0 && scale !== 0;
  const product = Math.abs(views) * Math.abs(scale);
  if (!Number.isSafeInteger(product)) throw new Error("Cálculo fuera de rango");
  const quotient = Math.floor(product / 100_000);
  const remainder = product % 100_000;
  const cents = quotient + (remainder >= 50_000 ? 1 : 0);
  return negative ? -cents : cents;
}

export function earningAmount(views: number, rate: string): string {
  return centsToAmount(earningCents(views, rate));
}

export function sumAmounts(values: string[]): string {
  return centsToAmount(values.reduce((total, value) => total + amountToCents(value), 0));
}

export function parseMoneyInput(raw: string): string {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Monto inválido. Usa hasta 2 decimales.");
  }
  return centsToAmount(amountToCents(normalized));
}

export const WORKED_EXAMPLE = [
  { label: "TikTok", views: 58_000, rate: INITIAL_RATES.tiktok },
  { label: "YouTube Shorts", views: 40_000, rate: INITIAL_RATES.youtube_shorts },
  { label: "YouTube Videos", views: 20_000, rate: INITIAL_RATES.youtube_video },
] as const;
