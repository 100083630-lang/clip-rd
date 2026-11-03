import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

type ServerDomain = typeof import("./domain.server");

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Datos inválidos");
  }
  return result.data;
}

const dateRange = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  platform: z.enum(["all", "tiktok", "youtube_shorts", "youtube_video"]).optional(),
});

export const getPublicHome = createServerFn({ method: "GET" }).handler(async (...args: Parameters<ServerDomain["getPublicHome"]>) => {
    const { getPublicHome: run } = await import("./domain.server");
    return run(...args);
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["getMyProfile"]>) => {
    const { getMyProfile: run } = await import("./domain.server");
    return run(...args);
  });

export const bootstrapProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        displayName: z.string().trim().min(2, "Escribe tu nombre").max(80),
        phone: z.string().trim().max(30).optional(),
        inviteCode: z.string().trim().max(40).optional(),
        acceptTerms: z.boolean(),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["bootstrapProfile"]>) => {
    const { bootstrapProfile: run } = await import("./domain.server");
    return run(...args);
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        displayName: z.string().trim().min(2).max(80),
        phone: z.string().trim().max(30).optional(),
        avatarUrl: z.string().trim().max(400).optional(),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["updateMyProfile"]>) => {
    const { updateMyProfile: run } = await import("./domain.server");
    return run(...args);
  });

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["getNotifications"]>) => {
    const { getNotifications: run } = await import("./domain.server");
    return run(...args);
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["markNotificationsRead"]>) => {
    const { markNotificationsRead: run } = await import("./domain.server");
    return run(...args);
  });

export const getRanking = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        platform: z.enum(["all", "tiktok", "youtube_shorts", "youtube_video"]).default("all"),
        period: z.enum(["all", "weekly", "monthly"]).default("all"),
      }),
      input ?? {},
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["getRanking"]>) => {
    const { getRanking: run } = await import("./domain.server");
    return run(...args);
  });

export const registerClip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        url: z.string().trim().min(12).max(500),
        title: z.string().trim().max(180).optional(),
        description: z.string().trim().max(1000).optional(),
        publishedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
        declared: z.enum(["tiktok", "youtube_shorts", "youtube_video"]),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["registerClip"]>) => {
    const { registerClip: run } = await import("./domain.server");
    return run(...args);
  });

export const getMyClips = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["getMyClips"]>) => {
    const { getMyClips: run } = await import("./domain.server");
    return run(...args);
  });

export const getClipDetail = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(z.object({ id: z.number().int().positive() }), input))
  .handler(async (...args: Parameters<ServerDomain["getClipDetail"]>) => {
    const { getClipDetail: run } = await import("./domain.server");
    return run(...args);
  });

export const getClipperDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["getClipperDashboard"]>) => {
    const { getClipperDashboard: run } = await import("./domain.server");
    return run(...args);
  });

export const savePayoutAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        holderName: z.string().trim().min(3, "Nombre del titular").max(120),
        bankName: z.string().trim().min(3).max(120),
        accountType: z.enum(["ahorro", "corriente"]),
        accountNumber: z.string().trim().regex(/^\d{6,20}$/, "La cuenta debe tener entre 6 y 20 dígitos"),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["savePayoutAccount"]>) => {
    const { savePayoutAccount: run } = await import("./domain.server");
    return run(...args);
  });

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(z.object({ amount: z.string().trim().min(1).max(20), note: z.string().trim().max(300).optional() }), input),
  )
  .handler(async (...args: Parameters<ServerDomain["requestPayout"]>) => {
    const { requestPayout: run } = await import("./domain.server");
    return run(...args);
  });

export const getMyPayments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["getMyPayments"]>) => {
    const { getMyPayments: run } = await import("./domain.server");
    return run(...args);
  });

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(dateRange, input ?? {}))
  .handler(async (...args: Parameters<ServerDomain["getAdminDashboard"]>) => {
    const { getAdminDashboard: run } = await import("./domain.server");
    return run(...args);
  });

export const listClippers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["listClippers"]>) => {
    const { listClippers: run } = await import("./domain.server");
    return run(...args);
  });

export const updateClipper = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        userId: z.string().min(1),
        status: z.enum(["pending", "active", "inactive", "suspended"]).optional(),
        displayName: z.string().trim().min(2).max(80).optional(),
        remove: z.boolean().optional(),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["updateClipper"]>) => {
    const { updateClipper: run } = await import("./domain.server");
    return run(...args);
  });

export const createInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["createInvite"]>) => {
    const { createInvite: run } = await import("./domain.server");
    return run(...args);
  });

export const listInvites = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["listInvites"]>) => {
    const { listInvites: run } = await import("./domain.server");
    return run(...args);
  });

export const listClips = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        status: z.string().optional(),
        platform: z.string().optional(),
        q: z.string().trim().max(80).optional(),
        offset: z.number().int().nonnegative().optional(),
      }),
      input ?? {},
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["listClips"]>) => {
    const { listClips: run } = await import("./domain.server");
    return run(...args);
  });

