import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { c as clipPoster, d as formatDuration, f as formatUsd, g as platformName, p as formatViews, s as StatusBadge } from "./chrome-B4BW7vq9.mjs";
import { c as Play } from "../_libs/lucide-react.mjs";
import { a as Bar, i as CartesianGrid, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/media-BuULWv3y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PerformanceChart({ data, mode }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	const rows = data.map((point) => ({
		name: point.bucket.slice(5),
		value: mode === "views" ? Number(point.views) : Number(point.amount)
	}));
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64" });
	if (rows.every((row) => row.value === 0)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "grid h-64 place-items-center text-sm text-muted",
		children: "Todavía no hay movimientos en este periodo."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-64",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
				data: rows,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						stroke: "var(--color-border)",
						vertical: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "name",
						stroke: "var(--color-muted)",
						fontSize: 12,
						tickLine: false,
						axisLine: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						stroke: "var(--color-muted)",
						fontSize: 12,
						tickLine: false,
						axisLine: false,
						width: 48
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						cursor: { fill: "rgba(46,255,125,0.06)" },
						contentStyle: {
							background: "var(--color-surface)",
							border: "1px solid var(--color-border)",
							borderRadius: 12
						},
						formatter: (value) => mode === "views" ? formatViews(Number(value ?? 0)) : formatUsd(String(value ?? 0))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						dataKey: "value",
						fill: "var(--color-neon)",
						radius: [
							6,
							6,
							0,
							0
						]
					})
				]
			})
		})
	});
}
function PlatformChart({ data, metric = "money" }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	const rows = data.map((item) => ({
		name: platformName(item.platform_id),
		value: metric === "views" ? Number(item.views) : Number(item.amount)
	}));
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-64",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
				data: rows,
				layout: "vertical",
				margin: { left: 16 },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						stroke: "var(--color-border)",
						horizontal: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						type: "number",
						stroke: "var(--color-muted)",
						fontSize: 12,
						tickLine: false,
						axisLine: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						type: "category",
						dataKey: "name",
						stroke: "var(--color-muted)",
						fontSize: 12,
						width: 120,
						tickLine: false,
						axisLine: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						contentStyle: {
							background: "var(--color-surface)",
							border: "1px solid var(--color-border)",
							borderRadius: 12
						},
						formatter: (value) => metric === "views" ? formatViews(Number(value ?? 0)) : formatUsd(String(value ?? 0))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						dataKey: "value",
						fill: "var(--color-fg)",
						radius: [
							0,
							6,
							6,
							0
						]
					})
				]
			})
		})
	});
}
function ClipPoster({ clip, tall = false }) {
	const poster = clipPoster(clip);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `poster-frame relative overflow-hidden ${tall ? "poster-tall" : ""}`,
		children: [
			poster ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: poster,
				alt: "",
				className: "h-full w-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-full place-items-center px-4 text-center text-sm text-muted",
				children: "Sin miniatura todavía"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute left-3 top-3 rounded-md bg-bg/85 px-2 py-1 text-xs font-bold text-neon",
				children: platformName(clip.platformId)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute right-3 top-3 rounded-md bg-bg/85 px-2 py-1 text-xs font-semibold",
				children: formatDuration(clip.durationSeconds)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "play-badge",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5 fill-current" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/80 to-transparent px-3 pb-10 pt-16 text-lg font-bold leading-tight",
				children: clip.title
			})
		]
	});
}
function ClipGallery({ clips }) {
	if (clips.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Todavía no hay publicaciones en esta vista. Cuando un clipper registre un enlace, la tarjeta sale aquí con su miniatura real."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
		children: clips.map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "card overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipPoster, {
				clip,
				tall: true
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "line-clamp-2 text-sm text-muted",
							children: clip.description || clip.ownerName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { value: clip.status })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [clip.ownerName, clip.channelName ? ` · ${clip.channelName}` : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "stat-value text-2xl",
							children: formatViews(clip.statsVerified ? clip.validViews : clip.publicViews)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [" ", clip.statsVerified ? "vistas válidas" : "vistas observadas, no liquidadas"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-neon",
							children: formatUsd(clip.earning)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "btn btn-primary",
							href: clip.url,
							target: "_blank",
							rel: "noreferrer",
							children: "Abrir"
						})]
					})
				]
			})]
		}, clip.id))
	});
}
//#endregion
export { PlatformChart as i, ClipPoster as n, PerformanceChart as r, ClipGallery as t };
