//#region node_modules/.nitro/vite/services/ssr/assets/labels-nxp7TcxZ.js
/** Integer-cent earnings. Rate scale is rate × 10_000 (numeric(12,4)). */
var INITIAL_RATES = {
	tiktok: "0.3000",
	youtube_shorts: "0.8000",
	youtube_video: "1.5000"
};
function rateScale(rate) {
	const trimmed = rate.trim();
	const negative = trimmed.startsWith("-");
	const clean = trimmed.replace(/^[+-]/, "");
	if (!/^\d+(\.\d+)?$/.test(clean)) throw new Error("Tarifa inválida");
	const [whole, frac = ""] = clean.split(".");
	const scale = Number(whole) * 1e4 + Number((frac + "0000").slice(0, 4));
	if (!Number.isSafeInteger(scale)) throw new Error("Tarifa fuera de rango");
	return negative ? -scale : scale;
}
function amountToCents(amount) {
	const trimmed = amount.trim();
	const negative = trimmed.startsWith("-");
	const clean = trimmed.replace(/^[+-]/, "");
	if (!/^\d+(\.\d+)?$/.test(clean)) throw new Error("Monto inválido");
	const [whole, frac = ""] = clean.split(".");
	const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
	if (!Number.isSafeInteger(cents)) throw new Error("Monto fuera de rango");
	return negative ? -cents : cents;
}
function centsToAmount(cents) {
	if (!Number.isSafeInteger(cents)) throw new Error("Monto fuera de rango");
	const negative = cents < 0;
	const abs = Math.abs(cents);
	return `${negative ? "-" : ""}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
/** (views / 1000) × rate, rounded half away from zero to the cent. */
function earningCents(views, rate) {
	if (!Number.isInteger(views)) throw new Error("Las vistas deben ser enteras");
	const scale = rateScale(rate);
	const negative = views < 0 !== scale < 0 && views !== 0 && scale !== 0;
	const product = Math.abs(views) * Math.abs(scale);
	if (!Number.isSafeInteger(product)) throw new Error("Cálculo fuera de rango");
	const cents = Math.floor(product / 1e5) + (product % 1e5 >= 5e4 ? 1 : 0);
	return negative ? -cents : cents;
}
function earningAmount(views, rate) {
	return centsToAmount(earningCents(views, rate));
}
function sumAmounts(values) {
	return centsToAmount(values.reduce((total, value) => total + amountToCents(value), 0));
}
function parseMoneyInput(raw) {
	const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
	if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Monto inválido. Usa hasta 2 decimales.");
	return centsToAmount(amountToCents(normalized));
}
var WORKED_EXAMPLE = [
	{
		label: "TikTok",
		views: 58e3,
		rate: INITIAL_RATES.tiktok
	},
	{
		label: "YouTube Shorts",
		views: 4e4,
		rate: INITIAL_RATES.youtube_shorts
	},
	{
		label: "YouTube Videos",
		views: 2e4,
		rate: INITIAL_RATES.youtube_video
	}
];
var PLATFORM_LABEL = {
	tiktok: "TikTok",
	youtube_shorts: "YouTube Shorts",
	youtube_video: "YouTube Videos"
};
var CLIP_STATUS = {
	pending: "Pendiente",
	in_review: "En revisión",
	verified: "Verificada",
	approved: "Aprobada",
	rejected: "Rechazada",
	suspended: "Suspendida",
	settled: "Liquidada"
};
var PAYOUT_STATUS = {
	pending: "Pendiente",
	approved: "Aprobado",
	processing: "En proceso",
	paid: "Pagado",
	rejected: "Rechazado"
};
var ACCOUNT_STATUS = {
	pending: "Pendiente",
	active: "Activo",
	inactive: "Inactivo",
	suspended: "Suspendido"
};
var TERMS_VERSION = "2026-11-03";
//#endregion
export { PLATFORM_LABEL as a, amountToCents as c, parseMoneyInput as d, rateScale as f, PAYOUT_STATUS as i, centsToAmount as l, CLIP_STATUS as n, TERMS_VERSION as o, sumAmounts as p, INITIAL_RATES as r, WORKED_EXAMPLE as s, ACCOUNT_STATUS as t, earningAmount as u };
