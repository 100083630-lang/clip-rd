import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { a as PLATFORM_LABEL, p as sumAmounts, s as WORKED_EXAMPLE, t as ACCOUNT_STATUS, u as earningAmount } from "./labels-nxp7TcxZ.mjs";
import { $ as toExcel, A as getSettings, B as recordPayment, C as getAdminDashboard, F as listInvites, G as setPrize, I as listPayouts, J as syncClip, K as setRate, M as listAudit, N as listClippers, P as listClips, Q as toCsv, R as platformName, S as formatWhen, U as reviewClip, X as syncTiktokBatch, Z as syncYoutubeBatch, _ as downloadText, a as Shell, b as formatUsd, c as addBonus, et as updateClipper, f as classifyClip, h as decidePayout, i as PayBadge, it as useRefresh, k as getReports, l as adjustViews, m as createInvite, nt as updateSettings, o as Stat, r as PageTitle, s as StatusBadge, v as formatAgo, x as formatViews, z as probeYoutube } from "./chrome-DatLzJJl.mjs";
import { i as PlatformChart, n as ClipPoster, r as PerformanceChart, t as ClipGallery } from "./media-D0St-m_B.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-pages-Dzn_oV8G.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function fail(error) {
	toast.error(error instanceof Error ? error.message : "No se pudo completar");
}
function AdminHome({ profile }) {
	const [platform, setPlatform] = (0, import_react.useState)("all");
	const [from, setFrom] = (0, import_react.useState)("1970-01-01");
	const [to, setTo] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [chart, setChart] = (0, import_react.useState)("daily");
	const data = useQuery({
		queryKey: [
			"admin-home",
			platform,
			from,
			to
		],
		queryFn: () => getAdminDashboard({ data: {
			platform,
			from,
			to
		} })
	});
	const recent = useQuery({
		queryKey: [
			"admin-clips",
			"",
			"",
			"home"
		],
		queryFn: () => listClips({ data: {
			status: "",
			platform: "",
			q: "",
			offset: 0
		} })
	});
	const cards = data.data?.cards;
	const series = chart === "daily" ? data.data?.daily : chart === "weekly" ? data.data?.weekly : data.data?.monthly;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "AGENCIA",
				title: "Panel",
				text: "Los totales de dinero salen del libro de movimientos, no de una suma repetida de vistas."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "select max-w-48",
						value: platform,
						onChange: (event) => setPlatform(event.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "all",
								children: "Todas"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "tiktok",
								children: "TikTok"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "youtube_shorts",
								children: "Shorts"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "youtube_video",
								children: "Videos"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input max-w-40",
						type: "date",
						value: from,
						onChange: (event) => setFrom(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input max-w-40",
						type: "date",
						value: to,
						onChange: (event) => setTo(event.target.value)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Clippers",
						value: String(cards?.clippers ?? 0),
						hint: `${cards?.activeClippers ?? 0} activos`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Publicaciones",
						value: String(cards?.posts ?? 0),
						hint: `${cards?.pendingPosts ?? 0} por revisar`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Vistas del periodo",
						value: formatViews(cards?.views ?? 0),
						hint: "Solo deltas liquidados"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Ganancias",
						value: formatUsd(cards?.earned ?? "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "TikTok",
						value: formatViews(cards?.tiktokViews ?? 0),
						hint: "Stock aprobado"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Shorts",
						value: formatViews(cards?.shortsViews ?? 0),
						hint: "Stock aprobado"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Videos",
						value: formatViews(cards?.videoViews ?? 0),
						hint: "Stock aprobado"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Pagos hechos",
						value: formatUsd(cards?.paid ?? "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Pagos abiertos",
						value: formatUsd(cards?.pendingPay ?? "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Por liquidar",
						value: formatUsd(cards?.outstanding ?? "0"),
						hint: "Ganado menos pagado en el periodo"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "card p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-3 flex gap-2",
							children: [
								"daily",
								"weekly",
								"monthly"
							].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `btn ${chart === item ? "btn-primary" : "btn-ghost"}`,
								onClick: () => setChart(item),
								children: item === "daily" ? "Diario" : item === "weekly" ? "Semanal" : "Mensual"
							}, item))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PerformanceChart, {
							data: series ?? [],
							mode: "money"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "card p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 text-xl",
							children: "Ganancias por plataforma"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformChart, { data: data.data?.platforms ?? [] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "card p-4 lg:col-span-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-2 text-xl",
								children: "Reproducciones por plataforma"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs text-muted",
								children: "Stock de vistas válidas en clips aprobados. No es una suma repetida del historial."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformChart, {
								data: data.data?.platforms ?? [],
								metric: "views"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-xl",
					children: "Clippers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: (data.data?.leaders ?? []).map((leader) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: leader.display_name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "stat-value",
							children: [
								formatUsd(leader.amount),
								" · ",
								formatViews(Number(leader.views))
							]
						})]
					}, leader.display_name))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-xl",
					children: "Clips recientes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipGallery, { clips: (recent.data ?? []).slice(0, 6) })]
			})
		]
	});
}
function ClippersPage({ profile }) {
	const refresh = useRefresh();
	const rows = useQuery({
		queryKey: ["clippers"],
		queryFn: () => listClippers()
	});
	const invites = useQuery({
		queryKey: ["invites"],
		queryFn: () => listInvites()
	});
	const [bonusFor, setBonusFor] = (0, import_react.useState)(null);
	const [amount, setAmount] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [q, setQ] = (0, import_react.useState)("");
	const visible = (rows.data ?? []).filter((clipper) => {
		return `${clipper.display_name} ${clipper.email ?? ""}`.toLowerCase().includes(q.trim().toLowerCase());
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "EQUIPO",
				title: "Clippers",
				text: "La primera cuenta es el administrador. Las demás entran pendientes, salvo que usen una invitación."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-primary mb-4",
				onClick: () => {
					createInvite().then((invite) => {
						toast.success(`Invitación ${invite.code}`);
						return refresh();
					}).catch(fail);
				},
				children: "Crear invitación"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 space-y-1 text-sm text-muted",
				children: (invites.data ?? []).map((invite) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					invite.code,
					" · vence ",
					formatWhen(invite.expires_at),
					" · ",
					invite.used_by ? "usada" : "libre"
				] }, invite.code))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "input mb-4 max-w-sm",
				placeholder: "Buscar clipper",
				value: q,
				onChange: (event) => setQ(event.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
				children: visible.map((clipper) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: `card p-4 ${clipper.status === "active" ? "glow-active" : ""}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 text-lg font-bold text-neon",
								children: clipper.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									alt: "",
									src: clipper.avatar_url,
									className: "size-12 rounded-full object-cover"
								}) : clipper.display_name.slice(0, 1)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "truncate text-lg",
										children: clipper.display_name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-xs text-muted",
										children: clipper.email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs font-semibold text-neon",
										children: ACCOUNT_STATUS[clipper.status] ?? clipper.status
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: [
								"Este mes: ",
								clipper.month_posts,
								" clips · ",
								formatViews(Number(clipper.month_views)),
								" vistas válidas"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"Último ",
								formatAgo(clipper.last_at),
								" · total ",
								formatUsd(clipper.earned)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "select max-w-44",
									value: clipper.status,
									"aria-label": `Estado de ${clipper.display_name}`,
									onChange: (event) => {
										const status = event.target.value;
										updateClipper({ data: {
											userId: clipper.user_id,
											status
										} }).then(() => refresh()).catch(fail);
									},
									children: Object.keys(ACCOUNT_STATUS).map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: status,
										children: ACCOUNT_STATUS[status]
									}, status))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-ghost",
									onClick: () => setBonusFor(clipper.user_id),
									children: "Bono"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-danger",
									onClick: () => {
										updateClipper({ data: {
											userId: clipper.user_id,
											remove: true
										} }).then(() => refresh()).catch(fail);
									},
									children: "Eliminar"
								})
							]
						}),
						bonusFor === clipper.user_id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-3 grid gap-2 md:grid-cols-[8rem_1fr_auto]",
							onSubmit: (event) => {
								event.preventDefault();
								addBonus({ data: {
									userId: clipper.user_id,
									amount,
									note
								} }).then(() => {
									toast.success("Bonificación registrada");
									setBonusFor(null);
									return refresh();
								}).catch(fail);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "input",
									placeholder: "10.00",
									value: amount,
									onChange: (event) => setAmount(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "input",
									placeholder: "Motivo del premio",
									value: note,
									onChange: (event) => setNote(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn btn-primary",
									type: "submit",
									children: "Aplicar"
								})
							]
						}) : null
					]
				}, clipper.user_id))
			})
		]
	});
}
function ClipsAdminPage({ profile }) {
	const refresh = useRefresh();
	const [status, setStatus] = (0, import_react.useState)("");
	const [platform, setPlatform] = (0, import_react.useState)("");
	const [q, setQ] = (0, import_react.useState)("");
	const clips = useQuery({
		queryKey: [
			"admin-clips",
			status,
			platform,
			q
		],
		queryFn: () => listClips({ data: {
			status,
			platform,
			q
		} })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "REVISIÓN",
				title: "Publicaciones"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input max-w-56",
						placeholder: "Buscar",
						value: q,
						onChange: (event) => setQ(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "select max-w-40",
						value: status,
						onChange: (event) => setStatus(event.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Estado"
						}), [
							"pending",
							"in_review",
							"verified",
							"approved",
							"rejected",
							"suspended",
							"settled"
						].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item,
							children: item
						}, item))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "select max-w-48",
						value: platform,
						onChange: (event) => setPlatform(event.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Plataforma"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "tiktok",
								children: "TikTok"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "youtube_shorts",
								children: "Shorts"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "youtube_video",
								children: "Videos"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => void syncYoutubeBatch().then((result) => toast.message(`YouTube: ${result.synced}. ${result.errors.join(" ")}`)).catch(fail),
						children: "Sincronizar YouTube"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => void syncTiktokBatch().then((result) => toast.message(`TikTok: ${result.synced}. ${result.errors.join(" ")}`)).catch(fail),
						children: "Sincronizar TikTok"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: (clips.data ?? []).map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "card overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipPoster, { clip }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipReview, {
						clipId: clip.id,
						title: clip.title,
						owner: clip.ownerName,
						status: clip.status,
						platform: clip.platformId,
						classification: clip.classification,
						provider: clip.provider,
						publicViews: clip.publicViews,
						validViews: clip.validViews,
						verified: clip.statsVerified,
						source: clip.statsSource,
						error: clip.statsError,
						onDone: refresh
					})]
				}, clip.id))
			})
		]
	});
}
function ClipReview(props) {
	const [views, setViews] = (0, import_react.useState)(String(props.verified ? props.publicViews : props.validViews));
	const [text, setText] = (0, import_react.useState)("");
	const act = (action) => {
		reviewClip({ data: {
			clipId: props.clipId,
			action,
			validViews: Number(views),
			justification: text,
			reason: text
		} }).then(() => props.onDone()).catch(fail);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg",
					children: props.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [
						props.owner,
						" · ",
						platformName(props.platform),
						" · ",
						props.classification,
						" · ",
						props.source,
						props.verified ? " · verificado" : " · no verificado"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { value: props.status })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm",
				children: [
					"Públicas ",
					formatViews(props.publicViews),
					" · válidas ",
					formatViews(props.validViews)
				]
			}),
			props.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-warn",
				children: props.error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-2 md:grid-cols-[8rem_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "input",
					inputMode: "numeric",
					value: views,
					onChange: (event) => setViews(event.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "input",
					placeholder: "Justificación o motivo",
					value: text,
					onChange: (event) => setText(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => act("approve"),
						children: "Aprobar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => act("review"),
						children: "Revisión"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => act("verified"),
						children: "Verificada"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => act("settle"),
						children: "Liquidada"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-danger",
						onClick: () => act("reject"),
						children: "Rechazar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-danger",
						onClick: () => act("suspend"),
						children: "Suspender"
					}),
					props.provider === "youtube" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => void classifyClip({ data: {
								clipId: props.clipId,
								platformId: "youtube_shorts"
							} }).then(() => props.onDone()).catch(fail),
							children: "Es Short"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => void classifyClip({ data: {
								clipId: props.clipId,
								platformId: "youtube_video"
							} }).then(() => props.onDone()).catch(fail),
							children: "Es video"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => void syncClip({ data: { clipId: props.clipId } }).then((result) => toast.message(result.message)).catch(fail),
							children: "Sincronizar"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => void syncClip({ data: { clipId: props.clipId } }).then((result) => toast.message(result.message)).catch(fail),
						children: "Sincronizar TikTok"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => {
							adjustViews({ data: {
								clipId: props.clipId,
								validViews: Number(views),
								justification: text
							} }).then(() => props.onDone()).catch(fail);
						},
						children: "Ajustar vistas"
					})
				]
			})
		]
	});
}
function PaymentsAdminPage({ profile }) {
	const refresh = useRefresh();
	const rows = useQuery({
		queryKey: ["payouts"],
		queryFn: () => listPayouts()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "TESORERÍA",
			title: "Pagos",
			text: "Registrar una transferencia no mueve dinero. Documenta el pago que ya hiciste en el banco."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: (rows.data ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayoutCard, {
				row,
				onDone: refresh
			}, row.id))
		})]
	});
}
function PayoutCard({ row, onDone }) {
	const [reference, setReference] = (0, import_react.useState)("");
	const [receiptUrl, setReceiptUrl] = (0, import_react.useState)("");
	const [reason, setReason] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card p-4 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg",
						children: row.display_name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: [
							formatWhen(row.created_at),
							" · ",
							row.bank_name ?? "sin cuenta",
							" · ",
							row.account_type ?? "",
							" · ",
							row.account_number ?? ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: ["Titular ", row.holder_name ?? "—"]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "stat-value text-2xl",
						children: formatUsd(row.amount)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayBadge, { value: row.status })]
				})]
			}),
			row.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2",
				children: ["Referencia ", row.reference]
			}) : null,
			row.status !== "paid" && row.status !== "rejected" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input",
						placeholder: "Referencia bancaria",
						value: reference,
						onChange: (event) => setReference(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input",
						placeholder: "Enlace https del comprobante",
						value: receiptUrl,
						onChange: (event) => setReceiptUrl(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input",
						placeholder: "Motivo si rechazas",
						value: reason,
						onChange: (event) => setReason(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost",
								onClick: () => void decidePayout({ data: {
									id: row.id,
									action: "approved"
								} }).then(() => onDone()).catch(fail),
								children: "Aprobar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost",
								onClick: () => void decidePayout({ data: {
									id: row.id,
									action: "processing"
								} }).then(() => onDone()).catch(fail),
								children: "En proceso"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-danger",
								onClick: () => void decidePayout({ data: {
									id: row.id,
									action: "rejected",
									reason
								} }).then(() => onDone()).catch(fail),
								children: "Rechazar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-primary",
								onClick: () => void recordPayment({ data: {
									id: row.id,
									reference,
									receiptUrl
								} }).then(() => onDone()).catch(fail),
								children: "Registrar transferencia"
							})
						]
					})
				]
			}) : null
		]
	});
}
function RatesPage({ profile }) {
	const refresh = useRefresh();
	const settings = useQuery({
		queryKey: ["settings"],
		queryFn: () => getSettings()
	});
	const [amounts, setAmounts] = (0, import_react.useState)({});
	const proof = WORKED_EXAMPLE.map((row) => earningAmount(row.views, row.rate));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "MOTOR",
				title: "Tarifas",
				text: "Una tarifa nueva no reescribe ganancias anteriores. El ejemplo de control debe dar US$79.40."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-4 text-lg",
				children: [
					"Comprobación: ",
					proof.join(" + "),
					" = ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-neon",
						children: formatUsd(sumAmounts(proof))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: (settings.data?.rates ?? []).map((rate) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "card grid items-end gap-3 p-4 md:grid-cols-[1fr_10rem_auto]",
					onSubmit: (event) => {
						event.preventDefault();
						setRate({ data: {
							platformId: rate.platform_id,
							amount: amounts[rate.platform_id] || rate.amount,
							note: "Cambio desde el panel"
						} }).then(() => {
							toast.success("Tarifa guardada");
							return refresh();
						}).catch(fail);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: PLATFORM_LABEL[rate.platform_id]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"Vigente ",
								rate.amount,
								" desde ",
								formatWhen(rate.effective_from)
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							defaultValue: rate.amount,
							onChange: (event) => setAmounts((current) => ({
								...current,
								[rate.platform_id]: event.target.value
							}))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn btn-primary",
							type: "submit",
							children: "Guardar"
						})
					]
				}, rate.platform_id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrizeForm, { onDone: refresh })
		]
	});
}
function PrizeForm({ onDone }) {
	const [scope, setScope] = (0, import_react.useState)("all");
	const [place, setPlace] = (0, import_react.useState)(1);
	const [title, setTitle] = (0, import_react.useState)("Premio");
	const [amount, setAmount] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "card mt-6 grid gap-3 p-4 md:grid-cols-4",
		onSubmit: (event) => {
			event.preventDefault();
			setPrize({ data: {
				scope,
				place,
				title,
				amount,
				active: true
			} }).then(() => onDone()).catch(fail);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "select",
				value: scope,
				onChange: (event) => setScope(event.target.value),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "all",
						children: "General"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "tiktok",
						children: "TikTok"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "youtube_shorts",
						children: "Shorts"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "youtube_video",
						children: "Videos"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "input",
				type: "number",
				min: 1,
				max: 20,
				value: place,
				onChange: (event) => setPlace(Number(event.target.value))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "input",
				value: title,
				onChange: (event) => setTitle(event.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "btn btn-ghost",
				type: "submit",
				children: ["Guardar premio ", amount ? "" : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "input md:col-span-2",
				placeholder: "Monto opcional",
				value: amount,
				onChange: (event) => setAmount(event.target.value)
			})
		]
	});
}
function ReportsPage({ profile }) {
	const [kind, setKind] = (0, import_react.useState)("general");
	const [from, setFrom] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date(Date.now() - 2592e6)).toISOString().slice(0, 10));
	const [to, setTo] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [table, setTable] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "ARCHIVO",
				title: "Reportes"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print mb-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "select max-w-64",
						value: kind,
						onChange: (event) => setKind(event.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "participants",
								children: "Por participante"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "earnings",
								children: "Ganancias"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "platforms",
								children: "Por plataforma"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "paid",
								children: "Pagos realizados"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "pending",
								children: "Pagos pendientes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "monthly",
								children: "Mensual"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "general",
								children: "General"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input max-w-40",
						type: "date",
						value: from,
						onChange: (event) => setFrom(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input max-w-40",
						type: "date",
						value: to,
						onChange: (event) => setTo(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => void getReports({ data: {
							kind,
							from,
							to
						} }).then(setTable).catch(fail),
						children: "Generar"
					}),
					table ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => downloadText(`${kind}.csv`, toCsv(table), "text/csv"),
							children: "CSV"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => downloadText(`${kind}.xls`, toExcel(table), "application/vnd.ms-excel"),
							children: "Excel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => window.print(),
							children: "PDF"
						})
					] }) : null
				]
			}),
			table ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportView, { table }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Elige un reporte. El PDF sale del diálogo de impresión del navegador."
			})
		]
	});
}
function ReportView({ table }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-3 text-2xl",
			children: table.title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2 md:hidden",
			children: table.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
				className: "card p-3 text-sm",
				children: row.map((cell, cellIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted",
					children: [table.columns[cellIndex], ": "]
				}), cell] }, cellIndex))
			}, index))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hidden overflow-x-auto md:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: table.columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "border-b border-border px-2 py-2 text-muted",
					children: column
				}, column)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: table.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: row.map((cell, cellIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "border-b border-border px-2 py-2",
					children: cell
				}, cellIndex)) }, index)) })]
			})
		})
	] });
}
function SettingsPage({ profile }) {
	const refresh = useRefresh();
	const data = useQuery({
		queryKey: ["settings"],
		queryFn: () => getSettings()
	});
	const audit = useQuery({
		queryKey: ["audit"],
		queryFn: () => listAudit()
	});
	const settings = data.data?.settings;
	const [agencyName, setAgencyName] = (0, import_react.useState)("Origen Simple");
	const [slogan, setSlogan] = (0, import_react.useState)("CONVIERTE VISUALIZACIONES EN DINERO.");
	const [syncIntervalMinutes, setSync] = (0, import_react.useState)(360);
	const [minPayout, setMin] = (0, import_react.useState)("10.00");
	(0, import_react.useEffect)(() => {
		if (!settings) return;
		setAgencyName(settings.agency_name);
		setSlogan(settings.slogan);
		setSync(settings.sync_interval_minutes);
		setMin(settings.min_payout);
	}, [settings]);
	const env = data.data?.env;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "SISTEMA",
				title: "Ajustes",
				text: "Las claves nunca se escriben aquí ni viajan al navegador. Van en el entorno del servidor al publicar."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "card grid max-w-2xl gap-3 p-5",
				onSubmit: (event) => {
					event.preventDefault();
					updateSettings({ data: {
						agencyName,
						slogan,
						syncIntervalMinutes: Number(syncIntervalMinutes),
						minPayout
					} }).then(() => {
						toast.success("Ajustes guardados");
						return refresh();
					}).catch(fail);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Agencia"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							value: agencyName,
							onChange: (event) => setAgencyName(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Eslogan"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							value: slogan,
							onChange: (event) => setSlogan(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Minutos entre sincronizaciones"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							type: "number",
							min: 15,
							value: syncIntervalMinutes,
							onChange: (event) => setSync(Number(event.target.value))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Retiro mínimo USD"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							value: minPayout,
							onChange: (event) => setMin(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-primary",
						type: "submit",
						children: "Guardar"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 grid gap-3 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "card p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg",
								children: "YouTube"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: env?.youtube === "ready" ? "YOUTUBE_API_KEY real. videos.list está listo." : env?.youtube === "placeholder" ? "Hay un marcador, no una clave de Google. No se simulan vistas ni se llama a la API." : "Falta YOUTUBE_API_KEY. No se simulan vistas."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs text-muted",
								children: ["Cuota usada hoy: ", settings?.youtube_quota_day === (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) ? settings?.youtube_quota_used : 0]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost mt-3",
								onClick: () => void probeYoutube().then((result) => toast.message(result.message)).catch(fail),
								children: "Probar YouTube"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "card p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg",
							children: "TikTok"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: env?.tiktok ? "Hay claves de app. Cada clipper autoriza video.list desde su perfil. Sin esa autorización no hay vistas oficiales." : "Sin TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET. Solo se valida el enlace y, si responde, el oEmbed público. Una cifra leída de la página no se liquida sola."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "card p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg",
							children: "Base y cron"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted",
							children: [
								env?.database,
								". Cron: ",
								env?.cron ? "CRON_SECRET presente" : "sin CRON_SECRET, POST /api/cron/sync responde 503",
								"."
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Cómo configurar las APIs"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "YouTube: crea un proyecto en Google Cloud, activa YouTube Data API v3 y genera una API key. Sustituye el marcador por esa clave en el servidor (YOUTUBE_API_KEY) y pulsa Probar YouTube. Cada videos.list cuesta 1 unidad. CLIPRD se detiene cerca de 9,500 unidades diarias." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "TikTok: crea una app en developers.tiktok.com con Login Kit y el permiso video.list. Define TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET y, si el dominio público es fijo, TIKTOK_REDIRECT_URI apuntando a /api/tiktok/callback. Cada clipper conecta su cuenta. Hasta entonces las cifras de la página pública no se pagan." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Sincronización: un programador puede llamar POST /api/cron/sync con Authorization Bearer y CRON_SECRET. Sin ese secreto el endpoint no corre." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "La moneda operativa es USD. La seguridad de cada fila está en el servidor: un clipper solo recibe sus clips, su cuenta y sus pagos. No hay claves en el navegador." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl",
					children: "Auditoría"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 space-y-2 text-sm",
					children: (audit.data ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: [
							formatWhen(row.created_at),
							" · ",
							row.actor_name ?? row.actor_id,
							" · ",
							row.action,
							" · ",
							row.entity,
							" ",
							row.entity_id ?? ""
						]
					}, row.id))
				})]
			})
		]
	});
}
//#endregion
export { RatesPage as a, PaymentsAdminPage as i, ClippersPage as n, ReportsPage as o, ClipsAdminPage as r, SettingsPage as s, AdminHome as t };