export const reviewClip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        clipId: z.number().int().positive(),
        action: z.enum(["approve", "reject", "suspend", "review", "verified", "settle"]),
        validViews: z.number().int().nonnegative().optional(),
        justification: z.string().trim().max(500).optional(),
        reason: z.string().trim().max(500).optional(),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["reviewClip"]>) => {
    const { reviewClip: run } = await import("./domain.server");
    return run(...args);
  });

export const classifyClip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        clipId: z.number().int().positive(),
        platformId: z.enum(["youtube_shorts", "youtube_video"]),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["classifyClip"]>) => {
    const { classifyClip: run } = await import("./domain.server");
    return run(...args);
  });

export const adjustViews = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        clipId: z.number().int().positive(),
        validViews: z.number().int().nonnegative(),
        justification: z.string().trim().min(12, "La justificación debe tener al menos 12 caracteres").max(500),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["adjustViews"]>) => {
    const { adjustViews: run } = await import("./domain.server");
    return run(...args);
  });

export const syncClip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(z.object({ clipId: z.number().int().positive() }), input))
  .handler(async (...args: Parameters<ServerDomain["syncClip"]>) => {
    const { syncClip: run } = await import("./domain.server");
    return run(...args);
  });

export const syncYoutubeBatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["syncYoutubeBatch"]>) => {
    const { syncYoutubeBatch: run } = await import("./domain.server");
    return run(...args);
  });

export const listPayouts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["listPayouts"]>) => {
    const { listPayouts: run } = await import("./domain.server");
    return run(...args);
  });

export const decidePayout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        id: z.number().int().positive(),
        action: z.enum(["approved", "processing", "rejected"]),
        reason: z.string().trim().max(400).optional(),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["decidePayout"]>) => {
    const { decidePayout: run } = await import("./domain.server");
    return run(...args);
  });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        id: z.number().int().positive(),
        reference: z.string().trim().min(3, "Escribe la referencia bancaria").max(80),
        receiptUrl: z.string().trim().max(400).optional(),
        adminNote: z.string().trim().max(400).optional(),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["recordPayment"]>) => {
    const { recordPayment: run } = await import("./domain.server");
    return run(...args);
  });

export const setRate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        platformId: z.enum(["tiktok", "youtube_shorts", "youtube_video"]),
        amount: z.string().trim().min(1).max(12),
        note: z.string().trim().max(200).optional(),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["setRate"]>) => {
    const { setRate: run } = await import("./domain.server");
    return run(...args);
  });

export const addBonus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        userId: z.string().min(1),
        amount: z.string().trim().min(1).max(20),
        note: z.string().trim().min(8, "Describe el premio o la bonificación").max(300),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["addBonus"]>) => {
    const { addBonus: run } = await import("./domain.server");
    return run(...args);
  });

export const setPrize = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        scope: z.enum(["all", "tiktok", "youtube_shorts", "youtube_video"]),
        place: z.number().int().min(1).max(20),
        title: z.string().trim().min(2).max(80),
        amount: z.string().trim().max(20).optional(),
        active: z.boolean(),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["setPrize"]>) => {
    const { setPrize: run } = await import("./domain.server");
    return run(...args);
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["getSettings"]>) => {
    const { getSettings: run } = await import("./domain.server");
    return run(...args);
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        agencyName: z.string().trim().min(2).max(80),
        slogan: z.string().trim().min(2).max(120),
        syncIntervalMinutes: z.number().int().min(15).max(10080),
        minPayout: z.string().trim().min(1).max(20),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["updateSettings"]>) => {
    const { updateSettings: run } = await import("./domain.server");
    return run(...args);
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["listAudit"]>) => {
    const { listAudit: run } = await import("./domain.server");
    return run(...args);
  });

export const getReports = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    parse(
      z.object({
        kind: z.enum(["participants", "earnings", "platforms", "paid", "pending", "monthly", "general"]),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
      input,
    ),
  )
  .handler(async (...args: Parameters<ServerDomain["getReports"]>) => {
    const { getReports: run } = await import("./domain.server");
    return run(...args);
  });

export const probeYoutube = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["probeYoutube"]>) => {
    const { probeYoutube: run } = await import("./domain.server");
    return run(...args);
  });

export const startTikTokConnect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["startTikTokConnect"]>) => {
    const { startTikTokConnect: run } = await import("./domain.server");
    return run(...args);
  });

export const getTikTokStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["getTikTokStatus"]>) => {
    const { getTikTokStatus: run } = await import("./domain.server");
    return run(...args);
  });

export const disconnectTikTok = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["disconnectTikTok"]>) => {
    const { disconnectTikTok: run } = await import("./domain.server");
    return run(...args);
  });

export const syncMyTikTok = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["syncMyTikTok"]>) => {
    const { syncMyTikTok: run } = await import("./domain.server");
    return run(...args);
  });

export const syncTiktokBatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (...args: Parameters<ServerDomain["syncTiktokBatch"]>) => {
    const { syncTiktokBatch: run } = await import("./domain.server");
    return run(...args);
  });
