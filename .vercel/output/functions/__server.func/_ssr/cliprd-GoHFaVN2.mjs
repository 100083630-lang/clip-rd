import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { Jt as number, Qt as string, Vt as _enum, Wt as boolean, Yt as object } from "../_libs/@better-auth/core+[...].mjs";
import { t as authMiddleware } from "./middleware-BHTnssx1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cliprd-GoHFaVN2.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var getPublicHome_createServerFn_handler = createServerRpc({
	id: "4692ff98dcbdb6a1104110f91210f5fe768b8dcf40b2acbd7cc04fd1a38431c7",
	name: "getPublicHome",
	filename: "src/server/cliprd.ts"
}, (opts) => getPublicHome.__executeServer(opts));
var getPublicHome = createServerFn({ method: "GET" }).handler(getPublicHome_createServerFn_handler, async (...args) => {
	const { getPublicHome: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getMyProfile_createServerFn_handler = createServerRpc({
	id: "e13a2e37d2c99884ead70006305403d2c879deaca1e8ef8a577600757551e4ce",
	name: "getMyProfile",
	filename: "src/server/cliprd.ts"
}, (opts) => getMyProfile.__executeServer(opts));
var getMyProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyProfile_createServerFn_handler, async (...args) => {
	const { getMyProfile: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var bootstrapProfile_createServerFn_handler = createServerRpc({
	id: "f485f47d94a8e5d3aef3b837c0dfefa7ce1f987418195e2be686d3277a8992b6",
	name: "bootstrapProfile",
	filename: "src/server/cliprd.ts"
}, (opts) => bootstrapProfile.__executeServer(opts));
var bootstrapProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	displayName: string().trim().min(2, "Escribe tu nombre").max(80),
	phone: string().trim().max(30).optional(),
	inviteCode: string().trim().max(40).optional(),
	acceptTerms: boolean()
}), input)).handler(bootstrapProfile_createServerFn_handler, async (...args) => {
	const { bootstrapProfile: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var updateMyProfile_createServerFn_handler = createServerRpc({
	id: "caae159146f16a418cb6d58735a070f5bec486d9125acd66cb696ec0628d1555",
	name: "updateMyProfile",
	filename: "src/server/cliprd.ts"
}, (opts) => updateMyProfile.__executeServer(opts));
var updateMyProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	displayName: string().trim().min(2).max(80),
	phone: string().trim().max(30).optional(),
	avatarUrl: string().trim().max(400).optional()
}), input)).handler(updateMyProfile_createServerFn_handler, async (...args) => {
	const { updateMyProfile: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getNotifications_createServerFn_handler = createServerRpc({
	id: "57043fdee9ea270b6740deba2f99549b202f7f2f948ec8e5e3cf044336bb2ea7",
	name: "getNotifications",
	filename: "src/server/cliprd.ts"
}, (opts) => getNotifications.__executeServer(opts));
var getNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getNotifications_createServerFn_handler, async (...args) => {
	const { getNotifications: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var markNotificationsRead_createServerFn_handler = createServerRpc({
	id: "747dac6efb87dc5938fcd7a88fb19ccb3f848b926fb127a9e7219fa328e1cd5a",
	name: "markNotificationsRead",
	filename: "src/server/cliprd.ts"
}, (opts) => markNotificationsRead.__executeServer(opts));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(markNotificationsRead_createServerFn_handler, async (...args) => {
	const { markNotificationsRead: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getRanking_createServerFn_handler = createServerRpc({
	id: "eeb961e7cb119b4c605efcbc305d54e6947260eda8846360b297cec88e0df28f",
	name: "getRanking",
	filename: "src/server/cliprd.ts"
}, (opts) => getRanking.__executeServer(opts));
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
}), input ?? {})).handler(getRanking_createServerFn_handler, async (...args) => {
	const { getRanking: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var registerClip_createServerFn_handler = createServerRpc({
	id: "b636af6068e52884ac90f6fa2fd06bc221d313b06df86d66407c744dd6b510cc",
	name: "registerClip",
	filename: "src/server/cliprd.ts"
}, (opts) => registerClip.__executeServer(opts));
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
}), input)).handler(registerClip_createServerFn_handler, async (...args) => {
	const { registerClip: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getMyClips_createServerFn_handler = createServerRpc({
	id: "90cdbe1dfa0a33ce14b92cb8d91a40ff53c20b22d24e417a6c55d9a44020b300",
	name: "getMyClips",
	filename: "src/server/cliprd.ts"
}, (opts) => getMyClips.__executeServer(opts));
var getMyClips = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyClips_createServerFn_handler, async (...args) => {
	const { getMyClips: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getClipDetail_createServerFn_handler = createServerRpc({
	id: "a5c4d1bcf3c92699d4a467a9082b3d9bb71ef537d6cbd72ec13d23697f1d711c",
	name: "getClipDetail",
	filename: "src/server/cliprd.ts"
}, (opts) => getClipDetail.__executeServer(opts));
var getClipDetail = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => parse(object({ id: number().int().positive() }), input)).handler(getClipDetail_createServerFn_handler, async (...args) => {
	const { getClipDetail: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getClipperDashboard_createServerFn_handler = createServerRpc({
	id: "b6fdac589ddc677024c4d29d5ff44b49b0a0ed9186bea95005a7464a4d568305",
	name: "getClipperDashboard",
	filename: "src/server/cliprd.ts"
}, (opts) => getClipperDashboard.__executeServer(opts));
var getClipperDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getClipperDashboard_createServerFn_handler, async (...args) => {
	const { getClipperDashboard: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var savePayoutAccount_createServerFn_handler = createServerRpc({
	id: "4af3fc81b7e29381707cf686c05ccd52fc9349725f61f8f9f3ee1a9c6fcf5f48",
	name: "savePayoutAccount",
	filename: "src/server/cliprd.ts"
}, (opts) => savePayoutAccount.__executeServer(opts));
var savePayoutAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	holderName: string().trim().min(3, "Nombre del titular").max(120),
	bankName: string().trim().min(3).max(120),
	accountType: _enum(["ahorro", "corriente"]),
	accountNumber: string().trim().regex(/^\d{6,20}$/, "La cuenta debe tener entre 6 y 20 dígitos")
}), input)).handler(savePayoutAccount_createServerFn_handler, async (...args) => {
	const { savePayoutAccount: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var requestPayout_createServerFn_handler = createServerRpc({
	id: "b5e863344b3760093074d5bf70ced512500c7f2e80f15a3be659e22812d3833f",
	name: "requestPayout",
	filename: "src/server/cliprd.ts"
}, (opts) => requestPayout.__executeServer(opts));
var requestPayout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	amount: string().trim().min(1).max(20),
	note: string().trim().max(300).optional()
}), input)).handler(requestPayout_createServerFn_handler, async (...args) => {
	const { requestPayout: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getMyPayments_createServerFn_handler = createServerRpc({
	id: "6eb12855e9db1a48e1be288c7c491685c194cd6254f06b2da7eb3c6130c3199a",
	name: "getMyPayments",
	filename: "src/server/cliprd.ts"
}, (opts) => getMyPayments.__executeServer(opts));
var getMyPayments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyPayments_createServerFn_handler, async (...args) => {
	const { getMyPayments: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getAdminDashboard_createServerFn_handler = createServerRpc({
	id: "c3b572b2a6ce076f64b845f5053af9ddb7da5e53a866d223796227d899b6ecad",
	name: "getAdminDashboard",
	filename: "src/server/cliprd.ts"
}, (opts) => getAdminDashboard.__executeServer(opts));
var getAdminDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => parse(dateRange, input ?? {})).handler(getAdminDashboard_createServerFn_handler, async (...args) => {
	const { getAdminDashboard: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var listClippers_createServerFn_handler = createServerRpc({
	id: "a6204f9306a95af6d830fd1a4e786814120112760c9d5992cd2238d52f6736fd",
	name: "listClippers",
	filename: "src/server/cliprd.ts"
}, (opts) => listClippers.__executeServer(opts));
var listClippers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listClippers_createServerFn_handler, async (...args) => {
	const { listClippers: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var updateClipper_createServerFn_handler = createServerRpc({
	id: "762558934beddec4fdd5d9ad2fdbeb8c2913ec8ec27a3c4b82c4e460eab5acf3",
	name: "updateClipper",
	filename: "src/server/cliprd.ts"
}, (opts) => updateClipper.__executeServer(opts));
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
}), input)).handler(updateClipper_createServerFn_handler, async (...args) => {
	const { updateClipper: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var createInvite_createServerFn_handler = createServerRpc({
	id: "bf368105f3b61eda83f55c43523114b5be827a93e01742b2c83cb849d089a972",
	name: "createInvite",
	filename: "src/server/cliprd.ts"
}, (opts) => createInvite.__executeServer(opts));
var createInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createInvite_createServerFn_handler, async (...args) => {
	const { createInvite: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var listInvites_createServerFn_handler = createServerRpc({
	id: "96f53f00d4ab2d6c2f7937e79f84ab3c886b06320d89c061db9c4bfe2fea3658",
	name: "listInvites",
	filename: "src/server/cliprd.ts"
}, (opts) => listInvites.__executeServer(opts));
var listInvites = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listInvites_createServerFn_handler, async (...args) => {
	const { listInvites: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var listClips_createServerFn_handler = createServerRpc({
	id: "fd0a880b1f9d8505a42dd1ee874e50767ea043255464d234b62f7cea3754223b",
	name: "listClips",
	filename: "src/server/cliprd.ts"
}, (opts) => listClips.__executeServer(opts));
var listClips = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => parse(object({
	status: string().optional(),
	platform: string().optional(),
	q: string().trim().max(80).optional(),
	offset: number().int().nonnegative().optional()
}), input ?? {})).handler(listClips_createServerFn_handler, async (...args) => {
	const { listClips: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var reviewClip_createServerFn_handler = createServerRpc({
	id: "4417d052bc28253f64b43602892996b2f78a4c6864a88a95bf0c789fdae782b3",
	name: "reviewClip",
	filename: "src/server/cliprd.ts"
}, (opts) => reviewClip.__executeServer(opts));
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
}), input)).handler(reviewClip_createServerFn_handler, async (...args) => {
	const { reviewClip: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var classifyClip_createServerFn_handler = createServerRpc({
	id: "f60b1fdf955cc796187610bf89487e5ea8a93a429f49982ce9a1af1ae493510e",
	name: "classifyClip",
	filename: "src/server/cliprd.ts"
}, (opts) => classifyClip.__executeServer(opts));
var classifyClip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	clipId: number().int().positive(),
	platformId: _enum(["youtube_shorts", "youtube_video"])
}), input)).handler(classifyClip_createServerFn_handler, async (...args) => {
	const { classifyClip: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var adjustViews_createServerFn_handler = createServerRpc({
	id: "05196ed710aa5b00fb842eb105907d38e4fe0f6fa39b0e6e2066a3efb05ddc33",
	name: "adjustViews",
	filename: "src/server/cliprd.ts"
}, (opts) => adjustViews.__executeServer(opts));
var adjustViews = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	clipId: number().int().positive(),
	validViews: number().int().nonnegative(),
	justification: string().trim().min(12, "La justificación debe tener al menos 12 caracteres").max(500)
}), input)).handler(adjustViews_createServerFn_handler, async (...args) => {
	const { adjustViews: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var syncClip_createServerFn_handler = createServerRpc({
	id: "362ac5f46d95d4d2180f47eab68b03c09af590336d9ebc6b981ed8b80c7f219f",
	name: "syncClip",
	filename: "src/server/cliprd.ts"
}, (opts) => syncClip.__executeServer(opts));
var syncClip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({ clipId: number().int().positive() }), input)).handler(syncClip_createServerFn_handler, async (...args) => {
	const { syncClip: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var syncYoutubeBatch_createServerFn_handler = createServerRpc({
	id: "517bc1fdf4f26ad613168926172c9261540eec6fc3ad240a946050d71bf11e3a",
	name: "syncYoutubeBatch",
	filename: "src/server/cliprd.ts"
}, (opts) => syncYoutubeBatch.__executeServer(opts));
var syncYoutubeBatch = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(syncYoutubeBatch_createServerFn_handler, async (...args) => {
	const { syncYoutubeBatch: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var listPayouts_createServerFn_handler = createServerRpc({
	id: "d8af449e4e4d76beda7d0e24b792715a3c14ff4d65fda889961d4daf30989a6d",
	name: "listPayouts",
	filename: "src/server/cliprd.ts"
}, (opts) => listPayouts.__executeServer(opts));
var listPayouts = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listPayouts_createServerFn_handler, async (...args) => {
	const { listPayouts: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var decidePayout_createServerFn_handler = createServerRpc({
	id: "2a0c0bf3bd86f17c7eefc3ab15678df8930b8ae3adca4109938958c01227d1f0",
	name: "decidePayout",
	filename: "src/server/cliprd.ts"
}, (opts) => decidePayout.__executeServer(opts));
var decidePayout = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	id: number().int().positive(),
	action: _enum([
		"approved",
		"processing",
		"rejected"
	]),
	reason: string().trim().max(400).optional()
}), input)).handler(decidePayout_createServerFn_handler, async (...args) => {
	const { decidePayout: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var recordPayment_createServerFn_handler = createServerRpc({
	id: "4edf0eb6b1ac3e7294a02427b167f6c55105700e3d18c50497c5aff7215872ec",
	name: "recordPayment",
	filename: "src/server/cliprd.ts"
}, (opts) => recordPayment.__executeServer(opts));
var recordPayment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	id: number().int().positive(),
	reference: string().trim().min(3, "Escribe la referencia bancaria").max(80),
	receiptUrl: string().trim().max(400).optional(),
	adminNote: string().trim().max(400).optional()
}), input)).handler(recordPayment_createServerFn_handler, async (...args) => {
	const { recordPayment: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var setRate_createServerFn_handler = createServerRpc({
	id: "51c019af42f4fa127aa3927e4399fd97dcadb0dd9667e72a78bd2292d51bf97b",
	name: "setRate",
	filename: "src/server/cliprd.ts"
}, (opts) => setRate.__executeServer(opts));
var setRate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	platformId: _enum([
		"tiktok",
		"youtube_shorts",
		"youtube_video"
	]),
	amount: string().trim().min(1).max(12),
	note: string().trim().max(200).optional()
}), input)).handler(setRate_createServerFn_handler, async (...args) => {
	const { setRate: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var addBonus_createServerFn_handler = createServerRpc({
	id: "898652950c84e78d7a458e9567bfce6c06cd03feb1652400c8913f0fc90d0d65",
	name: "addBonus",
	filename: "src/server/cliprd.ts"
}, (opts) => addBonus.__executeServer(opts));
var addBonus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	userId: string().min(1),
	amount: string().trim().min(1).max(20),
	note: string().trim().min(8, "Describe el premio o la bonificación").max(300)
}), input)).handler(addBonus_createServerFn_handler, async (...args) => {
	const { addBonus: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var setPrize_createServerFn_handler = createServerRpc({
	id: "b5939970d5e7a84c65774a2684c66eaba79b21f49a8bfd2a1f0c9dad683ac732",
	name: "setPrize",
	filename: "src/server/cliprd.ts"
}, (opts) => setPrize.__executeServer(opts));
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
}), input)).handler(setPrize_createServerFn_handler, async (...args) => {
	const { setPrize: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getSettings_createServerFn_handler = createServerRpc({
	id: "e44af557ebba052bd0f0bbe362b554b48c9eace1e777be65c5ea049e8a34e9d0",
	name: "getSettings",
	filename: "src/server/cliprd.ts"
}, (opts) => getSettings.__executeServer(opts));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSettings_createServerFn_handler, async (...args) => {
	const { getSettings: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var updateSettings_createServerFn_handler = createServerRpc({
	id: "b547e60ad472fcdaedea7991356d7b1e2a1ceb021ed52a076ac6eeb6621543aa",
	name: "updateSettings",
	filename: "src/server/cliprd.ts"
}, (opts) => updateSettings.__executeServer(opts));
var updateSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parse(object({
	agencyName: string().trim().min(2).max(80),
	slogan: string().trim().min(2).max(120),
	syncIntervalMinutes: number().int().min(15).max(10080),
	minPayout: string().trim().min(1).max(20)
}), input)).handler(updateSettings_createServerFn_handler, async (...args) => {
	const { updateSettings: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var listAudit_createServerFn_handler = createServerRpc({
	id: "5d41a8cd9c633906f9db98ad2745632803cefecfc4bf57384291bf72dddef2a0",
	name: "listAudit",
	filename: "src/server/cliprd.ts"
}, (opts) => listAudit.__executeServer(opts));
var listAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listAudit_createServerFn_handler, async (...args) => {
	const { listAudit: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getReports_createServerFn_handler = createServerRpc({
	id: "74b2f1a5a7340893ac511ce7e423bba3f0f671077e6f3b9a20aaa4455e311ba5",
	name: "getReports",
	filename: "src/server/cliprd.ts"
}, (opts) => getReports.__executeServer(opts));
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
}), input)).handler(getReports_createServerFn_handler, async (...args) => {
	const { getReports: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var probeYoutube_createServerFn_handler = createServerRpc({
	id: "92939adcb6e54ad679c5d409c3090cf9b924a0adb3e084b326149d05bcd27fc9",
	name: "probeYoutube",
	filename: "src/server/cliprd.ts"
}, (opts) => probeYoutube.__executeServer(opts));
var probeYoutube = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(probeYoutube_createServerFn_handler, async (...args) => {
	const { probeYoutube: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var startTikTokConnect_createServerFn_handler = createServerRpc({
	id: "4286acfded2352b515ac3c59679b8c2f977ce4cca9635fd6888d3ae26a98f8a3",
	name: "startTikTokConnect",
	filename: "src/server/cliprd.ts"
}, (opts) => startTikTokConnect.__executeServer(opts));
var startTikTokConnect = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(startTikTokConnect_createServerFn_handler, async (...args) => {
	const { startTikTokConnect: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var getTikTokStatus_createServerFn_handler = createServerRpc({
	id: "eebe18904e3ac5b413e64f18247fd88f5154708b2f63d877fcf245ab2196721b",
	name: "getTikTokStatus",
	filename: "src/server/cliprd.ts"
}, (opts) => getTikTokStatus.__executeServer(opts));
var getTikTokStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getTikTokStatus_createServerFn_handler, async (...args) => {
	const { getTikTokStatus: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var disconnectTikTok_createServerFn_handler = createServerRpc({
	id: "7b4ba66ec7e899106013149eec43bcf766e92ef285b373be24f8e898e00dc594",
	name: "disconnectTikTok",
	filename: "src/server/cliprd.ts"
}, (opts) => disconnectTikTok.__executeServer(opts));
var disconnectTikTok = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(disconnectTikTok_createServerFn_handler, async (...args) => {
	const { disconnectTikTok: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var syncMyTikTok_createServerFn_handler = createServerRpc({
	id: "3ef950774bfb48256bb06bc1aee7bccb48b425d68b3d5cd7b6fb8106016806cd",
	name: "syncMyTikTok",
	filename: "src/server/cliprd.ts"
}, (opts) => syncMyTikTok.__executeServer(opts));
var syncMyTikTok = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(syncMyTikTok_createServerFn_handler, async (...args) => {
	const { syncMyTikTok: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
var syncTiktokBatch_createServerFn_handler = createServerRpc({
	id: "6a802f03f0cb4f1d4057836b99509b5125a600445ee0179ca6591eb1f0628311",
	name: "syncTiktokBatch",
	filename: "src/server/cliprd.ts"
}, (opts) => syncTiktokBatch.__executeServer(opts));
var syncTiktokBatch = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(syncTiktokBatch_createServerFn_handler, async (...args) => {
	const { syncTiktokBatch: run } = await import("./domain.server-DHvnl87U.mjs");
	return run(...args);
});
//#endregion
export { addBonus_createServerFn_handler, adjustViews_createServerFn_handler, bootstrapProfile_createServerFn_handler, classifyClip_createServerFn_handler, createInvite_createServerFn_handler, decidePayout_createServerFn_handler, disconnectTikTok_createServerFn_handler, getAdminDashboard_createServerFn_handler, getClipDetail_createServerFn_handler, getClipperDashboard_createServerFn_handler, getMyClips_createServerFn_handler, getMyPayments_createServerFn_handler, getMyProfile_createServerFn_handler, getNotifications_createServerFn_handler, getPublicHome_createServerFn_handler, getRanking_createServerFn_handler, getReports_createServerFn_handler, getSettings_createServerFn_handler, getTikTokStatus_createServerFn_handler, listAudit_createServerFn_handler, listClippers_createServerFn_handler, listClips_createServerFn_handler, listInvites_createServerFn_handler, listPayouts_createServerFn_handler, markNotificationsRead_createServerFn_handler, probeYoutube_createServerFn_handler, recordPayment_createServerFn_handler, registerClip_createServerFn_handler, requestPayout_createServerFn_handler, reviewClip_createServerFn_handler, savePayoutAccount_createServerFn_handler, setPrize_createServerFn_handler, setRate_createServerFn_handler, startTikTokConnect_createServerFn_handler, syncClip_createServerFn_handler, syncMyTikTok_createServerFn_handler, syncTiktokBatch_createServerFn_handler, syncYoutubeBatch_createServerFn_handler, updateClipper_createServerFn_handler, updateMyProfile_createServerFn_handler, updateSettings_createServerFn_handler };
