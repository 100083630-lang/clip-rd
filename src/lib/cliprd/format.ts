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

export function maskAccount(value: string): string {
  const digits = value.replace(/\s/g, "");
  if (digits.length <= 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
}
