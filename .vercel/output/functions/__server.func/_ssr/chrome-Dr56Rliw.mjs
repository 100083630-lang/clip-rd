import { o as __toESM, r as __exportAll } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { S as Navigate, m as useRouterState, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn, s as __exportAll$1 } from "./ssr.mjs";
import { Jt as number, Qt as string, Vt as _enum, Wt as boolean, Yt as object } from "../_libs/@better-auth/core+[...].mjs";
import { i as signOut, t as authClient } from "./client-1vAx-gM_.mjs";
import { a as PLATFORM_LABEL, c as amountToCents, i as PAYOUT_STATUS, n as CLIP_STATUS, t as ACCOUNT_STATUS } from "./labels-nxp7TcxZ.mjs";
import { t as authMiddleware } from "./middleware-8g9ojEvK.mjs";
import { c as Menu, d as Clapperboard, f as Bell, i as Trophy, l as LayoutDashboard, n as Wallet, o as Settings, p as BadgeDollarSign, r as Users, s as Plus, t as X, u as FileChartColumnIncreasing } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chrome-Dr56Rliw.js
var chrome_Dr56Rliw_exports = /* @__PURE__ */ __exportAll({
	A: () => listClippers,
	B: () => setRate,
	C: () => getClipperDashboard,
	D: () => getReports,
	E: () => getPublicHome,
	F: () => registerClip,
	G: () => updateSettings,
	H: () => syncYoutubeBatch,
	I: () => requestPayout,
	J: () => formatWhen,
	K: () => formatUsd,
	L: () => reviewClip,
	M: () => listInvites,
	N: () => listPayouts,
	O: () => getSettings,
	P: () => recordPayment,
	R: () => savePayoutAccount,
	S: () => getClipDetail,
	T: () => getMyPayments,
	U: () => updateClipper,
	V: () => syncClip,
	W: () => updateMyProfile,
	Y: () => maskAccount,
	_: () => classifyClip,
	a: () => Stat,
	b: () => decidePayout,
	c: () => platformName,
	d: () => useRefresh,
	f: () => Logo,
	g: () => bootstrapProfile,
	h: () => adjustViews,
	i: () => Shell,
	j: () => listClips,
	k: () => listAudit,
	l: () => toCsv,
	m: () => addBonus,
	n: () => PageTitle,
	o: () => StatusBadge,
	p: () => useCurrentUserState,
	q: () => formatViews,
	r: () => PayBadge,
	s: () => downloadText,
	t: () => Authed,
	u: () => toExcel,
	v: () => cliprd_exports,
	w: () => getMyClips,
	x: () => getAdminDashboard,
	y: () => createInvite,
	z: () => setPrize
});
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatUsd(amount) {
	const cents = typeof amount === "number" ? Math.round(amount * 100) : amountToCents(amount);
	const negative = cents < 0;
	const abs = Math.abs(cents);
	const dollars = Math.floor(abs / 100).toLocaleString("en-US");
	return `${negative ? "-" : ""}US$${dollars}.${String(abs % 100).padStart(2, "0")}`;
}
function formatViews(value) {
	return new Intl.NumberFormat("es-DO").format(value);
}
function formatWhen(value) {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value.slice(0, 16);
	return new Intl.DateTimeFormat("es-DO", {
		dateStyle: "medium",
		timeStyle: "short"
	}).format(date);
}
function maskAccount(value) {
	const digits = value.replace(/\s/g, "");
	if (digits.length <= 4) return "••••";
	return `•••• ${digits.slice(-4)}`;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var cliprd_exports = /* @__PURE__ */ __exportAll$1({
	addBonus: () => addBonus,
	adjustViews: () => adjustViews,
	bootstrapProfile: () => bootstrapProfile,
	classifyClip: () => classifyClip,
	createInvite: () => createInvite,
	decidePayout: () => decidePayout,
	getAdminDashboard: () => getAdminDashboard,
	getClipDetail: () => getClipDetail,
	getClipperDashboard: () => getClipperDashboard,
	getMyClips: () => getMyClips,
	getMyPayments: () => getMyPayments,
	getMyProfile: () => getMyProfile,
	getNotifications: () => getNotifications,
	getPublicHome: () => getPublicHome,
	getRanking: () => getRanking,
	getReports: () => getReports,
	getSettings: () => getSettings,
	listAudit: () => listAudit,
	listClippers: () => listClippers,
	listClips: () => listClips,
	listInvites: () => listInvites,
	listPayouts: () => listPayouts,
	markNotificationsRead: () => markNotificationsRead,
	recordPayment: () => recordPayment,
	registerClip: () => registerClip,
	requestPayout: () => requestPayout,
	reviewClip: () => reviewClip,
	savePayoutAccount: () => savePayoutAccount,
	setPrize: () => setPrize,
	setRate: () => setRate,
	syncClip: () => syncClip,
	syncYoutubeBatch: () => syncYoutubeBatch,
	updateClipper: () => updateClipper,
	updateMyProfile: () => updateMyProfile,
	updateSettings: () => updateSettings
});
function parse(schema, input) {
	const result = schema.safeParse(input);
	if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Datos inválidos");
	return result.data;
}
var dateRange = object({
	from: string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	to: string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	platform: _enum([
		"all",
		"tiktok",
		"youtube_shorts",
		"youtube_video"
	]).optional()
});
var getPublicHome = createServerFn({ method: "GET" }).handler(createSsrRpc("4692ff98dcbdb6a1104110f91210f5fe768b8dcf40b2acbd7cc04fd1a38431c7"));
var getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("e13a2e37d2c99884ead70006305403d2c879deaca1e8ef8a577600757551e4ce"));
var bootstrapProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	displayName: string().trim().min(2, "Escribe tu nombre").max(80),
	phone: string().trim().max(30).optional(),
	inviteCode: string().trim().max(40).optional(),
	acceptTerms: boolean()
}), input)).handler(createSsrRpc("f485f47d94a8e5d3aef3b837c0dfefa7ce1f987418195e2be686d3277a8992b6"));
var updateMyProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	displayName: string().trim().min(2).max(80),
	phone: string().trim().max(30).optional(),
	avatarUrl: string().trim().max(400).optional()
}), input)).handler(createSsrRpc("caae159146f16a418cb6d58735a070f5bec486d9125acd66cb696ec0628d1555"));
var getNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("57043fdee9ea270b6740deba2f99549b202f7f2f948ec8e5e3cf044336bb2ea7"));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("747dac6efb87dc5938fcd7a88fb19ccb3f848b926fb127a9e7219fa328e1cd5a"));
var getRanking = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => parse(object({
	platform: _enum([
		"all",
		"tiktok",
		"youtube_shorts",
		"youtube_video"
	]).default("all"),
	period: _enum([
		"all",
		"weekly",
		"monthly"
	]).default("all")
}), input ?? {})).handler(createSsrRpc("eeb961e7cb119b4c605efcbc305d54e6947260eda8846360b297cec88e0df28f"));
var registerClip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	url: string().trim().min(12).max(500),
	title: string().trim().max(180).optional(),
	description: string().trim().max(1e3).optional(),
	publishedOn: string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
	declared: _enum([
		"tiktok",
		"youtube_shorts",
		"youtube_video"
	])
}), input)).handler(createSsrRpc("b636af6068e52884ac90f6fa2fd06bc221d313b06df86d66407c744dd6b510cc"));
var getMyClips = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("90cdbe1dfa0a33ce14b92cb8d91a40ff53c20b22d24e417a6c55d9a44020b300"));
var getClipDetail = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => parse(object({ id: number().int().positive() }), input)).handler(createSsrRpc("a5c4d1bcf3c92699d4a467a9082b3d9bb71ef537d6cbd72ec13d23697f1d711c"));
var getClipperDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("b6fdac589ddc677024c4d29d5ff44b49b0a0ed9186bea95005a7464a4d568305"));
var savePayoutAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	holderName: string().trim().min(3, "Nombre del titular").max(120),
	bankName: string().trim().min(3).max(120),
	accountType: _enum(["ahorro", "corriente"]),
	accountNumber: string().trim().regex(/^\d{6,20}$/, "La cuenta debe tener entre 6 y 20 dígitos")
}), input)).handler(createSsrRpc("4af3fc81b7e29381707cf686c05ccd52fc9349725f61f8f9f3ee1a9c6fcf5f48"));
var requestPayout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	amount: string().trim().min(1).max(20),
	note: string().trim().max(300).optional()
}), input)).handler(createSsrRpc("b5e863344b3760093074d5bf70ced512500c7f2e80f15a3be659e22812d3833f"));
var getMyPayments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("6eb12855e9db1a48e1be288c7c491685c194cd6254f06b2da7eb3c6130c3199a"));
var getAdminDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => parse(dateRange, input ?? {})).handler(createSsrRpc("c3b572b2a6ce076f64b845f5053af9ddb7da5e53a866d223796227d899b6ecad"));
var listClippers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("a6204f9306a95af6d830fd1a4e786814120112760c9d5992cd2238d52f6736fd"));
var updateClipper = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	userId: string().min(1),
	status: _enum([
		"pending",
		"active",
		"inactive",
		"suspended"
	]).optional(),
	displayName: string().trim().min(2).max(80).optional(),
	remove: boolean().optional()
}), input)).handler(createSsrRpc("762558934beddec4fdd5d9ad2fdbeb8c2913ec8ec27a3c4b82c4e460eab5acf3"));
var createInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("bf368105f3b61eda83f55c43523114b5be827a93e01742b2c83cb849d089a972"));
var listInvites = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("96f53f00d4ab2d6c2f7937e79f84ab3c886b06320d89c061db9c4bfe2fea3658"));
var listClips = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => parse(object({
	status: string().optional(),
	platform: string().optional(),
	q: string().trim().max(80).optional(),
	offset: number().int().nonnegative().optional()
}), input ?? {})).handler(createSsrRpc("fd0a880b1f9d8505a42dd1ee874e50767ea043255464d234b62f7cea3754223b"));
var reviewClip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	clipId: number().int().positive(),
	action: _enum([
		"approve",
		"reject",
		"suspend",
		"review",
		"verified",
		"settle"
	]),
	validViews: number().int().nonnegative().optional(),
	justification: string().trim().max(500).optional(),
	reason: string().trim().max(500).optional()
}), input)).handler(createSsrRpc("4417d052bc28253f64b43602892996b2f78a4c6864a88a95bf0c789fdae782b3"));
var classifyClip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	clipId: number().int().positive(),
	platformId: _enum(["youtube_shorts", "youtube_video"])
}), input)).handler(createSsrRpc("f60b1fdf955cc796187610bf89487e5ea8a93a429f49982ce9a1af1ae493510e"));
var adjustViews = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	clipId: number().int().positive(),
	validViews: number().int().nonnegative(),
	justification: string().trim().min(12, "La justificación debe tener al menos 12 caracteres").max(500)
}), input)).handler(createSsrRpc("05196ed710aa5b00fb842eb105907d38e4fe0f6fa39b0e6e2066a3efb05ddc33"));
var syncClip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({ clipId: number().int().positive() }), input)).handler(createSsrRpc("362ac5f46d95d4d2180f47eab68b03c09af590336d9ebc6b981ed8b80c7f219f"));
var syncYoutubeBatch = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("517bc1fdf4f26ad613168926172c9261540eec6fc3ad240a946050d71bf11e3a"));
var listPayouts = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("d8af449e4e4d76beda7d0e24b792715a3c14ff4d65fda889961d4daf30989a6d"));
var decidePayout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	id: number().int().positive(),
	action: _enum([
		"approved",
		"processing",
		"rejected"
	]),
	reason: string().trim().max(400).optional()
}), input)).handler(createSsrRpc("2a0c0bf3bd86f17c7eefc3ab15678df8930b8ae3adca4109938958c01227d1f0"));
var recordPayment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	id: number().int().positive(),
	reference: string().trim().min(3, "Escribe la referencia bancaria").max(80),
	receiptUrl: string().trim().max(400).optional(),
	adminNote: string().trim().max(400).optional()
}), input)).handler(createSsrRpc("4edf0eb6b1ac3e7294a02427b167f6c55105700e3d18c50497c5aff7215872ec"));
var setRate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	platformId: _enum([
		"tiktok",
		"youtube_shorts",
		"youtube_video"
	]),
	amount: string().trim().min(1).max(12),
	note: string().trim().max(200).optional()
}), input)).handler(createSsrRpc("51c019af42f4fa127aa3927e4399fd97dcadb0dd9667e72a78bd2292d51bf97b"));
var addBonus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	userId: string().min(1),
	amount: string().trim().min(1).max(20),
	note: string().trim().min(8, "Describe el premio o la bonificación").max(300)
}), input)).handler(createSsrRpc("898652950c84e78d7a458e9567bfce6c06cd03feb1652400c8913f0fc90d0d65"));
var setPrize = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	scope: _enum([
		"all",
		"tiktok",
		"youtube_shorts",
		"youtube_video"
	]),
	place: number().int().min(1).max(20),
	title: string().trim().min(2).max(80),
	amount: string().trim().max(20).optional(),
	active: boolean()
}), input)).handler(createSsrRpc("b5939970d5e7a84c65774a2684c66eaba79b21f49a8bfd2a1f0c9dad683ac732"));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("e44af557ebba052bd0f0bbe362b554b48c9eace1e777be65c5ea049e8a34e9d0"));
var updateSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	agencyName: string().trim().min(2).max(80),
	slogan: string().trim().min(2).max(120),
	syncIntervalMinutes: number().int().min(15).max(10080),
	minPayout: string().trim().min(1).max(20)
}), input)).handler(createSsrRpc("b547e60ad472fcdaedea7991356d7b1e2a1ceb021ed52a076ac6eeb6621543aa"));
var listAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("5d41a8cd9c633906f9db98ad2745632803cefecfc4bf57384291bf72dddef2a0"));
var getReports = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => parse(object({
	kind: _enum([
		"participants",
		"earnings",
		"platforms",
		"paid",
		"pending",
		"monthly",
		"general"
	]),
	from: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	to: string().regex(/^\d{4}-\d{2}-\d{2}$/)
}), input)).handler(createSsrRpc("74b2f1a5a7340893ac511ce7e423bba3f0f671077e6f3b9a20aaa4455e311ba5"));
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	return useSessionUserState();
}
function useSessionUserState() {
	const { data, isPending } = authClient.useSession();
	const id = data?.user.id;
	const displayName = data?.user.name ?? null;
	const primaryEmail = data?.user.email ?? null;
	const profileImageUrl = data?.user.image ?? null;
	const user = (0, import_react.useMemo)(() => id ? {
		id,
		displayName,
		primaryEmail,
		profileImageUrl,
		isDevFallback: false
	} : null, [
		id,
		displayName,
		primaryEmail,
		profileImageUrl
	]);
	return (0, import_react.useMemo)(() => ({
		user,
		isPending
	}), [user, isPending]);
}
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
function Logo({ size = "md", slogan = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex max-w-full flex-col items-start gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "/brand/cliprd-wordmark.png",
			alt: "CLIPRD",
			className: `${size === "sm" ? "h-8" : size === "lg" ? "h-20 md:h-28" : "h-11"} w-auto max-w-full object-contain`
		}), slogan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[0.65rem] font-bold tracking-[0.16em] text-neon",
			children: "CONVIERTE VISUALIZACIONES EN DINERO"
		}) : null]
	});
}
var ADMIN = [
	{
		to: "/admin",
		label: "Panel",
		icon: LayoutDashboard,
		exact: true
	},
	{
		to: "/admin/clippers",
		label: "Clippers",
		icon: Users
	},
	{
		to: "/admin/clips",
		label: "Publicaciones",
		icon: Clapperboard
	},
	{
		to: "/admin/payments",
		label: "Pagos",
		icon: Wallet
	},
	{
		to: "/admin/rates",
		label: "Tarifas",
		icon: BadgeDollarSign
	},
	{
		to: "/admin/reports",
		label: "Reportes",
		icon: FileChartColumnIncreasing
	},
	{
		to: "/ranking",
		label: "Ranking",
		icon: Trophy
	},
	{
		to: "/admin/settings",
		label: "Ajustes",
		icon: Settings
	}
];
var CLIPPER = [
	{
		to: "/clipper/dashboard",
		label: "Panel",
		icon: LayoutDashboard
	},
	{
		to: "/clipper/register-clip",
		label: "Registrar",
		icon: Plus
	},
	{
		to: "/clipper/my-clips",
		label: "Mis clips",
		icon: Clapperboard
	},
	{
		to: "/clipper/earnings",
		label: "Ganancias",
		icon: BadgeDollarSign
	},
	{
		to: "/clipper/payments",
		label: "Pagos",
		icon: Wallet
	},
	{
		to: "/ranking",
		label: "Ranking",
		icon: Trophy
	},
	{
		to: "/clipper/profile",
		label: "Perfil",
		icon: Users
	}
];
function Boot() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { slogan: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Cargando tu sesión…"
			})]
		})
	});
}
function Authed({ role, children }) {
	const { user, isPending } = useCurrentUserState();
	const profile = useQuery({
		queryKey: ["profile", user?.id],
		enabled: !isPending && Boolean(user),
		queryFn: () => getMyProfile()
	});
	if (isPending || user && profile.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boot, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (profile.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center px-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-md text-muted",
			children: profile.error instanceof Error ? profile.error.message : "Error"
		})
	});
	if (!profile.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/register" });
	if (profile.data.status === "suspended" || profile.data.status === "inactive") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Locked, { profile: profile.data });
	if (role && profile.data.role !== role) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: profile.data.role === "admin" ? "/admin" : "/clipper/dashboard" });
	return children(profile.data);
}
function Locked({ profile }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card w-full max-w-md p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-6 text-2xl",
					children: ["Cuenta ", ACCOUNT_STATUS[profile.status]]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: [profile.displayName, ", tu acceso está detenido. El historial financiero se conserva."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-ghost mt-6",
					onClick: () => void signOut(),
					children: "Salir"
				})
			]
		})
	});
}
function Shell({ profile, children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const path = useRouterState({ select: (state) => state.location.pathname });
	const items = profile.role === "admin" ? ADMIN : CLIPPER;
	const unread = (useQuery({
		queryKey: ["notes", profile.userId],
		queryFn: () => getNotifications()
	}).data ?? []).filter((note) => !note.read_at).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen md:grid md:grid-cols-[240px_1fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "no-print sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur md:h-screen md:border-b-0 md:border-r",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-4 py-3 md:px-5 md:py-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: profile.role === "admin" ? "/admin" : "/clipper/dashboard",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { size: "sm" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost h-11 w-11 px-0 md:hidden",
						onClick: () => setOpen((value) => !value),
						"aria-label": "Menú",
						children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: `${open ? "grid" : "hidden"} gap-1 px-3 pb-4 md:grid`,
					children: items.map((item) => {
						const active = "exact" in item && item.exact ? path === item.to : path.startsWith(item.to);
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							onClick: () => setOpen(false),
							className: `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold ${active ? "bg-surface text-neon" : "text-muted hover:bg-surface hover:text-fg"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
						}, item.to);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden border-t border-border px-4 py-4 md:block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-semibold",
							children: profile.displayName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted",
							children: profile.role === "admin" ? "Administración · Origen Simple" : profile.agencyName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-3 text-sm text-muted underline-offset-4 hover:text-fg hover:underline",
							onClick: () => void signOut(),
							children: "Salir"
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "no-print flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold tracking-[0.16em] text-muted",
					children: "ORIGEN SIMPLE"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/notifications",
					className: "btn btn-ghost relative h-11 px-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-4" }), unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-2 top-2 size-2 rounded-full bg-neon" }) : null]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 py-6 md:px-8 md:py-8",
				children
			})]
		})]
	});
}
function PageTitle({ kicker, title, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-bold tracking-[0.16em] text-neon",
				children: kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 text-3xl md:text-4xl",
				children: title
			}),
			text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: text
			}) : null
		]
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-bold tracking-[0.12em] text-muted uppercase",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "stat-value mt-2 text-2xl md:text-3xl",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: hint
			}) : null
		]
	});
}
function Badge({ value, map }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${value === "approved" || value === "paid" || value === "active" || value === "verified" || value === "settled" ? "text-neon border-neon/40" : value === "rejected" || value === "suspended" ? "text-danger border-danger/40" : value === "in_review" || value === "processing" || value === "pending" ? "text-warn border-warn/40" : "text-muted border-border"}`,
		children: map[value] ?? value
	});
}
function StatusBadge({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		value,
		map: CLIP_STATUS
	});
}
function PayBadge({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		value,
		map: PAYOUT_STATUS
	});
}
function platformName(id) {
	if (!id) return "Bonificación";
	return PLATFORM_LABEL[id] ?? id;
}
function useRefresh() {
	const client = useQueryClient();
	return async () => {
		await client.invalidateQueries();
	};
}
function downloadText(filename, content, mime) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
function toCsv(table) {
	const cell = (value) => `"${value.replaceAll("\"", "\"\"")}"`;
	return [table.columns, ...table.rows].map((row) => row.map(cell).join(",")).join("\n");
}
function toExcel(table) {
	const cell = (value) => `<Cell><Data ss:Type="String">${value.replaceAll("&", "&").replaceAll("<", "<").replaceAll(">", ">")}</Data></Cell>`;
	return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="CLIPRD"><Table>${[table.columns, ...table.rows].map((row) => `<Row>${row.map(cell).join("")}</Row>`).join("")}</Table></Worksheet></Workbook>`;
}
//#endregion
export { listInvites as A, setRate as B, getMyPayments as C, listAudit as D, getSettings as E, registerClip as F, updateClipper as G, syncYoutubeBatch as H, requestPayout as I, useCurrentUserState as J, updateMyProfile as K, reviewClip as L, maskAccount as M, platformName as N, listClippers as O, recordPayment as P, savePayoutAccount as R, getMyClips as S, getReports as T, toCsv as U, syncClip as V, toExcel as W, useRefresh as Y, formatViews as _, Shell as a, getClipDetail as b, addBonus as c, chrome_Dr56Rliw_exports as d, classifyClip as f, formatUsd as g, downloadText as h, PayBadge as i, listPayouts as j, listClips as k, adjustViews as l, decidePayout as m, Logo as n, Stat as o, createInvite as p, updateSettings as q, PageTitle as r, StatusBadge as s, Authed as t, bootstrapProfile as u, formatWhen as v, getPublicHome as w, getClipperDashboard as x, getAdminDashboard as y, setPrize as z };
