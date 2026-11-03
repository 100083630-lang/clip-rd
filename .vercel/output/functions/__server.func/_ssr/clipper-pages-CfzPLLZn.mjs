import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { w as useSearch, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as getMyPayments, E as getMyClips, H as requestPayout, L as maskAccount, R as platformName, S as formatWhen, T as getClipperDashboard, V as registerClip, W as savePayoutAccount, Y as syncMyTikTok, a as Shell, b as formatUsd, g as disconnectTikTok, i as PayBadge, it as useRefresh, j as getTikTokStatus, o as Stat, q as startTikTokConnect, r as PageTitle, s as StatusBadge, tt as updateMyProfile, w as getClipDetail, x as formatViews } from "./chrome-DatLzJJl.mjs";
import { n as ClipPoster, r as PerformanceChart, t as ClipGallery } from "./media-D0St-m_B.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clipper-pages-CfzPLLZn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function fail(error) {
	toast.error(error instanceof Error ? error.message : "No se pudo completar");
}
function ClipperHome({ profile }) {
	const data = useQuery({
		queryKey: ["clipper-home"],
		queryFn: () => getClipperDashboard()
	});
	const clips = useQuery({
		queryKey: ["my-clips"],
		queryFn: () => getMyClips()
	});
	const dash = data.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-bold tracking-[0.18em] text-neon",
				children: "BIENVENIDO A CLIPRD"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-14 place-items-center overflow-hidden rounded-full bg-surface-2 text-xl font-bold",
					children: profile.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						alt: "",
						src: profile.avatarUrl,
						className: "size-14 object-cover"
					}) : profile.displayName.slice(0, 1)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-4xl",
					children: profile.displayName
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: profile.agencyName
				})] })]
			}),
			profile.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 rounded-lg border border-warn/40 px-4 py-3 text-sm text-warn",
				children: "Tu cuenta espera aprobación. Puedes ver el panel, pero no registrar clips ni pedir pagos."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Reproducciones",
						value: formatViews(dash?.views ?? 0),
						hint: "Vistas válidas aprobadas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Ganancias",
						value: formatUsd(dash?.balance.earned ?? "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Disponible",
						value: formatUsd(dash?.balance.available ?? "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Pagos recibidos",
						value: formatUsd(dash?.received ?? "0"),
						hint: `Pendientes ${formatUsd(dash?.balance.pending ?? "0")}`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/clipper/register-clip",
					search: { platform: "tiktok" },
					className: "btn btn-primary",
					children: "Registrar clip de TikTok"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/clipper/register-clip",
					search: { platform: "youtube" },
					className: "btn btn-ghost",
					children: "Registrar clip de YouTube"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "card mt-6 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 text-xl",
					children: "Rendimiento"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PerformanceChart, {
					data: dash?.series ?? [],
					mode: "money"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-xl",
					children: "Clips recientes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipGallery, { clips: (clips.data ?? []).slice(0, 6) })]
			})
		]
	});
}
function RegisterClipPage({ profile }) {
	const refresh = useRefresh();
	const search = useSearch({ from: "/clipper/register-clip" });
	const [declared, setDeclared] = (0, import_react.useState)(search.platform === "youtube" ? "youtube_shorts" : "tiktok");
	const [url, setUrl] = (0, import_react.useState)("");
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [publishedOn, setPublishedOn] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [pending, setPending] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "NUEVO CLIP",
			title: "Registrar publicación",
			text: "El enlace se valida y se busca duplicado. Las vistas solo se marcan verificadas si las entrega la API."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "card grid max-w-2xl gap-4 p-5",
			onSubmit: (event) => {
				event.preventDefault();
				setPending(true);
				registerClip({ data: {
					url,
					title,
					description,
					publishedOn,
					declared
				} }).then((result) => {
					toast.success(result.statsVerified ? "Clip guardado con estadísticas de YouTube." : "Clip guardado. Las vistas no están verificadas.");
					result.warnings.forEach((warning) => toast.message(warning));
					setUrl("");
					setTitle("");
					setDescription("");
					return refresh();
				}).catch(fail).finally(() => setPending(false));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Plataforma"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "select",
						value: declared,
						onChange: (event) => setDeclared(event.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "tiktok",
								children: "TikTok"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "youtube_shorts",
								children: "YouTube Shorts"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "youtube_video",
								children: "YouTube Videos"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Enlace"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input",
						required: true,
						placeholder: "https://",
						value: url,
						onChange: (event) => setUrl(event.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Nombre del clip"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input",
						value: title,
						onChange: (event) => setTitle(event.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Fecha de publicación"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "input",
						type: "date",
						required: true,
						value: publishedOn,
						onChange: (event) => setPublishedOn(event.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "label",
						children: "Descripción"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "textarea",
						value: description,
						onChange: (event) => setDescription(event.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn btn-primary",
					disabled: pending || profile.status !== "active",
					children: pending ? "Validando…" : "Enviar a revisión"
				})
			]
		})]
	});
}
function MyClipsPage({ profile }) {
	const clips = useQuery({
		queryKey: ["my-clips"],
		queryFn: () => getMyClips()
	});
	const [open, setOpen] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "ARCHIVO",
			title: "Mis publicaciones"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [(clips.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Todavía no registras clips."
			}) : null, (clips.data ?? []).map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "card overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipPoster, { clip }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg",
								children: clip.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									platformName(clip.platformId),
									" · ",
									clip.publishedOn ?? "sin fecha"
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { value: clip.status })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-muted",
									children: "Públicas"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-value",
									children: formatViews(clip.publicViews)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-muted",
									children: "Válidas"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-value",
									children: formatViews(clip.validViews)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-muted",
									children: "Ganancia"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-value",
									children: formatUsd(clip.earning)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-muted",
									children: "Fuente"
								}), sourceLabel(clip.statsSource, clip.statsVerified)] })
							]
						}),
						clip.statsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-warn",
							children: clip.statsError
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost mt-3",
							onClick: () => setOpen(open === clip.id ? null : clip.id),
							children: "Estadísticas"
						}),
						open === clip.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipFacts, { id: clip.id }) : null
					]
				})]
			}, clip.id))]
		})]
	});
}
function sourceLabel(source, verified) {
	if (source === "youtube_api" && verified) return "YouTube Data API";
	if (source === "admin_adjustment") return "Ajuste manual";
	if (source === "oembed") return "Metadato, sin vistas";
	if (source === "tiktok_api") return "TikTok video.list";
	return "Sin verificar";
}
function ClipFacts({ id }) {
	const detail = useQuery({
		queryKey: ["clip", id],
		queryFn: () => getClipDetail({ data: { id } })
	});
	if (!detail.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-3 text-sm text-muted",
		children: "Cargando historial…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-3 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "underline",
				href: detail.data.clip.url,
				target: "_blank",
				rel: "noreferrer",
				children: "Abrir publicación"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted",
				children: [
					"Canal: ",
					detail.data.clip.channelName ?? "—",
					" · Duración: ",
					detail.data.clip.durationSeconds ?? "—",
					" s · Clasificación: ",
					detail.data.clip.classification
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-semibold",
				children: "Historial"
			}),
			detail.data.history.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted",
				children: [
					formatWhen(row.at),
					" · públicas ",
					formatViews(row.publicViews),
					" · válidas ",
					formatViews(row.validViews),
					" · ",
					row.source,
					" ",
					row.note ? `· ${row.note}` : ""
				]
			}, row.at)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-semibold",
				children: "Movimientos"
			}),
			detail.data.earnings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: "Sin ganancias todavía."
			}) : null,
			detail.data.earnings.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted",
				children: [
					formatWhen(row.at),
					" · ",
					row.delta.toLocaleString("es-DO"),
					" vistas · tarifa ",
					row.rate,
					" · ",
					formatUsd(row.amount)
				]
			}, row.at + row.amount))
		]
	});
}
function EarningsPage({ profile }) {
	const data = useQuery({
		queryKey: ["pay"],
		queryFn: () => getMyPayments()
	});
	const ledger = data.data?.ledger ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "LIBRO",
				title: "Ganancias",
				text: "Cada fila es un movimiento nuevo. Actualizar vistas no vuelve a sumar el historial."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Acumuladas",
						value: formatUsd(data.data?.balance.earned ?? "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Disponibles",
						value: formatUsd(data.data?.balance.available ?? "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "En solicitudes",
						value: formatUsd(data.data?.balance.committed ?? "0")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [ledger.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Aún no hay movimientos."
				}) : null, ledger.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "card grid gap-1 p-4 text-sm md:grid-cols-[1fr_auto]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: row.title ?? "Bonificación"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted",
							children: [
								platformName(row.platform_id),
								" · ",
								row.kind,
								" · ",
								formatWhen(row.created_at)
							]
						}),
						row.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted",
							children: row.note
						}) : null
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "stat-value text-xl",
						children: formatUsd(row.amount)
					})]
				}, row.id))]
			})
		]
	});
}
function PaymentsPage({ profile }) {
	const refresh = useRefresh();
	const data = useQuery({
		queryKey: ["pay"],
		queryFn: () => getMyPayments()
	});
	const account = data.data?.account;
	const [holderName, setHolderName] = (0, import_react.useState)("");
	const [bankName, setBankName] = (0, import_react.useState)("Banco Popular Dominicano");
	const [accountType, setAccountType] = (0, import_react.useState)("ahorro");
	const [accountNumber, setAccountNumber] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "CLIPRD PAYMENTS",
				title: "Pagos",
				text: "El botón no transfiere dinero. Registra la solicitud y la agencia paga por transferencia."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "card space-y-3 p-5",
					onSubmit: (event) => {
						event.preventDefault();
						savePayoutAccount({ data: {
							holderName: holderName || account?.holderName || "",
							bankName,
							accountType,
							accountNumber
						} }).then(() => {
							toast.success("Cuenta guardada");
							return refresh();
						}).catch(fail);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl",
							children: "Cuenta bancaria"
						}),
						account ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								"Actual: ",
								account.bankName,
								" · ",
								maskAccount(account.accountNumber)
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Titular"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "input",
								required: true,
								defaultValue: account?.holderName,
								onChange: (event) => setHolderName(event.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Banco"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "input",
								value: bankName,
								onChange: (event) => setBankName(event.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Tipo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "select",
								value: accountType,
								onChange: (event) => setAccountType(event.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "ahorro",
									children: "Ahorro"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "corriente",
									children: "Corriente"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Número"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "input",
								inputMode: "numeric",
								required: true,
								minLength: 6,
								value: accountNumber,
								onChange: (event) => setAccountNumber(event.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn btn-ghost",
							type: "submit",
							children: "Guardar cuenta"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "card space-y-3 p-5",
					onSubmit: (event) => {
						event.preventDefault();
						requestPayout({ data: {
							amount,
							note
						} }).then(() => {
							toast.success("Solicitud enviada");
							setAmount("");
							return refresh();
						}).catch(fail);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl",
							children: "Solicitar retiro"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								"Disponible ",
								formatUsd(data.data?.balance.available ?? "0"),
								" · mínimo ",
								formatUsd(data.data?.minimum ?? "10")
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Monto USD"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "input",
								required: true,
								value: amount,
								onChange: (event) => setAmount(event.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Nota"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "input",
								value: note,
								onChange: (event) => setNote(event.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn btn-primary",
							type: "submit",
							disabled: profile.status !== "active",
							children: "Pedir pago"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 space-y-2",
				children: (data.data?.requests ?? []).map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "card p-4 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "stat-value text-xl",
								children: formatUsd(request.amount)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayBadge, { value: request.status })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-muted",
							children: [
								formatWhen(request.created_at),
								" ",
								request.reference ? `· Ref. ${request.reference}` : ""
							]
						}),
						request.rejection_reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-danger",
							children: request.rejection_reason
						}) : null,
						request.receipt_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "underline",
							href: request.receipt_url,
							children: "Comprobante"
						}) : null
					]
				}, request.id))
			})
		]
	});
}
function ProfilePage({ profile }) {
	const refresh = useRefresh();
	const [displayName, setDisplayName] = (0, import_react.useState)(profile.displayName);
	const [phone, setPhone] = (0, import_react.useState)(profile.phone ?? "");
	const [avatarUrl, setAvatarUrl] = (0, import_react.useState)(profile.avatarUrl ?? "");
	const tiktok = useQuery({
		queryKey: ["tiktok-status"],
		queryFn: () => getTikTokStatus()
	});
	(0, import_react.useEffect)(() => {
		const params = new URLSearchParams(window.location.search);
		const flag = params.get("tiktok");
		if (flag === "ok") toast.success("TikTok conectado. Las vistas oficiales salen de video.list.");
		if (flag === "error") toast.error(params.get("msg") || "No se pudo conectar TikTok.");
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		profile,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
				kicker: "FICHA",
				title: "Perfil"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "card max-w-xl space-y-3 p-5",
				onSubmit: (event) => {
					event.preventDefault();
					updateMyProfile({ data: {
						displayName,
						phone,
						avatarUrl
					} }).then(() => {
						toast.success("Perfil actualizado");
						return refresh();
					}).catch(fail);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Nombre"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							value: displayName,
							onChange: (event) => setDisplayName(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Teléfono"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							value: phone,
							onChange: (event) => setPhone(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Foto https"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "input",
							value: avatarUrl,
							onChange: (event) => setAvatarUrl(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: ["Correo de acceso: ", profile.email]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-primary",
						type: "submit",
						children: "Guardar"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "card mt-4 max-w-xl space-y-3 p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl",
						children: "TikTok"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: tiktok.data?.connected ? `Cuenta autorizada${tiktok.data.name ? `: ${tiktok.data.name}` : ""}. video.list lee tus reproducciones. No se inventan.` : tiktok.data?.appReady ? "La app está lista. Autoriza tu cuenta para verificar vistas. Sin eso, una cifra pública no se paga." : "La agencia todavía no cargó TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET. Puedes registrar enlaces, pero las vistas no quedan verificadas."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-primary",
								disabled: !tiktok.data?.appReady,
								onClick: () => {
									startTikTokConnect().then((result) => {
										window.location.href = result.url;
									}).catch(fail);
								},
								children: tiktok.data?.connected ? "Reconectar" : "Conectar TikTok"
							}),
							tiktok.data?.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-ghost",
								onClick: () => {
									syncMyTikTok().then((result) => toast.message(`Actualizados ${result.synced}. ${result.errors.join(" ")}`)).catch(fail);
								},
								children: "Actualizar vistas"
							}) : null,
							tiktok.data?.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-danger",
								onClick: () => {
									disconnectTikTok().then(() => refresh()).catch(fail);
								},
								children: "Desconectar"
							}) : null
						]
					})
				]
			})
		]
	});
}
//#endregion
export { ProfilePage as a, PaymentsPage as i, EarningsPage as n, RegisterClipPage as o, MyClipsPage as r, ClipperHome as t };
