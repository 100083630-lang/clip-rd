import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { C as useNavigate, S as Navigate, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-1vAx-gM_.mjs";
import { o as TERMS_VERSION, p as sumAmounts, r as INITIAL_RATES, s as WORKED_EXAMPLE, u as earningAmount } from "./labels-nxp7TcxZ.mjs";
import { O as getPublicHome, a as Shell, b as formatUsd, n as Logo, rt as useCurrentUserState, t as Authed, u as bootstrapProfile } from "./chrome-DatLzJJl.mjs";
import { t as GROK_PROVIDERS } from "./server-XDIrnA8G.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/public-pages-DuJoH3Ts.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PROOF = WORKED_EXAMPLE.map((row) => ({
	...row,
	amount: earningAmount(row.views, row.rate)
}));
function HomePage() {
	const { user, isPending } = useCurrentUserState();
	const home = useQuery({
		queryKey: ["home"],
		queryFn: () => getPublicHome()
	});
	const rates = home.data?.rates?.length ? home.data.rates : [
		{
			id: "tiktok",
			label: "TikTok",
			amount: INITIAL_RATES.tiktok
		},
		{
			id: "youtube_shorts",
			label: "YouTube Shorts",
			amount: INITIAL_RATES.youtube_shorts
		},
		{
			id: "youtube_video",
			label: "YouTube Videos",
			amount: INITIAL_RATES.youtube_video
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem]",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { size: "sm" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 sm:shrink-0",
					children: [
						isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-11 w-28 rounded-md bg-surface" }) : null,
						!isPending && !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							className: "btn btn-ghost",
							children: "Entrar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/register",
							className: "btn btn-primary",
							children: "Crear cuenta"
						})] }) : null,
						!isPending && user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/dashboard",
							className: "btn btn-primary",
							children: "Ir al panel"
						}) : null
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "relative mx-auto max-w-6xl px-4 pb-20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "grid gap-10 py-10 md:grid-cols-[1.25fr_0.75fr] md:py-16",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold tracking-[0.2em] text-neon",
								children: "AGENCIA ORIGEN SIMPLE"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "sr-only",
								children: "CLIPRD"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/brand/cliprd-wordmark.png",
								alt: "",
								className: "mt-6 h-16 w-auto max-w-full md:h-28"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6 max-w-xl text-2xl font-semibold tracking-tight",
								children: "Convierte visualizaciones en dinero."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-xl text-sm leading-6 text-muted",
								children: "Una agencia, dos plataformas, un solo libro. Los clippers registran TikTok y YouTube. La agencia aprueba, liquida solo las vistas nuevas y documenta cada transferencia."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-8 flex flex-wrap gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/register",
									className: "btn btn-primary",
									children: "Abrir cuenta"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/politicas",
									className: "btn btn-ghost",
									children: "Condiciones"
								})]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
							className: "card p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "label",
									children: "Tarifas activas"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-4 space-y-3",
									children: rates.map((rate) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-end justify-between gap-3 border-b border-border pb-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: rate.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "stat-value text-xl text-neon",
											children: [formatUsd(rate.amount), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted",
												children: " / mil"
											})]
										})]
									}, rate.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs text-muted",
									children: "El administrador puede cambiarlas. Lo ya liquidado conserva la tarifa del momento."
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "card p-5 md:p-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl",
								children: "Así se calcula, sin duplicar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-2xl text-sm text-muted",
								children: "Ganancia = (vistas válidas nuevas / 1,000) × tarifa. Una sincronización posterior solo cobra la diferencia. Este ejemplo usa el motor real, no un número escrito a mano."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 grid gap-3 md:grid-cols-3",
								children: PROOF.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "rounded-lg border border-border p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted",
											children: row.label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 stat-value text-2xl",
											children: [row.views.toLocaleString("es-DO"), " vistas"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-neon",
											children: formatUsd(row.amount)
										})
									]
								}, row.label))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-lg",
								children: ["Balance del ejemplo: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-neon",
									children: formatUsd(sumAmounts(PROOF.map((row) => row.amount)))
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-8 grid gap-4 md:grid-cols-3",
						children: [
							["1. Publicas", "Pegas el enlace. CLIPRD valida TikTok o YouTube, rechaza duplicados y pide aprobación."],
							["2. Se verifican", "YouTube Data API trae vistas cuando hay clave. Sin clave, no se inventan números."],
							["3. Se paga", "El clipper pide un retiro. La agencia registra la transferencia manual del banco."]
						].map(([title, text]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "card p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xl",
								children: title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: text
							})]
						}, title))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
						className: "mt-12 flex flex-wrap gap-4 text-sm text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/politicas",
							className: "underline-offset-4 hover:underline",
							children: "Condiciones y antifraude"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Acumular vistas no garantiza un pago." })]
					})
				]
			})
		]
	});
}
function authText(message, fallback) {
	const text = message?.toLowerCase() ?? "";
	if (text.includes("already") || text.includes("exist")) return "Ese correo ya tiene cuenta. Entra con él.";
	if (text.includes("invalid") || text.includes("password") || text.includes("credential")) return "Correo o contraseña incorrectos.";
	if (text.includes("origin")) return "Este origen no está autorizado para entrar.";
	return message || fallback;
}
function LoginPage() {
	const navigate = useNavigate();
	const { user, isPending } = useCurrentUserState();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	if (!isPending && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/dashboard" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card w-full max-w-md p-6 md:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { slogan: true }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-8 text-3xl",
					children: "Entrar"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Administradores y clippers usan la misma puerta. El permiso lo decide el perfil."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-6 space-y-4",
					onSubmit: (event) => {
						event.preventDefault();
						setPending(true);
						setError("");
						authClient.signIn.email({
							email,
							password,
							callbackURL: "/dashboard"
						}).then(async (result) => {
							if (result.error) {
								setError(authText(result.error.message, "No se pudo entrar."));
								setPending(false);
								return;
							}
							await navigate({ to: "/dashboard" });
						});
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Correo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "input",
								type: "email",
								required: true,
								autoComplete: "email",
								value: email,
								onChange: (event) => setEmail(event.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Contraseña"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "input",
								type: "password",
								required: true,
								minLength: 8,
								autoComplete: "current-password",
								value: password,
								onChange: (event) => setPassword(event.target.value)
							})]
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-danger",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn btn-primary w-full",
							type: "submit",
							disabled: pending,
							children: pending ? "Entrando…" : "Entrar"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-5 h-px bg-border" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn btn-ghost w-full",
						onClick: () => void signIn(provider.providerId, { callbackURL: "/dashboard" }),
						children: ["Continuar con ", provider.label]
					}, provider.providerId))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-5 text-sm text-muted",
					children: ["¿Primera vez? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/register",
						className: "text-fg underline-offset-4 hover:underline",
						children: "Crear cuenta"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-muted",
					children: "La recuperación por correo no está activa: no hay un proveedor de email configurado. Las cuentas de Google o X se recuperan en esos servicios. Un clipper de correo debe pedir ayuda a la agencia."
				})
			]
		})
	});
}
function RegisterPage() {
	const navigate = useNavigate();
	const { user, isPending } = useCurrentUserState();
	const profile = useQuery({
		queryKey: ["profile", user?.id],
		enabled: !isPending && Boolean(user),
		queryFn: () => import("./chrome-DatLzJJl.mjs").then((n) => n.d).then((n) => n.v).then((mod) => mod.getMyProfile())
	});
	if (!isPending && user && profile.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/dashboard" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card w-full max-w-md p-6 md:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { slogan: true }),
				isPending || user && profile.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-8 text-sm text-muted",
					children: "Cargando…"
				}) : null,
				!isPending && !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignUpForm, {}) : null,
				user && profile.data === null && !profile.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Onboarding, { onDone: () => {
					navigate({ to: "/dashboard" });
				} }) : null
			]
		})
	});
}
function SignUpForm() {
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-8 space-y-4",
		onSubmit: (event) => {
			event.preventDefault();
			setPending(true);
			setError("");
			authClient.signUp.email({
				name,
				email,
				password,
				callbackURL: "/register"
			}).then((result) => {
				if (result.error) {
					setError(authText(result.error.message, "No se pudo crear la cuenta."));
					setPending(false);
				}
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl",
				children: "Crear cuenta"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "La primera cuenta de la agencia queda como administrador. Las siguientes entran como clippers."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "label",
					children: "Nombre"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "input",
					required: true,
					value: name,
					onChange: (event) => setName(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "label",
					children: "Correo"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "input",
					type: "email",
					required: true,
					value: email,
					onChange: (event) => setEmail(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "label",
					children: "Contraseña"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "input",
					type: "password",
					required: true,
					minLength: 8,
					value: password,
					onChange: (event) => setPassword(event.target.value)
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "btn btn-primary w-full",
				disabled: pending,
				children: pending ? "Creando…" : "Continuar"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["¿Ya tienes cuenta? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "text-fg underline-offset-4 hover:underline",
					children: "Entrar"
				})]
			})
		]
	});
}
function Onboarding({ onDone }) {
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [inviteCode, setInviteCode] = (0, import_react.useState)("");
	const [acceptTerms, setAcceptTerms] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-8 space-y-4",
		onSubmit: (event) => {
			event.preventDefault();
			setPending(true);
			setError("");
			bootstrapProfile({ data: {
				displayName,
				phone,
				inviteCode,
				acceptTerms
			} }).then(() => onDone()).catch((reason) => {
				setError(reason instanceof Error ? reason.message : "No se pudo crear el perfil");
				setPending(false);
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl",
				children: "Tu ficha"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Si nadie administra todavía, esta cuenta abre la agencia. Si ya hay administrador, entras como clipper."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "label",
					children: "Nombre en el ranking"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "input",
					required: true,
					minLength: 2,
					value: displayName,
					onChange: (event) => setDisplayName(event.target.value),
					placeholder: "Sr. Melo"
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
					children: "Invitación, si te la dieron"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "input",
					value: inviteCode,
					onChange: (event) => setInviteCode(event.target.value.toUpperCase()),
					placeholder: "CLIP-XXXXXX"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-start gap-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					className: "mt-1 size-4",
					checked: acceptTerms,
					onChange: (event) => setAcceptTerms(event.target.checked)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"Acepto las ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/politicas",
						className: "underline",
						children: ["condiciones ", TERMS_VERSION]
					}),
					". Sé que las vistas no garantizan el pago."
				] })]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "btn btn-primary w-full",
				disabled: pending || !acceptTerms,
				children: pending ? "Guardando…" : "Entrar a CLIPRD"
			})
		]
	});
}
function PoliciesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-3xl px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-8 text-4xl",
				children: "Condiciones de participación"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					"Versión ",
					TERMS_VERSION,
					". Agencia Origen Simple."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-6 text-sm leading-6 text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Derechos de autor"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Solo se registra material cuyo uso y distribución hayan sido autorizados por sus titulares, incluido el contenido de Alofoke Radio Show y otras fuentes que la agencia declare. CLIPRD no concede esa autorización." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Reglas de publicación"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Cada enlace se valida, se identifica y se compara con los ya registrados. Un video no puede pertenecer a dos cuentas. Los duplicados se rechazan." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Aprobación"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Un clip nace pendiente. El administrador puede pasarlo a revisión, verificado, aprobado, rechazado, suspendido o liquidado. Sin aprobación no hay vistas válidas." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Reproducciones válidas"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Las vistas públicas de YouTube solo cuentan como verificadas si llegan de YouTube Data API. TikTok, sin OAuth oficial, no aporta vistas verificadas. Un ajuste manual exige justificación y nunca se presenta como dato de la API. Cada sincronización suma solo las vistas nuevas." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Liquidación"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "La ganancia es (vistas válidas nuevas / 1,000) × la tarifa vigente en ese momento. Esa tarifa queda copiada en el movimiento. Cambiarla después no reescribe el pasado. El pago es una transferencia bancaria manual; el sistema solo la documenta." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl text-fg",
						children: "Antifraude"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Se marcan enlaces repetidos, videos caídos o privados, saltos anormales de vistas y registros sin evidencia. La agencia puede congelar vistas, rechazar un clip o suspender una cuenta. Acumular reproducciones no garantiza monetización ni un pago." })] })
				]
			})
		]
	});
}
function DashboardGate() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Authed, { children: (profile) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: profile.role === "admin" ? "/admin" : "/clipper/dashboard" }) });
}
function RankingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Authed, { children: (profile) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		profile,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankingBody, {})
	}) });
}
function RankingBody() {
	const [platform, setPlatform] = (0, import_react.useState)("all");
	const [period, setPeriod] = (0, import_react.useState)("all");
	const query = useQuery({
		queryKey: [
			"rank",
			platform,
			period
		],
		queryFn: () => import("./chrome-DatLzJJl.mjs").then((n) => n.d).then((n) => n.v).then((mod) => mod.getRanking({ data: {
			platform,
			period
		} }))
	});
	const rows = query.data?.ranking ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-bold tracking-[0.16em] text-neon",
				children: "COMPETENCIA"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 text-4xl",
				children: "Ranking"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap gap-2",
			children: [[
				"all",
				"tiktok",
				"youtube_shorts",
				"youtube_video"
			].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: `btn ${platform === item ? "btn-primary" : "btn-ghost"}`,
				onClick: () => setPlatform(item),
				children: item === "all" ? "General" : item === "tiktok" ? "TikTok" : item === "youtube_shorts" ? "Shorts" : "Videos"
			}, item)), [
				"all",
				"weekly",
				"monthly"
			].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: `btn ${period === item ? "btn-primary" : "btn-ghost"}`,
				onClick: () => setPeriod(item),
				children: item === "all" ? "Histórico" : item === "weekly" ? "Semanal" : "Mensual"
			}, item))]
		}),
		rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Cuando haya clippers activos con movimientos, el ranking se llena solo."
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "space-y-3",
			children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: `card flex items-center gap-4 p-4 ${row.place <= 3 ? "border-neon/50" : ""}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "stat-value w-8 text-2xl text-neon",
						children: row.place
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-11 place-items-center rounded-full bg-surface-2 font-bold",
						children: row.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: row.avatarUrl,
							alt: "",
							className: "size-11 rounded-full object-cover"
						}) : row.displayName.slice(0, 1)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-semibold",
							children: row.displayName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								row.posts,
								" publicaciones · mejor: ",
								row.bestPlatform ?? "—"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "stat-value",
							children: formatUsd(row.earnings)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [row.views.toLocaleString("es-DO"), " vistas"]
						})]
					})
				]
			}, row.userId))
		}),
		query.data?.prizes?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl",
				children: "Premios configurados"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2 text-sm text-muted",
				children: query.data.prizes.filter((prize) => prize.active).map((prize) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					prize.scope,
					" · puesto ",
					prize.place,
					": ",
					prize.title,
					" ",
					prize.amount ? formatUsd(prize.amount) : ""
				] }, prize.id))
			})]
		}) : null
	] });
}
function NotificationsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Authed, { children: (profile) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		profile,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Notes, {})
	}) });
}
function Notes() {
	const query = useQuery({
		queryKey: ["notes"],
		queryFn: () => import("./chrome-DatLzJJl.mjs").then((n) => n.d).then((n) => n.v).then((mod) => mod.getNotifications())
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-4 flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-4xl",
			children: "Avisos"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "btn btn-ghost",
			onClick: () => {
				import("./chrome-DatLzJJl.mjs").then((n) => n.d).then((n) => n.v).then((mod) => mod.markNotificationsRead()).then(() => query.refetch());
			},
			children: "Marcar leídos"
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [(query.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "No tienes avisos."
		}) : null, (query.data ?? []).map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "card p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg",
					children: note.title
				}), !note.read_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-neon",
					children: "Nuevo"
				}) : null]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: note.body
			})]
		}, note.id))]
	})] });
}
//#endregion
export { PoliciesPage as a, NotificationsPage as i, HomePage as n, RankingPage as o, LoginPage as r, RegisterPage as s, DashboardGate as t };
