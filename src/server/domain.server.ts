import { dbSource, getSql, type Sql } from "@/lib/db";
import { secretState } from "@/lib/cliprd/integrations";
import { TERMS_VERSION } from "@/lib/cliprd/labels";
import {
  amountToCents,
  centsToAmount,
  earningAmount,
  parseMoneyInput,
  rateScale,
} from "@/lib/cliprd/money";
import type { Balance, Clip, Profile, RankRow, ReportTable } from "@/lib/cliprd/types";
import { classifyYoutube, parseClipUrl, parseIsoDuration } from "@/lib/cliprd/urls";
import { getRequest } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import {
  buildTikTokAuth,
  exchangeTikTokCode,
  fetchOembed,
  invalidateIntegrations,
  loadIntegrations,
  readTikTokPublic,
  refreshTikTokToken,
  tiktokProfile,
  tiktokVideoPages,
  type TikTokVideo,
} from "./platforms.server";

const CLIP_FROM = `
  from clips c
  join profiles p on p.user_id = c.user_id
`;

const CLIP_FIELDS = `
  c.id, c.user_id, p.display_name as owner_name, c.provider, c.platform_id,
  c.declared_platform, c.classification, c.external_id, c.url, c.title, c.description,
  c.channel_name, c.published_on::text as published_on, c.duration_seconds, c.status,
  c.availability, c.stats_source, c.stats_verified, c.public_views, c.valid_views,
  c.billed_views, c.views_locked, c.likes, c.comments, c.shares, c.flags,
  to_char(c.stats_updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as stats_updated_at,
  c.stats_error, c.rejection_reason, c.thumbnail_url,
  to_char(c.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
  coalesce((select sum(e.amount) from earnings e where e.clip_id = c.id), 0)::text as earning
`;

type ClipRow = {
  id: string;
  user_id: string;
  owner_name: string;
  provider: "tiktok" | "youtube";
  platform_id: string;
  declared_platform: string;
  classification: Clip["classification"];
  external_id: string;
  url: string;
  title: string;
  description: string;
  channel_name: string | null;
  published_on: string | null;
  duration_seconds: number | null;
  status: string;
  availability: string;
  stats_source: string;
  stats_verified: boolean;
  public_views: number;
  valid_views: number;
  billed_views: number;
  views_locked: boolean;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  flags: unknown;
  stats_updated_at: string | null;
  stats_error: string | null;
  rejection_reason: string | null;
  thumbnail_url: string | null;
  earning: string;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  role: Profile["role"];
  status: Profile["status"];
  phone: string | null;
  terms_version: string;
  agency_name: string;
};

const buckets = new Map<string, number[]>();

function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

function flagsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function withFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? flags : [...flags, flag];
}

function mapClip(row: ClipRow): Clip {
  return {
    id: String(row.id),
    userId: row.user_id,
    ownerName: row.owner_name,
    provider: row.provider,
    platformId: row.platform_id,
    declaredPlatform: row.declared_platform,
    classification: row.classification,
    externalId: row.external_id,
    url: row.url,
    title: row.title,
    description: row.description,
    channelName: row.channel_name,
    publishedOn: row.published_on,
    durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    status: row.status,
    availability: row.availability,
    statsSource: row.stats_source,
    statsVerified: Boolean(row.stats_verified),
    publicViews: Number(row.public_views),
    validViews: Number(row.valid_views),
    billedViews: Number(row.billed_views),
    viewsLocked: Boolean(row.views_locked),
    likes: row.likes == null ? null : Number(row.likes),
    comments: row.comments == null ? null : Number(row.comments),
    shares: row.shares == null ? null : Number(row.shares),
    flags: flagsOf(row.flags),
    statsUpdatedAt: row.stats_updated_at,
    statsError: row.stats_error,
    rejectionReason: row.rejection_reason,
    thumbnailUrl: row.thumbnail_url,
    earning: row.earning,
    createdAt: row.created_at,
  };
}

function mapProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    phone: row.phone,
    agencyName: row.agency_name,
    termsVersion: row.terms_version,
  };
}

async function profileByUser(sql: Sql, userId: string): Promise<Profile | null> {
  const rows = await sql<ProfileRow>`
    select p.user_id, u.email, p.display_name, p.avatar_url, p.role, p.status, p.phone,
           p.terms_version, s.agency_name
    from profiles p
    join "user" u on u.id = p.user_id
    cross join agency_settings s
    where p.user_id = ${userId}
    limit 1
  `;
  return rows[0] ? mapProfile(rows[0]) : null;
}

async function requireProfile(sql: Sql, userId: string): Promise<Profile> {
  const profile = await profileByUser(sql, userId);
  if (!profile) throw new Error("Completa tu registro en CLIPRD.");
  if (profile.status === "suspended") throw new Error("Tu cuenta está suspendida.");
  if (profile.status === "inactive") throw new Error("Tu cuenta está inactiva.");
  return profile;
}

async function requireAdmin(sql: Sql, userId: string): Promise<Profile> {
  const profile = await requireProfile(sql, userId);
  if (profile.role !== "admin") throw new Error("No tienes permiso de administrador.");
  return profile;
}

function assertActive(profile: Profile) {
  if (profile.status !== "active") throw new Error("Tu cuenta todavía no está activa.");
}

async function notify(
  sql: Sql,
  userId: string,
  kind: string,
  title: string,
  body: string,
  href: string | null,
) {
  await sql`
    insert into notifications (user_id, kind, title, body, href)
    values (${userId}, ${kind}, ${title}, ${body}, ${href})
  `;
}

async function notifyAdmins(sql: Sql, kind: string, title: string, body: string, href: string | null) {
  await sql`
    insert into notifications (user_id, kind, title, body, href)
    select user_id, ${kind}, ${title}, ${body}, ${href}
    from profiles
    where role = 'admin' and status = 'active'
  `;
}

async function audit(
  sql: Sql,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  detail: Record<string, unknown>,
) {
  await sql`
    insert into audit_logs (actor_id, action, entity, entity_id, detail)
    values (${actorId}, ${action}, ${entity}, ${entityId}, ${JSON.stringify(detail)}::jsonb)
  `;
}

async function balanceOf(sql: Sql, userId: string): Promise<Balance> {
  const rows = await sql<{ earned: string; committed: string; paid: string; pending: string }>`
    select
      coalesce((select sum(amount) from earnings where user_id = ${userId}), 0)::text as earned,
      coalesce((select sum(amount) from payout_requests where user_id = ${userId} and status in ('pending','approved','processing','paid')), 0)::text as committed,
      coalesce((select sum(amount) from payments where user_id = ${userId}), 0)::text as paid,
      coalesce((select sum(amount) from payout_requests where user_id = ${userId} and status = 'pending'), 0)::text as pending
  `;
  const earned = rows[0]?.earned ?? "0.00";
  const committed = rows[0]?.committed ?? "0.00";
  return {
    earned,
    committed,
    paid: rows[0]?.paid ?? "0.00",
    pending: rows[0]?.pending ?? "0.00",
    available: centsToAmount(amountToCents(earned) - amountToCents(committed)),
  };
}

async function activeRate(sql: Sql, platformId: string): Promise<string> {
  const rows = await sql<{ amount: string }>`
    select amount_per_mille::text as amount
    from rates
    where platform_id = ${platformId} and active = true
    order by effective_from desc
    limit 1
  `;
  if (!rows[0]) throw new Error("No hay una tarifa activa para esta plataforma.");
  return rows[0].amount;
}

async function writeHistory(sql: Sql, clipId: string, source: string, note: string | null, actorId: string) {
  await sql`
    insert into clip_statistics (clip_id, public_views, valid_views, likes, comments, shares, source, note, recorded_by)
    select id, public_views, valid_views, likes, comments, shares, ${source}, ${note}, ${actorId}
    from clips where id = ${clipId}
  `;
}

async function accrue(sql: Sql, input: {
  clipId: string;
  newValid: number;
  actorId: string;
  kind: "accrual" | "adjustment";
  note: string | null;
  source: string;
  lock: boolean;
  status: string | null;
}) {
  if (!Number.isInteger(input.newValid) || input.newValid < 0) {
    throw new Error("Las vistas válidas deben ser un entero positivo o cero.");
  }
  const current = await sql<{
    billed_views: number;
    platform_id: string;
    classification: string;
    user_id: string;
  }>`
    select billed_views, platform_id, classification, user_id
    from clips where id = ${input.clipId}
  `;
  const clip = current[0];
  if (!clip) throw new Error("Publicación no encontrada.");
  const billed = Number(clip.billed_views);
  const delta = input.newValid - billed;
  if (delta !== 0 && clip.classification !== "confirmed") {
    throw new Error("Confirma si es Short o video antes de liquidar vistas.");
  }
  const rate = delta === 0 ? "0.0000" : await activeRate(sql, clip.platform_id);
  const amount = delta === 0 ? "0.00" : earningAmount(delta, rate);
  const updated = await sql<{ updated: number }>`
    with upd as (
      update clips
      set valid_views = ${input.newValid},
          billed_views = ${input.newValid},
          views_locked = ${input.lock},
          stats_source = ${input.source},
          status = coalesce(${input.status}, status),
          updated_at = now()
      where id = ${input.clipId} and billed_views = ${billed}
      returning id, user_id, platform_id
    ),
    ins as (
      insert into earnings (
        clip_id, user_id, platform_id, views_delta, rate_per_mille, amount, kind, note, created_by
      )
      select id, user_id, platform_id, ${delta}, ${rate}::numeric, ${amount}::numeric,
             ${input.kind}, ${input.note}, ${input.actorId}
      from upd
      where ${delta} <> 0
      returning id
    )
    select (select count(*)::int from upd) as updated, (select count(*)::int from ins) as earned
  `;
  if (!updated[0] || Number(updated[0].updated) !== 1) {
    throw new Error("La publicación cambió durante el cálculo. Vuelve a intentarlo.");
  }
  await writeHistory(sql, input.clipId, input.source, input.note, input.actorId);
  if (delta !== 0) {
    await notify(
      sql,
      clip.user_id,
      "views",
      "Vistas actualizadas",
      `Se registraron ${delta > 0 ? "+" : ""}${delta.toLocaleString("es-DO")} vistas válidas. Ganancia de este movimiento: US$${amount}.`,
      "/clipper/earnings",
    );
  }
}

type YtItem = {
  id: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    description?: string;
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  status?: { privacyStatus?: string };
};

async function youtubeList(sql: Sql, ids: string[]): Promise<{ items: YtItem[] } | { error: string }> {
  const key = (await loadIntegrations()).youtubeKey;
  if (!key) {
    const state = (await loadIntegrations()).youtube;
    return {
      error:
        state === "placeholder"
          ? "YOUTUBE_API_KEY es un marcador, no una clave de Google Cloud. No se consultó videos.list."
          : "YOUTUBE_API_KEY no está configurada en el servidor.",
    };
  }
  const quota = await sql<{ used: number }>`
    select case when youtube_quota_day = current_date then youtube_quota_used else 0 end as used
    from agency_settings where id = 1
  `;
  if (Number(quota[0]?.used ?? 0) >= 9500) {
    return { error: "La cuota diaria de YouTube está reservada. La sincronización se detuvo." };
  }
  const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
  endpoint.searchParams.set("part", "snippet,contentDetails,statistics,status");
  endpoint.searchParams.set("id", ids.join(","));
  endpoint.searchParams.set("key", key);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000) });
  await sql`
    update agency_settings
    set youtube_quota_used = case when youtube_quota_day = current_date then youtube_quota_used + 1 else 1 end,
        youtube_quota_day = current_date,
        updated_at = now()
    where id = 1
  `;
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { error: body?.error?.message ?? `YouTube respondió ${response.status}.` };
  }
  const body = (await response.json()) as { items?: YtItem[] };
  return { items: body.items ?? [] };
}

async function applyYoutubeItem(sql: Sql, clip: Clip, item: YtItem | undefined, actorId: string) {
  if (!item) {
    await sql`
      update clips
      set availability = 'deleted',
          stats_error = 'YouTube no devolvió el video. Puede estar eliminado o ser inaccesible.',
          flags = ${JSON.stringify(withFlag(clip.flags, "unavailable"))}::jsonb,
          stats_updated_at = now(),
          updated_at = now()
      where id = ${clip.id}
    `;
    await writeHistory(sql, clip.id, "youtube_api", "Video no encontrado", actorId);
    await notifyAdmins(sql, "clip", "Video no disponible", `${clip.title} no apareció en YouTube.`, "/admin/clips");
    return { ok: false as const, message: "YouTube no devolvió el video." };
  }
  const privacy = item.status?.privacyStatus ?? "unknown";
  const availability = privacy === "public" || privacy === "unlisted" || privacy === "private" ? privacy : "unknown";
  const duration = item.contentDetails?.duration ? parseIsoDuration(item.contentDetails.duration) : null;
  const detected = classifyYoutube({
    shortsPath: clip.url.includes("/shorts/"),
    durationSeconds: duration,
  });
  let classification = clip.classification;
  let platformId = clip.platformId;
  if (detected === "youtube_video" && clip.platformId === "youtube_shorts") {
    classification = "conflict";
    platformId = "youtube_video";
  } else if (detected === "youtube_shorts" && classification !== "confirmed") {
    classification = "confirmed";
    platformId = "youtube_shorts";
  } else if (detected === "youtube_video" && classification !== "confirmed") {
    classification = "confirmed";
    platformId = "youtube_video";
  }
  const publicViews = Number(item.statistics?.viewCount ?? 0);
  const likes = item.statistics?.likeCount == null ? null : Number(item.statistics.likeCount);
  const comments = item.statistics?.commentCount == null ? null : Number(item.statistics.commentCount);
  const spike = clip.publicViews >= 500 && publicViews > clip.publicViews * 8;
  const dropped = clip.publicViews >= 1000 && publicViews < clip.publicViews * 0.4;
  let flags = clip.flags.filter((flag) => flag !== "suspicious_spike" && flag !== "views_dropped" && flag !== "private");
  if (spike) flags = withFlag(flags, "suspicious_spike");
  if (dropped) flags = withFlag(flags, "views_dropped");
  if (availability === "private") flags = withFlag(flags, "private");
  await sql`
    update clips set
      public_views = ${publicViews},
      likes = ${likes},
      comments = ${comments},
      channel_name = ${item.snippet?.channelTitle ?? clip.channelName},
      duration_seconds = ${duration},
      title = ${item.snippet?.title ?? clip.title},
      availability = ${availability},
      stats_source = 'youtube_api',
      stats_verified = ${availability === "public"},
      stats_error = ${spike ? "Salto de reproducciones fuera de lo normal. Las vistas válidas no se movieron." : null},
      flags = ${JSON.stringify(flags)}::jsonb,
      classification = ${classification},
      platform_id = ${platformId},
      stats_updated_at = now(),
      updated_at = now()
    where id = ${clip.id}
  `;
  const canAccrue =
    !clip.viewsLocked &&
    !spike &&
    !dropped &&
    availability === "public" &&
    classification === "confirmed" &&
    (clip.status === "approved" || clip.status === "settled") &&
    publicViews > clip.billedViews;
  if (canAccrue) {
    await accrue(sql, {
      clipId: clip.id,
      newValid: publicViews,
      actorId,
      kind: "accrual",
      note: "Sincronización YouTube Data API. Solo se liquidó el aumento.",
      source: "youtube_api",
      lock: false,
      status: null,
    });
  } else {
    await writeHistory(sql, clip.id, "youtube_api", spike ? "Salto sospechoso" : "Observación", actorId);
  }
  if (spike) {
    await notifyAdmins(sql, "fraud", "Reproducciones sospechosas", `${clip.title} multiplicó sus vistas. Revisa antes de liquidar.`, "/admin/clips");
  }
  return { ok: true as const, message: canAccrue ? "Estadísticas verificadas y diferencia liquidada." : "Estadísticas públicas actualizadas." };
}

async function loadClip(sql: Sql, id: string): Promise<Clip | null> {
  const found = await sql.query<ClipRow>(`select ${CLIP_FIELDS} ${CLIP_FROM} where c.id = $1`, [id]);
  return found[0] ? mapClip(found[0]) : null;
}

export async function runScheduledSync(): Promise<{ synced: number; errors: string[] }> {
  const sql = await getSql();
  const interval = await sql<{ minutes: number }>`
    select sync_interval_minutes as minutes from agency_settings where id = 1
  `;
  const minutes = Number(interval[0]?.minutes ?? 360);
  const rows = await sql.query<ClipRow>(
    `select ${CLIP_FIELDS} ${CLIP_FROM}
     where c.provider = 'youtube'
       and c.status in ('pending','in_review','verified','approved','settled')
       and c.availability <> 'deleted'
       and (c.stats_updated_at is null or c.stats_updated_at < now() - ($1 || ' minutes')::interval)
     order by c.stats_updated_at nulls first
     limit 25`,
    [String(minutes)],
  );
  return syncRows(sql, rows.map(mapClip), "cron").then(async (youtube) => {
    if (!(await loadIntegrations()).tiktok) return youtube;
    const links = await sql<{ user_id: string }>`select user_id from tiktok_connections`;
    let synced = youtube.synced;
    const errors = [...youtube.errors];
    for (const link of links) {
      const result = await syncUserTikTok(sql, link.user_id, "cron");
      synced += result.synced;
      errors.push(...result.errors);
    }
    return { synced, errors };
  });
}

async function syncRows(sql: Sql, clips: Clip[], actorId: string) {
  const errors: string[] = [];
  if (!(await loadIntegrations()).youtubeKey) {
    return { synced: 0, errors: ["YouTube no está listo. No se inventaron estadísticas."] };
  }
  const youtube = clips.filter((clip) => clip.provider === "youtube");
  let synced = 0;
  for (let index = 0; index < youtube.length; index += 25) {
    const slice = youtube.slice(index, index + 25);
    const result = await youtubeList(sql, slice.map((clip) => clip.externalId));
    if ("error" in result) {
      errors.push(result.error);
      break;
    }
    for (const clip of slice) {
      const item = result.items.find((entry) => entry.id === clip.externalId);
      const applied = await applyYoutubeItem(sql, clip, item, actorId);
      if (!applied.ok) errors.push(`${clip.title}: ${applied.message}`);
      synced += 1;
    }
  }
  return { synced, errors };
}

function inviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `CLIP-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash).slice(0, 10), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const getPublicHome = async () => {
  const sql = await getSql();
  const settings = await sql<{ agency_name: string; slogan: string; currency: string }>`
    select agency_name, slogan, currency from agency_settings where id = 1
  `;
  const rates = await sql<{ id: string; label: string; amount: string }>`
    select distinct on (p.id) p.id, p.label, r.amount_per_mille::text as amount
    from platforms p
    left join rates r on r.platform_id = p.id and r.active = true
    order by p.id, r.effective_from desc nulls last
  `;
  const leaders = await sql<{ display_name: string; avatar_url: string | null; views: number; earnings: string }>`
    select p.display_name, p.avatar_url,
      coalesce((select sum(c.valid_views) from clips c where c.user_id = p.user_id and c.status in ('approved','settled')), 0)::int as views,
      coalesce((select sum(e.amount) from earnings e where e.user_id = p.user_id), 0)::text as earnings
    from profiles p
    where p.role = 'clipper' and p.status = 'active'
    order by views desc, earnings desc
    limit 10
  `;
  return {
    agencyName: settings[0]?.agency_name ?? "Origen Simple",
    slogan: settings[0]?.slogan ?? "CONVIERTE VISUALIZACIONES EN DINERO.",
    currency: settings[0]?.currency ?? "USD",
    rates: rates.map((rate) => ({
      id: rate.id,
      label: rate.label,
      amount: rate.amount ?? "0.0000",
    })),
    leaders: leaders.map((row) => ({
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      views: Number(row.views),
      earnings: row.earnings,
    })),
  };
};

export const getMyProfile = async ({ context }: { context: { userId: string } }): Promise<Profile | null> => {
    const sql = await getSql();
    return profileByUser(sql, context.userId);
  };

export const bootstrapProfile = async ({ context, data }: { context: { userId: string }; data: any }) => {
    if (!context.userId) throw new Error("No hay usuario para crear el perfil.");
    if (!data.acceptTerms) throw new Error("Debes aceptar las condiciones de participación.");
    const sql = await getSql();
    const existing = await profileByUser(sql, context.userId);
    if (existing) return existing;
    const admins = await sql<{ total: number }>`
      select count(*)::int as total from profiles where role = 'admin'
    `;
    const first = Number(admins[0]?.total ?? 0) === 0;
    let status: Profile["status"] = first ? "active" : "pending";
    const role: Profile["role"] = first ? "admin" : "clipper";
    const code = data.inviteCode?.trim().toUpperCase();
    if (!first && code) {
      const used = await sql<{ code: string }>`
        update invites
        set used_by = ${context.userId}, used_at = now()
        where code = ${code} and used_by is null and expires_at > now()
        returning code
      `;
      if (!used[0]) throw new Error("La invitación no es válida o ya se usó.");
      status = "active";
    }
    const image = await sql<{ image: string | null }>`
      select image from "user" where id = ${context.userId}
    `;
    await sql`
      insert into profiles (
        user_id, display_name, avatar_url, role, status, phone, terms_version
      ) values (
        ${context.userId}, ${data.displayName.trim()}, ${image[0]?.image ?? null},
        ${role}, ${status}, ${data.phone?.trim() || null}, ${TERMS_VERSION}
      )
    `;
    await audit(sql, context.userId, "profile.create", "profile", context.userId, { role, status });
    if (!first) {
      await notifyAdmins(
        sql,
        "clipper",
        "Nuevo clipper",
        `${data.displayName.trim()} se registró y está ${status === "active" ? "activo" : "pendiente de aprobación"}.`,
        "/admin/clippers",
      );
    }
    const created = await profileByUser(sql, context.userId);
    if (!created) throw new Error("No se pudo crear el perfil.");
    return created;
  };

export const updateMyProfile = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const avatar = data.avatarUrl?.trim() || null;
    if (avatar && !/^https:\/\//.test(avatar)) throw new Error("La foto debe ser un enlace https.");
    await sql`
      update profiles
      set display_name = ${data.displayName.trim()},
          phone = ${data.phone?.trim() || null},
          avatar_url = ${avatar},
          updated_at = now()
      where user_id = ${context.userId}
    `;
    return profileByUser(sql, context.userId);
  };

export const getNotifications = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const rows = await sql<{
      id: number;
      kind: string;
      title: string;
      body: string;
      href: string | null;
      read_at: string | null;
      created_at: string;
    }>`
      select id, kind, title, body, href,
             to_char(read_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as read_at,
             to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from notifications
      where user_id = ${context.userId}
      order by id desc
      limit 40
    `;
    return rows;
  };

export const markNotificationsRead = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    await sql`
      update notifications set read_at = now()
      where user_id = ${context.userId} and read_at is null
    `;
    return { ok: true };
  };

export const getRanking = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const from =
      data.period === "weekly" ? "now() - interval '7 days'" : data.period === "monthly" ? "now() - interval '30 days'" : "timestamp '1970-01-01'";
    const rows = await sql.query<{
      user_id: string;
      display_name: string;
      avatar_url: string | null;
      views: number;
      posts: number;
      earnings: string;
      best_platform: string | null;
    }>(
      `select p.user_id, p.display_name, p.avatar_url,
         coalesce((
           select sum(e.views_delta) from earnings e
           where e.user_id = p.user_id and e.created_at >= ${from}
             and ($1 = 'all' or e.platform_id = $1)
         ), 0)::int as views,
         (
           select count(*)::int from clips c
           where c.user_id = p.user_id and c.status in ('approved','settled')
             and c.created_at >= ${from}
             and ($1 = 'all' or c.platform_id = $1)
         ) as posts,
         coalesce((
           select sum(e.amount) from earnings e
           where e.user_id = p.user_id and e.created_at >= ${from}
             and ($1 = 'all' or e.platform_id = $1)
         ), 0)::text as earnings,
         (
           select e.platform_id from earnings e
           where e.user_id = p.user_id and e.platform_id is not null
             and e.created_at >= ${from}
             and ($1 = 'all' or e.platform_id = $1)
           group by e.platform_id
           order by sum(e.amount) desc
           limit 1
         ) as best_platform
       from profiles p
       where p.role = 'clipper' and p.status = 'active'
       order by (
         select coalesce(sum(e.amount), 0) from earnings e
         where e.user_id = p.user_id and e.created_at >= ${from}
           and ($1 = 'all' or e.platform_id = $1)
       ) desc, views desc, p.display_name asc
       limit 100`,
      [data.platform],
    );
    const ranking: RankRow[] = rows.map((row, index) => ({
      place: index + 1,
      userId: row.user_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      views: Number(row.views),
      posts: Number(row.posts),
      earnings: row.earnings,
      bestPlatform: row.best_platform,
    }));
    const prizes = await sql<{
      id: number;
      scope: string;
      place: number;
      title: string;
      amount: string | null;
      active: boolean;
    }>`
      select id, scope, place, title, amount::text as amount, active
      from ranking_prizes
      order by scope, place
    `;
    return { ranking, prizes };
  };

export const registerClip = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    if (!data.asAdmin) {
      if (profile.role !== "clipper") throw new Error("Las publicaciones las registran los clippers.");
      assertActive(profile);
      if (!limited(`clip:${context.userId}`, 20, 60 * 60 * 1000)) {
        throw new Error("Demasiados registros en una hora. Espera un momento.");
      }
    }
    let parsed = parseClipUrl(data.url);
    if (!parsed.ok) throw new Error(parsed.error);
    if (parsed.provider === "tiktok" && data.declared !== "tiktok") {
      throw new Error("Ese enlace es de TikTok, no de YouTube.");
    }
    if (parsed.provider === "youtube" && data.declared === "tiktok") {
      throw new Error("Ese enlace es de YouTube, no de TikTok.");
    }
    if (parsed.provider === "tiktok" && (parsed.shortLink || !parsed.videoId)) {
      const resolved = parseClipUrl(await resolveFinal(parsed.normalized));
      if (resolved.ok && resolved.provider === "tiktok") parsed = resolved;
    }
    if (!parsed.ok) throw new Error("No se pudo leer el enlace.");
    let externalId = parsed.provider === "youtube" ? parsed.videoId : parsed.videoId;
    if (!externalId) externalId = `url:${await digest(parsed.normalized)}`;
    const duplicate = await sql<{ id: string }>`
      select id::text as id from clips where provider = ${parsed.provider} and external_id = ${externalId}
    `;
    if (duplicate[0]) throw new Error("Ese video ya está registrado en CLIPRD.");

    let title = data.title?.trim() || "";
    let channel: string | null = null;
    let duration: number | null = null;
    let publicViews = 0;
    let likes: number | null = null;
    let comments: number | null = null;
    let shares: number | null = null;
    let thumbnail: string | null = null;
    let availability = "unknown";
    let statsSource = "none";
    let statsVerified = false;
    let statsError: string | null = null;
    const warnings: string[] = [];
    let classification: Clip["classification"] = parsed.provider === "tiktok" ? "confirmed" : "unconfirmed";
    let platformId = data.declared;

    if (parsed.provider === "youtube") {
      const detected = classifyYoutube({ shortsPath: parsed.shortsPath, durationSeconds: null });
      if (detected === "youtube_shorts") {
        classification = "confirmed";
        platformId = "youtube_shorts";
        if (data.declared === "youtube_video") {
          classification = "conflict";
          warnings.push("El enlace es un Short. Quedó en revisión.");
        }
      }
      const api = await youtubeList(sql, [parsed.videoId]);
      thumbnail = `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`;
      if ("error" in api) {
        statsError = api.error;
        warnings.push("Sin YouTube Data API no hay reproducciones verificadas. El clip queda pendiente.");
        const embed = await fetchOembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(parsed.normalized)}`);
        if (embed?.title) title = title || embed.title;
        if (embed?.author_name) channel = embed.author_name;
        if (embed?.thumbnail_url) thumbnail = embed.thumbnail_url;
        if (embed) statsSource = "oembed";
      } else {
        const item = api.items[0];
        if (!item) {
          availability = "deleted";
          statsError = "YouTube no devolvió el video.";
          warnings.push("YouTube no encontró el video. Un administrador debe revisarlo.");
        } else {
          duration = item.contentDetails?.duration ? parseIsoDuration(item.contentDetails.duration) : null;
          const kind = classifyYoutube({ shortsPath: parsed.shortsPath, durationSeconds: duration });
          if (kind === "unknown") {
            classification = "unconfirmed";
            platformId = data.declared;
            warnings.push("No se pudo confirmar si es Short o video. Un administrador debe clasificarlo.");
          } else if (kind !== data.declared) {
            classification = "conflict";
            platformId = kind;
            warnings.push("La clasificación automática no coincide con la que elegiste. Quedó en revisión.");
          } else {
            classification = "confirmed";
            platformId = kind;
          }
          title = item.snippet?.title || title;
          channel = item.snippet?.channelTitle ?? null;
          publicViews = Number(item.statistics?.viewCount ?? 0);
          likes = item.statistics?.likeCount == null ? null : Number(item.statistics.likeCount);
          comments = item.statistics?.commentCount == null ? null : Number(item.statistics.commentCount);
          const privacy = item.status?.privacyStatus ?? "public";
          availability = privacy === "public" || privacy === "unlisted" || privacy === "private" ? privacy : "unknown";
          statsSource = "youtube_api";
          statsVerified = availability === "public";
          if (availability !== "public") warnings.push("El video no es público. Las vistas no se liquidan solas.");
        }
      }
    } else {
      const official = parsed.videoId ? await lookupTikTokVideo(sql, context.userId, parsed.videoId) : null;
      if (official) {
        title = title || official.title || "";
        thumbnail = official.cover_image_url ?? null;
        duration = official.duration ?? null;
        publicViews = Number(official.view_count ?? 0);
        likes = official.like_count ?? null;
        comments = official.comment_count ?? null;
        shares = official.share_count ?? null;
        availability = "public";
        statsSource = "tiktok_api";
        statsVerified = true;
        warnings.push("Vistas leídas con TikTok video.list. Se liquidan al aprobar, no al registrar.");
      } else {
        const pub = await readTikTokPublic(parsed.normalized);
        if (pub.title) title = title || pub.title;
        if (pub.author) channel = pub.author;
        if (pub.thumbnail) thumbnail = pub.thumbnail;
        if (pub.title || pub.author || pub.thumbnail) statsSource = "oembed";
        if (pub.views != null) {
          publicViews = pub.views;
          statsError = "Cifra de la página pública de TikTok. No es video.list y no se liquida sola.";
          warnings.push("Se guardó una cifra pública sin verificar. No entra al libro hasta que un administrador la justifique o conectes TikTok.");
        } else {
          statsError = (await loadIntegrations()).tiktok
            ? "Conecta tu cuenta de TikTok en Perfil para leer view_count con video.list."
            : "TikTok no entregó reproducciones. oEmbed solo confirma título y autor.";
          warnings.push("Las reproducciones de TikTok no están verificadas. No se suman como vistas válidas.");
        }
        if (!parsed.videoId) warnings.push("No se pudo resolver el ID del video. Se guardó una huella del enlace.");
      }
    }

    if (!title) title = "Clip sin título";
    const status = classification === "confirmed" ? "pending" : "in_review";
    const inserted = await sql<{ id: string }>`
      insert into clips (
        user_id, provider, platform_id, declared_platform, classification, external_id, url,
        title, description, channel_name, published_on, duration_seconds, status, availability,
        stats_source, stats_verified, public_views, likes, comments, shares, thumbnail_url, stats_error, stats_updated_at
      ) values (
        ${context.userId}, ${parsed.provider}, ${platformId}, ${data.declared}, ${classification},
        ${externalId}, ${parsed.normalized}, ${title}, ${data.description?.trim() ?? ""}, ${channel},
        ${data.publishedOn}, ${duration}, ${status}, ${availability}, ${statsSource}, ${statsVerified},
        ${publicViews}, ${likes}, ${comments}, ${shares}, ${thumbnail}, ${statsError}, now()
      )
      returning id::text as id
    `;
    const id = inserted[0]?.id ?? "";
    await writeHistory(sql, id, statsSource, "Registro inicial", context.userId);
    await audit(sql, context.userId, "clip.register", "clip", String(id), {
      provider: parsed.provider,
      externalId,
      statsSource,
      statsVerified,
    });
    await notifyAdmins(sql, "clip", "Nueva publicación", `${profile.displayName} registró «${title}».`, "/admin/clips");
    await notify(sql, context.userId, "clip", "Clip registrado", `«${title}» quedó ${status === "pending" ? "pendiente" : "en revisión"}.`, "/clipper/my-clips");
    return { id, warnings, statsVerified, statsSource };
  };

export const adminAddClip = async ({ context, data }: { context: { userId: string }; data: any }) => {
  const sql = await getSql();
  await requireAdmin(sql, context.userId);
  if (!data.userId) throw new Error("Elige un clipper.");
  const target = await requireProfile(sql, data.userId);
  if (target.role !== "clipper") throw new Error("Esa cuenta no es un clipper.");
  const parsed = parseClipUrl(data.url);
  if (!parsed.ok) throw new Error(parsed.error);
  const declared = parsed.provider === "tiktok" ? "tiktok" : parsed.shortsPath ? "youtube_shorts" : "youtube_video";
  return registerClip({
    context: { userId: data.userId },
    data: {
      url: data.url,
      title: data.title,
      description: "",
      publishedOn: new Date().toISOString().slice(0, 10),
      declared,
      asAdmin: true,
    },
  });
};

async function resolveFinal(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "CLIPRD/1.0" },
    });
    return response.url || url;
  } catch {
    return url;
  }
}

type TikTokLink = {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
};

async function freshTikTokToken(sql: Sql, userId: string): Promise<string | null> {
  const rows = await sql<TikTokLink>`
    select user_id, access_token, refresh_token,
           to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as expires_at
    from tiktok_connections where user_id = ${userId}
  `;
  const link = rows[0];
  if (!link) return null;
  const expiring = link.expires_at ? new Date(link.expires_at).getTime() < Date.now() + 60_000 : false;
  if (!expiring) return link.access_token;
  if (!link.refresh_token) return null;
  const next = await refreshTikTokToken(link.refresh_token);
  const expiresAt = new Date(Date.now() + Number(next.expires_in ?? 86400) * 1000).toISOString();
  await sql`
    update tiktok_connections
    set access_token = ${next.access_token},
        refresh_token = ${next.refresh_token ?? link.refresh_token},
        expires_at = ${expiresAt}::timestamptz,
        updated_at = now()
    where user_id = ${userId}
  `;
  return next.access_token;
}

async function lookupTikTokVideo(sql: Sql, userId: string, videoId: string): Promise<TikTokVideo | null> {
  if (!(await loadIntegrations()).tiktok || videoId.startsWith("url:")) return null;
  try {
    const token = await freshTikTokToken(sql, userId);
    if (!token) return null;
    const videos = await tiktokVideoPages(token);
    return videos.find((video) => video.id === videoId) ?? null;
  } catch {
    return null;
  }
}

async function applyTikTokOfficial(sql: Sql, clip: Clip, video: TikTokVideo, actorId: string) {
  const publicViews = Number(video.view_count ?? 0);
  const spike = clip.publicViews >= 500 && publicViews > clip.publicViews * 8;
  const dropped = clip.publicViews >= 1000 && publicViews < clip.publicViews * 0.4;
  let flags = clip.flags.filter((flag) => flag !== "suspicious_spike" && flag !== "views_dropped");
  if (spike) flags = withFlag(flags, "suspicious_spike");
  if (dropped) flags = withFlag(flags, "views_dropped");
  await sql`
    update clips set
      public_views = ${publicViews},
      likes = ${video.like_count ?? null},
      comments = ${video.comment_count ?? null},
      shares = ${video.share_count ?? null},
      duration_seconds = ${video.duration ?? clip.durationSeconds},
      title = ${video.title || clip.title},
      thumbnail_url = ${video.cover_image_url ?? clip.thumbnailUrl},
      availability = 'public',
      stats_source = 'tiktok_api',
      stats_verified = true,
      stats_error = ${spike ? "Salto de reproducciones fuera de lo normal. Las vistas válidas no se movieron." : null},
      flags = ${JSON.stringify(flags)}::jsonb,
      stats_updated_at = now(),
      updated_at = now()
    where id = ${clip.id}
  `;
  const canAccrue =
    !clip.viewsLocked &&
    !spike &&
    !dropped &&
    (clip.status === "approved" || clip.status === "settled") &&
    publicViews > clip.billedViews;
  if (canAccrue) {
    await accrue(sql, {
      clipId: clip.id,
      newValid: publicViews,
      actorId,
      kind: "accrual",
      note: "Sincronización TikTok video.list. Solo se liquidó el aumento.",
      source: "tiktok_api",
      lock: false,
      status: null,
    });
  } else {
    await writeHistory(sql, clip.id, "tiktok_api", spike ? "Salto sospechoso" : "Observación", actorId);
  }
  if (spike) {
    await notifyAdmins(sql, "fraud", "Reproducciones sospechosas", `${clip.title} multiplicó sus vistas en TikTok.`, "/admin/clips");
  }
  return canAccrue ? "Estadísticas de TikTok verificadas y diferencia liquidada." : "Estadísticas de TikTok actualizadas.";
}

export async function syncUserTikTok(sql: Sql, userId: string, actorId: string): Promise<{ synced: number; errors: string[] }> {
  if (!(await loadIntegrations()).tiktok) {
    return { synced: 0, errors: ["TikTok no tiene client key y secret. No se inventaron vistas."] };
  }
  let token: string | null;
  try {
    token = await freshTikTokToken(sql, userId);
  } catch (error) {
    return { synced: 0, errors: [error instanceof Error ? error.message : "No se pudo refrescar TikTok."] };
  }
  if (!token) return { synced: 0, errors: ["Esa cuenta no autorizó TikTok."] };
  let videos: TikTokVideo[];
  try {
    videos = await tiktokVideoPages(token);
  } catch (error) {
    return { synced: 0, errors: [error instanceof Error ? error.message : "video.list falló."] };
  }
  const rows = await sql.query<ClipRow>(
    `select ${CLIP_FIELDS} ${CLIP_FROM} where c.user_id = $1 and c.provider = 'tiktok' and c.availability <> 'deleted'`,
    [userId],
  );
  let synced = 0;
  const errors: string[] = [];
  for (const clip of rows.map(mapClip)) {
    const video = videos.find((item) => item.id === clip.externalId);
    if (!video) continue;
    const message = await applyTikTokOfficial(sql, clip, video, actorId);
    if (message.includes("Salto") || clip.flags.includes("suspicious_spike")) errors.push(`${clip.title}: ${message}`);
    synced += 1;
  }
  return { synced, errors };
}

function requestOrigin(): string {
  const configured = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* the explicit URI is still used below */
    }
  }
  const request = getRequest();
  const host = request?.headers.get("x-forwarded-host") ?? request?.headers.get("host");
  const proto = request?.headers.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return "http://127.0.0.1:8080";
}

export function tiktokRedirectUri(): string {
  return process.env.TIKTOK_REDIRECT_URI?.trim() || `${requestOrigin()}/api/tiktok/callback`;
}

export const getMyClips = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    const rows = await sql.query<ClipRow>(
      `select ${CLIP_FIELDS} ${CLIP_FROM} where c.user_id = $1 order by c.id desc limit 200`,
      [profile.userId],
    );
    return rows.map(mapClip);
  };

export const getClipDetail = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    const clip = await loadClip(sql, data.id);
    if (!clip) throw new Error("Publicación no encontrada.");
    if (profile.role !== "admin" && clip.userId !== profile.userId) {
      throw new Error("No tienes acceso a esta publicación.");
    }
    const history = await sql<{
      recorded_at: string;
      public_views: number;
      valid_views: number;
      source: string;
      note: string | null;
    }>`
      select to_char(recorded_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as recorded_at,
             public_views, valid_views, source, note
      from clip_statistics
      where clip_id = ${clip.id}
      order by id desc
      limit 40
    `;
    const earnings = await sql<{
      created_at: string;
      views_delta: number;
      rate_per_mille: string;
      amount: string;
      kind: string;
      note: string | null;
    }>`
      select to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             views_delta, rate_per_mille::text as rate_per_mille, amount::text as amount, kind, note
      from earnings
      where clip_id = ${clip.id}
      order by id desc
    `;
    return {
      clip,
      history: history.map((row) => ({
        at: row.recorded_at,
        publicViews: Number(row.public_views),
        validViews: Number(row.valid_views),
        source: row.source,
        note: row.note,
      })),
      earnings: earnings.map((row) => ({
        at: row.created_at,
        delta: Number(row.views_delta),
        rate: row.rate_per_mille,
        amount: row.amount,
        kind: row.kind,
        note: row.note,
      })),
    };
  };

export const getClipperDashboard = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    if (profile.role !== "clipper") throw new Error("Este panel es de clippers.");
    const balance = await balanceOf(sql, profile.userId);
    const views = await sql<{ views: number; posts: number }>`
      select coalesce(sum(valid_views), 0)::int as views,
             count(*) filter (where status in ('approved','settled'))::int as posts
      from clips where user_id = ${profile.userId}
    `;
    const byPlatform = await sql<{ platform_id: string; amount: string; views: number }>`
      select platform_id, coalesce(sum(amount), 0)::text as amount, coalesce(sum(views_delta), 0)::int as views
      from earnings
      where user_id = ${profile.userId} and platform_id is not null
      group by platform_id
    `;
    const series = await sql<{ bucket: string; views: number; amount: string }>`
      select to_char(day, 'YYYY-MM-DD') as bucket,
             coalesce(sum(e.views_delta), 0)::int as views,
             coalesce(sum(e.amount), 0)::text as amount
      from generate_series(current_date - 13, current_date, interval '1 day') day
      left join earnings e
        on (e.created_at at time zone 'UTC')::date = day::date
       and e.user_id = ${profile.userId}
      group by day
      order by day
    `;
    const received = await sql<{ total: string }>`
      select coalesce(sum(amount), 0)::text as total from payments where user_id = ${profile.userId}
    `;
    return {
      profile,
      balance,
      views: Number(views[0]?.views ?? 0),
      posts: Number(views[0]?.posts ?? 0),
      received: received[0]?.total ?? "0.00",
      byPlatform,
      series,
    };
  };

export const savePayoutAccount = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    assertActive(profile);
    await sql`
      insert into payout_accounts (user_id, holder_name, bank_name, account_type, account_number)
      values (${profile.userId}, ${data.holderName}, ${data.bankName}, ${data.accountType}, ${data.accountNumber})
      on conflict (user_id) do update set
        holder_name = excluded.holder_name,
        bank_name = excluded.bank_name,
        account_type = excluded.account_type,
        account_number = excluded.account_number,
        updated_at = now()
    `;
    await audit(sql, profile.userId, "payout.account", "payout_account", profile.userId, {
      bankName: data.bankName,
      accountType: data.accountType,
    });
    return { ok: true };
  };

export const requestPayout = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    if (profile.role !== "clipper") throw new Error("Solo un clipper solicita retiros.");
    assertActive(profile);
    const amount = parseMoneyInput(data.amount);
    const cents = amountToCents(amount);
    if (cents <= 0) throw new Error("El monto debe ser mayor que cero.");
    const settings = await sql<{ min_payout: string }>`select min_payout::text as min_payout from agency_settings where id = 1`;
    const minimum = amountToCents(settings[0]?.min_payout ?? "10.00");
    if (cents < minimum) throw new Error(`El mínimo de retiro es US$${(minimum / 100).toFixed(2)}.`);
    const account = await sql<{ id: number }>`select id from payout_accounts where user_id = ${profile.userId}`;
    if (!account[0]) throw new Error("Registra tu cuenta del Banco Popular u otro banco antes de retirar.");
    const balance = await balanceOf(sql, profile.userId);
    if (cents > amountToCents(balance.available)) throw new Error("El monto supera tu balance disponible.");
    const inserted = await sql<{ id: number }>`
      insert into payout_requests (user_id, amount, note)
      values (${profile.userId}, ${amount}::numeric, ${data.note?.trim() || null})
      returning id
    `;
    await notifyAdmins(sql, "payout", "Solicitud de pago", `${profile.displayName} solicitó US$${amount}.`, "/admin/payments");
    await notify(sql, profile.userId, "payout", "Solicitud enviada", `Tu retiro de US$${amount} está pendiente. No es una transferencia automática.`, "/clipper/payments");
    await audit(sql, profile.userId, "payout.request", "payout_request", String(inserted[0]?.id), { amount });
    return { id: inserted[0]?.id };
  };

export const getMyPayments = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    const balance = await balanceOf(sql, profile.userId);
    const account = await sql<{
      holder_name: string;
      bank_name: string;
      account_type: string;
      account_number: string;
    }>`
      select holder_name, bank_name, account_type, account_number
      from payout_accounts where user_id = ${profile.userId}
    `;
    const requests = await sql<{
      id: number;
      amount: string;
      status: string;
      note: string | null;
      admin_note: string | null;
      rejection_reason: string | null;
      created_at: string;
      reference: string | null;
      receipt_url: string | null;
      paid_at: string | null;
    }>`
      select r.id, r.amount::text as amount, r.status, r.note, r.admin_note, r.rejection_reason,
             to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             pay.reference, pay.receipt_url,
             to_char(pay.paid_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as paid_at
      from payout_requests r
      left join payments pay on pay.request_id = r.id
      where r.user_id = ${profile.userId}
      order by r.id desc
    `;
    const ledger = await sql<{
      id: number;
      created_at: string;
      platform_id: string | null;
      views_delta: number;
      rate_per_mille: string;
      amount: string;
      kind: string;
      note: string | null;
      title: string | null;
    }>`
      select e.id,
             to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             e.platform_id, e.views_delta, e.rate_per_mille::text as rate_per_mille,
             e.amount::text as amount, e.kind, e.note, c.title
      from earnings e
      left join clips c on c.id = e.clip_id
      where e.user_id = ${profile.userId}
      order by e.id desc
      limit 200
    `;
    const minimum = await sql<{ min_payout: string }>`select min_payout::text as min_payout from agency_settings where id = 1`;
    return {
      balance,
      minimum: minimum[0]?.min_payout ?? "10.00",
      account: account[0]
        ? {
            holderName: account[0].holder_name,
            bankName: account[0].bank_name,
            accountType: account[0].account_type,
            accountNumber: account[0].account_number,
          }
        : null,
      requests,
      ledger,
    };
  };

async function series(
  sql: Sql,
  unit: "day" | "week" | "month",
  points: number,
  platform: string,
  to: string,
) {
  const step = unit === "day" ? "1 day" : unit === "week" ? "1 week" : "1 month";
  const lookback =
    unit === "day" ? `${points - 1} days` : unit === "week" ? `${points - 1} weeks` : `${points - 1} months`;
  return sql.query<{ bucket: string; views: number; amount: string }>(
    `select to_char(bucket, 'YYYY-MM-DD') as bucket,
            coalesce(sum(e.views_delta), 0)::int as views,
            coalesce(sum(e.amount), 0)::text as amount
     from generate_series(
       date_trunc('${unit}', $2::date) - interval '${lookback}',
       date_trunc('${unit}', $2::date),
       interval '${step}'
     ) bucket
     left join earnings e
       on date_trunc('${unit}', e.created_at at time zone 'UTC') = bucket
      and ($1 = 'all' or e.platform_id = $1)
     group by bucket
     order by bucket`,
    [platform, to],
  );
}

export const getAdminDashboard = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const platform = data.platform ?? "all";
    const from = data.from ?? "1970-01-01";
    const to = data.to ?? new Date().toISOString().slice(0, 10);
    const cards = await sql.query<{
      clippers: number;
      active_clippers: number;
      posts: number;
      pending_posts: number;
      views: number;
      tiktok_views: number;
      shorts_views: number;
      video_views: number;
      earned: string;
      paid: string;
      pending_pay: string;
    }>(
      `select
         (select count(*)::int from profiles where role = 'clipper') as clippers,
         (select count(*)::int from profiles where role = 'clipper' and status = 'active') as active_clippers,
         (select count(*)::int from clips c where c.created_at >= $2::date and c.created_at < ($3::date + interval '1 day') and ($1 = 'all' or c.platform_id = $1)) as posts,
         (select count(*)::int from clips c where c.status in ('pending','in_review') and ($1 = 'all' or c.platform_id = $1)) as pending_posts,
         (select coalesce(sum(views_delta),0)::int from earnings e where e.created_at >= $2::date and e.created_at < ($3::date + interval '1 day') and ($1 = 'all' or e.platform_id = $1)) as views,
         (select coalesce(sum(valid_views),0)::int from clips where platform_id = 'tiktok' and status in ('approved','settled')) as tiktok_views,
         (select coalesce(sum(valid_views),0)::int from clips where platform_id = 'youtube_shorts' and status in ('approved','settled')) as shorts_views,
         (select coalesce(sum(valid_views),0)::int from clips where platform_id = 'youtube_video' and status in ('approved','settled')) as video_views,
         (select coalesce(sum(amount),0)::text from earnings e where e.created_at >= $2::date and e.created_at < ($3::date + interval '1 day') and ($1 = 'all' or e.platform_id = $1)) as earned,
         (select coalesce(sum(amount),0)::text from payments where paid_at >= $2::date and paid_at < ($3::date + interval '1 day')) as paid,
         (select coalesce(sum(amount),0)::text from payout_requests where status in ('pending','approved','processing')) as pending_pay`,
      [platform, from, to],
    );
    const card = cards[0];
    const earnedCents = amountToCents(card?.earned ?? "0");
    const paidCents = amountToCents(card?.paid ?? "0");
    const platforms = await sql.query<{ platform_id: string; views: number; amount: string; posts: number }>(
      `select p.id as platform_id,
              coalesce(sum(c.valid_views) filter (where c.status in ('approved','settled')), 0)::int as views,
              coalesce((select sum(e.amount) from earnings e where e.platform_id = p.id and e.created_at >= $2::date and e.created_at < ($3::date + interval '1 day')), 0)::text as amount,
              count(c.id) filter (where c.status in ('approved','settled'))::int as posts
       from platforms p
       left join clips c on c.platform_id = p.id
       where $1 = 'all' or p.id = $1
       group by p.id
       order by p.id`,
      [platform, from, to],
    );
    const [daily, weekly, monthly] = await Promise.all([
      series(sql, "day", 14, platform, to),
      series(sql, "week", 8, platform, to),
      series(sql, "month", 6, platform, to),
    ]);
    const leaders = await sql.query<{ display_name: string; amount: string; views: number }>(
      `select p.display_name,
              coalesce(sum(e.amount), 0)::text as amount,
              coalesce(sum(e.views_delta), 0)::int as views
       from profiles p
       left join earnings e on e.user_id = p.user_id
         and e.created_at >= $2::date and e.created_at < ($3::date + interval '1 day')
         and ($1 = 'all' or e.platform_id = $1)
       where p.role = 'clipper'
       group by p.user_id, p.display_name
       order by sum(e.amount) desc nulls last
       limit 8`,
      [platform, from, to],
    );
    return {
      from,
      to,
      platform,
      cards: {
        clippers: Number(card?.clippers ?? 0),
        activeClippers: Number(card?.active_clippers ?? 0),
        posts: Number(card?.posts ?? 0),
        pendingPosts: Number(card?.pending_posts ?? 0),
        views: Number(card?.views ?? 0),
        tiktokViews: Number(card?.tiktok_views ?? 0),
        shortsViews: Number(card?.shorts_views ?? 0),
        videoViews: Number(card?.video_views ?? 0),
        earned: card?.earned ?? "0.00",
        paid: card?.paid ?? "0.00",
        pendingPay: card?.pending_pay ?? "0.00",
        outstanding: centsToAmount(earnedCents - paidCents),
      },
      platforms,
      daily,
      weekly,
      monthly,
      leaders,
    };
  };

export const listClippers = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    return sql<{
      user_id: string;
      display_name: string;
      email: string | null;
      avatar_url: string | null;
      status: string;
      phone: string | null;
      created_at: string;
      views: number;
      posts: number;
      earned: string;
      month_posts: number;
      month_views: number;
      last_at: string | null;
    }>`
      select p.user_id, p.display_name, u.email, p.avatar_url, p.status, p.phone,
             to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             coalesce((select sum(valid_views) from clips c where c.user_id = p.user_id and c.status in ('approved','settled')), 0)::int as views,
             (select count(*)::int from clips c where c.user_id = p.user_id) as posts,
             coalesce((select sum(amount) from earnings e where e.user_id = p.user_id), 0)::text as earned,
             (select count(*)::int from clips c where c.user_id = p.user_id and c.created_at >= date_trunc('month', now())) as month_posts,
             coalesce((select sum(valid_views) from clips c where c.user_id = p.user_id and c.status in ('approved','settled') and c.updated_at >= date_trunc('month', now())), 0)::int as month_views,
             (select to_char(max(c.updated_at) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') from clips c where c.user_id = p.user_id) as last_at
      from profiles p
      join "user" u on u.id = p.user_id
      where p.role = 'clipper'
      order by p.created_at desc
    `;
  };

export const updateClipper = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    if (data.remove) {
      const money = await sql<{ total: number }>`
        select (
          (select count(*) from earnings where user_id = ${data.userId}) +
          (select count(*) from payout_requests where user_id = ${data.userId})
        )::int as total
      `;
      if (Number(money[0]?.total ?? 0) > 0) {
        throw new Error("No se elimina: hay historial financiero. Suspéndelo para conservar el registro.");
      }
      await audit(sql, admin.userId, "clipper.delete", "profile", data.userId, {});
      await sql`delete from profiles where user_id = ${data.userId} and role = 'clipper'`;
      return { ok: true };
    }
    await sql`
      update profiles
      set status = coalesce(${data.status ?? null}, status),
          display_name = coalesce(${data.displayName ?? null}, display_name),
          updated_at = now()
      where user_id = ${data.userId} and role = 'clipper'
    `;
    await audit(sql, admin.userId, "clipper.update", "profile", data.userId, {
      status: data.status ?? null,
    });
    if (data.status) {
      await notify(sql, data.userId, "account", "Estado de tu cuenta", `Tu cuenta quedó ${data.status}.`, "/clipper/dashboard");
    }
    return { ok: true };
  };

export const createInvite = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = inviteCode();
      const inserted = await sql<{ code: string }>`
        insert into invites (code, created_by, expires_at)
        values (${code}, ${admin.userId}, now() + interval '7 days')
        on conflict (code) do nothing
        returning code
      `;
      if (inserted[0]) return { code, expiresInDays: 7 };
    }
    throw new Error("No se pudo generar la invitación.");
  };

export const listInvites = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    return sql<{ code: string; expires_at: string; used_by: string | null; created_at: string }>`
      select code,
             to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as expires_at,
             used_by,
             to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from invites
      order by created_at desc
      limit 30
    `;
  };

export const listClips = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const rows = await sql.query<ClipRow>(
      `select ${CLIP_FIELDS} ${CLIP_FROM}
       where ($1 = '' or c.status = $1)
         and ($2 = '' or c.platform_id = $2)
         and ($3 = '' or c.title ilike '%' || $3 || '%' or c.external_id ilike '%' || $3 || '%' or p.display_name ilike '%' || $3 || '%')
       order by c.id desc
       limit 50 offset $4`,
      [data.status ?? "", data.platform ?? "", data.q ?? "", data.offset ?? 0],
    );
    return rows.map(mapClip);
  };

export const reviewClip = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const clip = await loadClip(sql, data.clipId);
    if (!clip) throw new Error("Publicación no encontrada.");
    if (data.action === "reject") {
      if ((data.reason ?? "").trim().length < 8) throw new Error("Explica el rechazo en al menos 8 caracteres.");
      if (clip.billedViews > 0) throw new Error("Esta publicación ya tiene ganancias. Ajusta las vistas antes de rechazarla.");
      await sql`
        update clips set status = 'rejected', rejection_reason = ${data.reason!.trim()}, updated_at = now()
        where id = ${clip.id}
      `;
      await notify(sql, clip.userId, "clip", "Clip rechazado", data.reason!.trim(), "/clipper/my-clips");
    } else if (data.action === "suspend") {
      await sql`update clips set status = 'suspended', updated_at = now() where id = ${clip.id}`;
      await notify(sql, clip.userId, "clip", "Clip suspendido", clip.title, "/clipper/my-clips");
    } else if (data.action === "review") {
      await sql`update clips set status = 'in_review', updated_at = now() where id = ${clip.id}`;
    } else if (data.action === "verified") {
      await sql`update clips set status = 'verified', updated_at = now() where id = ${clip.id}`;
    } else if (data.action === "settle") {
      if (clip.status !== "approved") throw new Error("Solo se liquida una publicación aprobada.");
      await sql`update clips set status = 'settled', updated_at = now() where id = ${clip.id}`;
    } else {
      if (clip.classification !== "confirmed") {
        throw new Error("Confirma si es Short o video antes de aprobar.");
      }
      const requested = data.validViews ?? (clip.statsVerified ? clip.publicViews : 0);
      const manual = requested !== clip.publicViews || !clip.statsVerified;
      if (manual && (data.justification ?? "").trim().length < 12) {
        throw new Error("Si las vistas no vienen verificadas por la API, justifica el ajuste (mínimo 12 caracteres).");
      }
      await accrue(sql, {
        clipId: clip.id,
        newValid: requested,
        actorId: admin.userId,
        kind: manual ? "adjustment" : "accrual",
        note: manual ? data.justification!.trim() : "Aprobación con estadísticas de la API.",
        source: manual ? "admin_adjustment" : clip.statsSource,
        lock: manual,
        status: "approved",
      });
      if (manual) {
        await sql`
          update clips set stats_verified = false, stats_source = 'admin_adjustment'
          where id = ${clip.id}
        `;
      }
      await notify(sql, clip.userId, "clip", "Clip aprobado", `«${clip.title}» fue aprobado.`, "/clipper/my-clips");
    }
    await audit(sql, admin.userId, `clip.${data.action}`, "clip", String(clip.id), {
      validViews: data.validViews ?? null,
      reason: data.reason ?? data.justification ?? null,
    });
    return { ok: true };
  };

export const classifyClip = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const clip = await loadClip(sql, data.clipId);
    if (!clip || clip.provider !== "youtube") throw new Error("Solo YouTube necesita esta clasificación.");
    if (data.platformId === "youtube_shorts" && clip.durationSeconds != null && clip.durationSeconds > 180) {
      throw new Error("Un video de más de 3 minutos no puede clasificarse como Short.");
    }
    await sql`
      update clips
      set platform_id = ${data.platformId},
          classification = 'confirmed',
          flags = ${JSON.stringify(clip.flags.filter((flag) => flag !== "conflict"))}::jsonb,
          updated_at = now()
      where id = ${clip.id}
    `;
    await audit(sql, admin.userId, "clip.classify", "clip", String(clip.id), { platformId: data.platformId });
    return { ok: true };
  };

export const adjustViews = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const clip = await loadClip(sql, data.clipId);
    if (!clip) throw new Error("Publicación no encontrada.");
    if (clip.status !== "approved" && clip.status !== "settled") {
      throw new Error("Aprueba la publicación antes de ajustar vistas válidas.");
    }
    await accrue(sql, {
      clipId: clip.id,
      newValid: data.validViews,
      actorId: admin.userId,
      kind: "adjustment",
      note: data.justification,
      source: "admin_adjustment",
      lock: true,
      status: null,
    });
    await sql`
      update clips set stats_verified = false, stats_source = 'admin_adjustment', updated_at = now()
      where id = ${clip.id}
    `;
    await audit(sql, admin.userId, "clip.adjust", "clip", String(clip.id), {
      validViews: data.validViews,
      justification: data.justification,
    });
    return { ok: true };
  };

export const syncClip = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    const clip = await loadClip(sql, data.clipId);
    if (!clip) throw new Error("Publicación no encontrada.");
    if (profile.role !== "admin" && clip.userId !== profile.userId) throw new Error("No tienes acceso.");
    if (clip.provider === "tiktok") {
      const video = await lookupTikTokVideo(sql, clip.userId, clip.externalId);
      if (!video) {
        return {
          ok: false,
          message: (await loadIntegrations()).tiktok
            ? "TikTok no devolvió ese video. La cuenta dueña debe autorizar video.list y el clip tiene que ser de esa cuenta."
            : "Faltan TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET. No se marcaron vistas como verificadas.",
        };
      }
      const message = await applyTikTokOfficial(sql, clip, video, profile.userId);
      return { ok: true, message, synced: 1 };
    }
    const result = await syncRows(sql, [clip], profile.userId);
    return { ok: result.errors.length === 0, message: result.errors[0] ?? "Sincronización hecha.", synced: result.synced };
  };

export const syncYoutubeBatch = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const rows = await sql.query<ClipRow>(
      `select ${CLIP_FIELDS} ${CLIP_FROM}
       where c.provider = 'youtube' and c.availability <> 'deleted'
         and c.status in ('pending','in_review','verified','approved','settled')
       order by c.stats_updated_at nulls first
       limit 25`,
    );
    const result = await syncRows(sql, rows.map(mapClip), admin.userId);
    await audit(sql, admin.userId, "youtube.sync", "integration", "youtube", result);
    return result;
  };

export const listPayouts = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    return sql<{
      id: number;
      user_id: string;
      display_name: string;
      amount: string;
      status: string;
      note: string | null;
      created_at: string;
      holder_name: string | null;
      bank_name: string | null;
      account_type: string | null;
      account_number: string | null;
      reference: string | null;
      receipt_url: string | null;
    }>`
      select r.id, r.user_id, p.display_name, r.amount::text as amount, r.status, r.note,
             to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             a.holder_name, a.bank_name, a.account_type, a.account_number,
             pay.reference, pay.receipt_url
      from payout_requests r
      join profiles p on p.user_id = r.user_id
      left join payout_accounts a on a.user_id = r.user_id
      left join payments pay on pay.request_id = r.id
      order by r.id desc
      limit 200
    `;
  };

export const decidePayout = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    if (data.action === "rejected" && (data.reason ?? "").trim().length < 8) {
      throw new Error("Explica el rechazo.");
    }
    const rows = await sql<{ user_id: string; status: string }>`
      select user_id, status from payout_requests where id = ${data.id}
    `;
    const request = rows[0];
    if (!request) throw new Error("Solicitud no encontrada.");
    if (request.status === "paid") throw new Error("Ese pago ya está completado.");
    await sql`
      update payout_requests
      set status = ${data.action},
          rejection_reason = ${data.action === "rejected" ? data.reason!.trim() : null},
          updated_at = now()
      where id = ${data.id}
    `;
    await notify(
      sql,
      request.user_id,
      "payout",
      "Actualización de tu retiro",
      data.action === "rejected" ? data.reason!.trim() : `Tu solicitud pasó a ${data.action}.`,
      "/clipper/payments",
    );
    await audit(sql, admin.userId, "payout.decide", "payout_request", String(data.id), { action: data.action });
    return { ok: true };
  };

export const recordPayment = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const receipt = data.receiptUrl?.trim() || null;
    if (receipt && !/^https:\/\//.test(receipt)) throw new Error("El comprobante debe ser un enlace https.");
    const rows = await sql<{ user_id: string; amount: string; status: string }>`
      select user_id, amount::text as amount, status from payout_requests where id = ${data.id}
    `;
    const request = rows[0];
    if (!request) throw new Error("Solicitud no encontrada.");
    if (request.status === "paid" || request.status === "rejected") {
      throw new Error("Esa solicitud ya no admite un pago.");
    }
    await sql`
      update payout_requests
      set status = 'paid', admin_note = ${data.adminNote?.trim() || null}, updated_at = now()
      where id = ${data.id} and status <> 'paid'
    `;
    await sql`
      insert into payments (request_id, user_id, amount, reference, receipt_url, recorded_by)
      values (${data.id}, ${request.user_id}, ${request.amount}::numeric, ${data.reference.trim()}, ${receipt}, ${admin.userId})
    `;
    await notify(
      sql,
      request.user_id,
      "payout",
      "Transferencia registrada",
      `Se registró la transferencia manual por US$${request.amount}. Referencia ${data.reference.trim()}. CLIPRD no mueve el dinero: esto documenta el pago que ya hiciste en el banco.`,
      "/clipper/payments",
    );
    await audit(sql, admin.userId, "payout.record", "payment", String(data.id), { reference: data.reference.trim() });
    return { ok: true };
  };

export const setRate = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const normalized = data.amount.trim().replace(",", ".");
    if (!/^\d+(\.\d{1,4})?$/.test(normalized)) throw new Error("Tarifa inválida.");
    const scale = rateScale(normalized);
    const amount = `${Math.floor(scale / 10000)}.${String(scale % 10000).padStart(4, "0")}`;
    await sql`
      update rates set active = false
      where platform_id = ${data.platformId} and active = true
    `;
    await sql`
      insert into rates (platform_id, amount_per_mille, created_by, note)
      values (${data.platformId}, ${amount}::numeric, ${admin.userId}, ${data.note?.trim() || "Cambio de tarifa"})
    `;
    await sql`
      insert into notifications (user_id, kind, title, body, href)
      select user_id, 'rate', 'Tarifa actualizada',
             ${"La tarifa nueva aplica solo a vistas que se liquiden después de este cambio."},
             '/clipper/earnings'
      from profiles where status = 'active'
    `;
    await audit(sql, admin.userId, "rate.set", "rate", data.platformId, { amount });
    return { ok: true, amount };
  };

export const addBonus = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const amount = parseMoneyInput(data.amount);
    if (amountToCents(amount) === 0) throw new Error("La bonificación no puede ser cero.");
    const clipper = await sql<{ user_id: string }>`
      select user_id from profiles where user_id = ${data.userId} and role = 'clipper'
    `;
    if (!clipper[0]) throw new Error("Clipper no encontrado.");
    await sql`
      insert into earnings (user_id, views_delta, rate_per_mille, amount, kind, note, created_by)
      values (${data.userId}, 0, 0, ${amount}::numeric, 'bonus', ${data.note}, ${admin.userId})
    `;
    await notify(sql, data.userId, "bonus", "Bonificación", data.note, "/clipper/earnings");
    await audit(sql, admin.userId, "earning.bonus", "profile", data.userId, { amount });
    return { ok: true };
  };

export const setPrize = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const amount = data.amount?.trim() ? parseMoneyInput(data.amount) : null;
    await sql`
      insert into ranking_prizes (scope, place, title, amount, active)
      values (${data.scope}, ${data.place}, ${data.title}, ${amount}::numeric, ${data.active})
      on conflict (scope, place) do update set
        title = excluded.title,
        amount = excluded.amount,
        active = excluded.active
    `;
    await audit(sql, admin.userId, "prize.set", "ranking_prize", `${data.scope}:${data.place}`, {
      title: data.title,
      active: data.active,
    });
    return { ok: true };
  };

export const getSettings = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const settings = await sql<{
      agency_name: string;
      slogan: string;
      currency: string;
      sync_interval_minutes: number;
      min_payout: string;
      youtube_quota_used: number;
      youtube_quota_day: string | null;
    }>`
      select agency_name, slogan, currency, sync_interval_minutes, min_payout::text as min_payout,
             youtube_quota_used, youtube_quota_day::text as youtube_quota_day
      from agency_settings where id = 1
    `;
    const rates = await sql<{ platform_id: string; amount: string; effective_from: string; note: string | null }>`
      select platform_id, amount_per_mille::text as amount,
             to_char(effective_from at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as effective_from,
             note
      from rates
      where active = true
      order by platform_id
    `;
    const integrations = await sql<{ id: string; label: string; status_note: string | null }>`
      select id, label, status_note from api_integrations order by id
    `;
    const integrationsEnv = await loadIntegrations();
    const request = getRequest();
    const origin = request ? new URL(request.url).origin : "https://clip-rd.vercel.app";
    return {
      settings: settings[0],
      rates,
      integrations,
      env: {
        youtube: integrationsEnv.youtube,
        youtubeHint: integrationsEnv.youtubeHint,
        tiktok: integrationsEnv.tiktok,
        tiktokHint: integrationsEnv.tiktokHint,
        cron: Boolean(process.env.CRON_SECRET?.trim()),
        database: dbSource === "neon" ? "Neon Postgres" : "Postgres de vista previa",
        tiktokRedirect: `${origin}/api/tiktok/callback`,
        productionRedirect: "https://clip-rd.vercel.app/api/tiktok/callback",
      },
    };
  };

export const updateSettings = async ({ context, data }: { context: { userId: string }; data: any }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const minPayout = parseMoneyInput(data.minPayout);
    await sql`
      update agency_settings
      set agency_name = ${data.agencyName},
          slogan = ${data.slogan},
          sync_interval_minutes = ${data.syncIntervalMinutes},
          min_payout = ${minPayout}::numeric,
          updated_at = now()
      where id = 1
    `;
    await audit(sql, admin.userId, "settings.update", "agency_settings", "1", {
      agencyName: data.agencyName,
      minPayout,
    });
    return { ok: true };
  };

export const listAudit = async ({ context }: { context: { userId: string } }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    return sql<{
      id: number;
      actor_id: string | null;
      action: string;
      entity: string;
      entity_id: string | null;
      created_at: string;
      actor_name: string | null;
    }>`
      select a.id, a.actor_id, a.action, a.entity, a.entity_id,
             to_char(a.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             p.display_name as actor_name
      from audit_logs a
      left join profiles p on p.user_id = a.actor_id
      order by a.id desc
      limit 80
    `;
  };

export const getReports = async ({ context, data }: { context: { userId: string }; data: any }): Promise<ReportTable> => {
    const sql = await getSql();
    const profile = await requireProfile(sql, context.userId);
    const admin = profile.role === "admin";
    const userFilter = admin ? null : profile.userId;
    if (data.kind === "participants") {
      if (!admin) throw new Error("Ese reporte es de la agencia.");
      const rows = await sql.query<{ name: string; views: number; posts: number; earned: string; paid: string }>(
        `select p.display_name as name,
                coalesce(sum(e.views_delta),0)::int as views,
                (select count(*)::int from clips c where c.user_id = p.user_id and c.status in ('approved','settled')) as posts,
                coalesce(sum(e.amount),0)::text as earned,
                coalesce((select sum(amount) from payments pay where pay.user_id = p.user_id and pay.paid_at >= $1::date and pay.paid_at < ($2::date + interval '1 day')),0)::text as paid
         from profiles p
         left join earnings e on e.user_id = p.user_id and e.created_at >= $1::date and e.created_at < ($2::date + interval '1 day')
         where p.role = 'clipper'
         group by p.user_id, p.display_name
         order by sum(e.amount) desc nulls last`,
        [data.from, data.to],
      );
      return {
        title: "Reproducciones y ganancias por participante",
        columns: ["Participante", "Vistas liquidadas", "Publicaciones aprobadas", "Ganancias", "Pagos"],
        rows: rows.map((row) => [row.name, String(row.views), String(row.posts), row.earned, row.paid]),
      };
    }
    if (data.kind === "platforms") {
      const rows = await sql.query<{ platform_id: string; views: number; amount: string }>(
        `select coalesce(platform_id, 'bonificacion') as platform_id,
                coalesce(sum(views_delta),0)::int as views,
                coalesce(sum(amount),0)::text as amount
         from earnings
         where created_at >= $1::date and created_at < ($2::date + interval '1 day')
           and ($3::text is null or user_id = $3)
         group by 1
         order by 1`,
        [data.from, data.to, userFilter],
      );
      return {
        title: "Ganancias por plataforma",
        columns: ["Plataforma", "Vistas del movimiento", "Monto USD"],
        rows: rows.map((row) => [row.platform_id, String(row.views), row.amount]),
      };
    }
    if (data.kind === "paid" || data.kind === "pending") {
      const rows = await sql.query<{ name: string; amount: string; status: string; created_at: string; reference: string | null }>(
        `select p.display_name as name, r.amount::text as amount, r.status,
                to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD') as created_at,
                pay.reference
         from payout_requests r
         join profiles p on p.user_id = r.user_id
         left join payments pay on pay.request_id = r.id
         where r.created_at >= $1::date and r.created_at < ($2::date + interval '1 day')
           and ($3::text is null or r.user_id = $3)
           and ($4 = 'paid' and r.status = 'paid' or $4 = 'pending' and r.status in ('pending','approved','processing'))
         order by r.id desc`,
        [data.from, data.to, userFilter, data.kind],
      );
      return {
        title: data.kind === "paid" ? "Pagos realizados" : "Pagos pendientes",
        columns: ["Participante", "Monto USD", "Estado", "Fecha", "Referencia"],
        rows: rows.map((row) => [row.name, row.amount, row.status, row.created_at, row.reference ?? ""]),
      };
    }
    if (data.kind === "monthly" || data.kind === "general" || data.kind === "earnings") {
      const rows = await sql.query<{
        bucket: string;
        platform_id: string | null;
        views: number;
        amount: string;
        title: string | null;
        rate: string;
      }>(
        `select to_char(date_trunc('month', e.created_at at time zone 'UTC'), 'YYYY-MM') as bucket,
                e.platform_id, e.views_delta::int as views, e.amount::text as amount,
                c.title, e.rate_per_mille::text as rate
         from earnings e
         left join clips c on c.id = e.clip_id
         where e.created_at >= $1::date and e.created_at < ($2::date + interval '1 day')
           and ($3::text is null or e.user_id = $3)
         order by e.id desc
         limit 500`,
        [data.from, data.to, userFilter],
      );
      if (data.kind === "monthly") {
        const grouped = new Map<string, { views: number; cents: number }>();
        for (const row of rows) {
          const key = `${row.bucket} · ${row.platform_id ?? "bono"}`;
          const current = grouped.get(key) ?? { views: 0, cents: 0 };
          current.views += Number(row.views);
          current.cents += amountToCents(row.amount);
          grouped.set(key, current);
        }
        return {
          title: "Reporte mensual",
          columns: ["Mes y plataforma", "Vistas", "Monto USD"],
          rows: [...grouped.entries()].map(([key, value]) => [key, String(value.views), centsToAmount(value.cents)]),
        };
      }
      return {
        title: data.kind === "general" ? "Reporte general de movimientos" : "Ganancias individuales",
        columns: ["Mes", "Publicación", "Plataforma", "Vistas", "Tarifa /1000", "Monto USD"],
        rows: rows.map((row) => [
          row.bucket,
          row.title ?? "Bonificación",
          row.platform_id ?? "—",
          String(row.views),
          row.rate,
          row.amount,
        ]),
      };
    }
    throw new Error("Reporte no disponible.");
  };

export const probeYoutube = async ({ context }: { context: { userId: string } }) => {
  const sql = await getSql();
  await requireAdmin(sql, context.userId);
  const state = (await loadIntegrations()).youtube;
  if (state !== "ready") {
    return {
      ok: false as const,
      message:
        state === "placeholder"
          ? "La clave guardada es un marcador, no una API key de Google. No se llamó a videos.list."
          : "No hay clave de YouTube. Pégala en Ajustes. No se inventan vistas.",
    };
  }
  const result = await youtubeList(sql, ["jNQXAC9IVRw"]);
  if ("error" in result) return { ok: false as const, message: result.error };
  const item = result.items[0];
  if (!item) return { ok: false as const, message: "Google respondió sin el video de prueba." };
  const views = Number(item.statistics?.viewCount ?? 0).toLocaleString("es-DO");
  return {
    ok: true as const,
    message: `YouTube respondió. «${item.snippet?.title ?? "video de prueba"}» tiene ${views} vistas públicas.`,
  };
};

export const probeTikTok = async ({ context }: { context: { userId: string } }) => {
  const sql = await getSql();
  await requireAdmin(sql, context.userId);
  const config = await loadIntegrations();
  if (!config.tiktokKey || !config.tiktokSecret) {
    return {
      ok: false as const,
      message: "Faltan client key y client secret de TikTok. No es una API key como la de YouTube, y no se inventan vistas.",
    };
  }
  const redirectUri = tiktokRedirectUri();
  let response: Response;
  try {
    response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: config.tiktokKey,
        client_secret: config.tiktokSecret,
        code: "cliprd-probe",
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return { ok: false as const, message: "No se pudo contactar a TikTok. Las claves siguen guardadas, pero no se inventaron vistas." };
  }
  const payload = (await response.json().catch(() => null)) as { error?: string; error_description?: string } | null;
  const error = `${payload?.error ?? ""} ${payload?.error_description ?? ""}`.toLowerCase();
  if (response.ok && !payload?.error) {
    return { ok: false as const, message: "TikTok respondió sin error a un código falso. No se guardó ningún token." };
  }
  if (error.includes("invalid_client") || error.includes("client key") || error.includes("client_key")) {
    return { ok: false as const, message: "TikTok no reconoció esa client key o ese secret. Tienen que ser de la misma app." };
  }
  if (error.includes("invalid_grant") || error.includes("invalid code") || error.includes("authorization code") || error.includes("expired")) {
    return {
      ok: true as const,
      message: `TikTok reconoció la app. El código de prueba fue rechazado, que es lo correcto. Registra este redirect: ${redirectUri}`,
    };
  }
  const detail = payload?.error_description || payload?.error || `TikTok respondió ${response.status}.`;
  return { ok: false as const, message: detail };
};

export const startTikTokConnect = async ({ context }: { context: { userId: string } }) => {
  const sql = await getSql();
  const profile = await requireProfile(sql, context.userId);
  if (!(await loadIntegrations()).tiktok) {
    throw new Error("Define TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET en el servidor antes de conectar cuentas.");
  }
  const redirectUri = tiktokRedirectUri();
  const auth = await buildTikTokAuth({ redirectUri });
  await sql`delete from oauth_states where user_id = ${profile.userId} and provider = 'tiktok'`;
  await sql`
    insert into oauth_states (state, user_id, provider, code_verifier, expires_at)
    values (${auth.state}, ${profile.userId}, 'tiktok', ${auth.verifier}, now() + interval '15 minutes')
  `;
  return { url: auth.url };
};

export const getTikTokStatus = async ({ context }: { context: { userId: string } }) => {
  const sql = await getSql();
  await requireProfile(sql, context.userId);
  const rows = await sql<{ display_name: string | null }>`
    select display_name from tiktok_connections where user_id = ${context.userId}
  `;
  return {
    appReady: (await loadIntegrations()).tiktok,
    connected: Boolean(rows[0]),
    name: rows[0]?.display_name ?? null,
  };
};

export const disconnectTikTok = async ({ context }: { context: { userId: string } }) => {
  const sql = await getSql();
  await requireProfile(sql, context.userId);
  await sql`delete from tiktok_connections where user_id = ${context.userId}`;
  await audit(sql, context.userId, "tiktok.disconnect", "tiktok_connection", context.userId, {});
  return { ok: true };
};

export const syncMyTikTok = async ({ context }: { context: { userId: string } }) => {
  const sql = await getSql();
  const profile = await requireProfile(sql, context.userId);
  return syncUserTikTok(sql, profile.userId, profile.userId);
};

export const syncTiktokBatch = async ({ context }: { context: { userId: string } }) => {
  const sql = await getSql();
  const admin = await requireAdmin(sql, context.userId);
  const links = await sql<{ user_id: string }>`select user_id from tiktok_connections`;
  let synced = 0;
  const errors: string[] = [];
  if (!(await loadIntegrations()).tiktok) {
    return { synced: 0, errors: ["Sin TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET. No se inventaron vistas."] };
  }
  for (const link of links) {
    const result = await syncUserTikTok(sql, link.user_id, admin.userId);
    synced += result.synced;
    errors.push(...result.errors);
  }
  if (links.length === 0) errors.push("Ningún clipper autorizó TikTok todavía.");
  await audit(sql, admin.userId, "tiktok.sync", "integration", "tiktok", { synced, errors });
  return { synced, errors };
};

export async function finishTikTokOAuth(input: {
  userId: string | null;
  code: string | null;
  state: string | null;
  error: string | null;
}): Promise<string> {
  const fail = (message: string) => `/clipper/profile?tiktok=error&msg=${encodeURIComponent(message.slice(0, 180))}`;
  if (input.error) return fail(input.error);
  if (!input.userId) return fail("Inicia sesión antes de conectar TikTok.");
  if (!input.code || !input.state) return fail("TikTok no devolvió el código de autorización.");
  const sql = await getSql();
  const rows = await sql<{ user_id: string; code_verifier: string }>`
    delete from oauth_states
    where state = ${input.state} and provider = 'tiktok' and expires_at > now()
    returning user_id, code_verifier
  `;
  const row = rows[0];
  if (!row || row.user_id !== input.userId) return fail("La autorización venció o no coincide con tu sesión.");
  try {
    const token = await exchangeTikTokCode({
      code: input.code,
      verifier: row.code_verifier,
      redirectUri: tiktokRedirectUri(),
    });
    const who = await tiktokProfile(token.access_token);
    const expiresAt = new Date(Date.now() + Number(token.expires_in ?? 86400) * 1000).toISOString();
    await sql`
      insert into tiktok_connections (
        user_id, open_id, display_name, access_token, refresh_token, expires_at, scope
      ) values (
        ${input.userId},
        ${token.open_id ?? who.open_id ?? null},
        ${who.display_name ?? null},
        ${token.access_token},
        ${token.refresh_token ?? null},
        ${expiresAt}::timestamptz,
        ${token.scope ?? "user.info.basic,video.list"}
      )
      on conflict (user_id) do update set
        open_id = excluded.open_id,
        display_name = excluded.display_name,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        expires_at = excluded.expires_at,
        scope = excluded.scope,
        updated_at = now()
    `;
    await syncUserTikTok(sql, input.userId, input.userId);
    return "/clipper/profile?tiktok=ok";
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No se pudo guardar la conexión de TikTok.");
  }
}

const OPEN_ADMIN_ID = "30aa5209-24a3-46d8-9b4f-7beaf12f7df4";
const OPEN_ADMIN_EMAIL = "admin@cliprd.local";
const DOOR_EMAIL = OPEN_ADMIN_EMAIL;

export async function ensureOpenAdminId(): Promise<string> {
  const sql = await getSql();
  try {
    const existing = await sql<{ id: string }>`
      select id::text as id from "user"
      where id::text = ${OPEN_ADMIN_ID} or email = ${OPEN_ADMIN_EMAIL}
      limit 1
    `;
    let userId = existing[0]?.id ?? "";
    if (!userId) {
      const created = await sql<{ id: string }>`
        insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
        values (${OPEN_ADMIN_ID}, 'Administración CLIPRD', ${OPEN_ADMIN_EMAIL}, true, now(), now())
        on conflict (id) do nothing
        returning id::text as id
      `;
      userId = created[0]?.id ?? OPEN_ADMIN_ID;
    }
    await sql`
      insert into profiles (user_id, display_name, role, status, terms_version)
      values (${userId}, 'Administración CLIPRD', 'admin', 'active', ${TERMS_VERSION})
      on conflict (user_id) do update
        set role = 'admin', status = 'active', updated_at = now()
    `;
    return userId;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "error de base de datos";
    throw new Error(`No se pudo abrir el panel: ${detail}`);
  }
}

async function ensureDoorAdmin(sql: Sql, userId: string) {
  const existing = await sql<{ user_id: string }>`select user_id from profiles where user_id = ${userId}`;
  if (existing[0]) {
    await sql`
      update profiles
      set role = 'admin', status = 'active', updated_at = now()
      where user_id = ${userId}
    `;
    return;
  }
  await sql`
    insert into profiles (user_id, display_name, role, status, terms_version)
    values (${userId}, 'Administración CLIPRD', 'admin', 'active', ${TERMS_VERSION})
  `;
}

export async function openAdminDoor(): Promise<{ token: string }> {
  const sql = await getSql();
  const { auth } = await import("@/lib/auth/server");
  const headers = getRequest()?.headers ?? new Headers();
  const stored = await sql<{ admin_door: string | null }>`
    select admin_door from agency_settings where id = 1
  `;
  let password = stored[0]?.admin_door?.trim() ?? "";
  const signIn = (value: string) =>
    auth.api.signInEmail({
      body: { email: DOOR_EMAIL, password: value, rememberMe: true },
      headers,
    });
  let session: { token: string | null; user: { id: string } } | null = null;
  if (password) {
    try {
      session = await signIn(password);
    } catch {
      session = null;
    }
  }
  if (!session) {
    const next = randomBytes(24).toString("base64url");
    try {
      session = await auth.api.signUpEmail({
        body: { email: DOOR_EMAIL, password: next, name: "Administración CLIPRD" },
        headers,
      });
      password = next;
      await sql`update agency_settings set admin_door = ${password} where id = 1`;
    } catch {
      const { hashPassword } = await import("better-auth/crypto");
      const hash = await hashPassword(next);
      const updated = await sql<{ id: string }>`
        update "account" as a
        set password = ${hash}, "updatedAt" = now()
        from "user" as u
        where u.email = ${DOOR_EMAIL}
          and a."userId" = u.id
          and a."providerId" = 'credential'
        returning u.id
      `;
      if (!updated[0]) throw new Error("No se pudo preparar la cuenta de administración.");
      password = next;
      await sql`update agency_settings set admin_door = ${password} where id = 1`;
      session = await signIn(password);
    }
  }
  if (!session?.token) throw new Error("No se pudo abrir el panel de administración.");
  await ensureDoorAdmin(sql, session.user.id);
  return { token: session.token };
}

export const saveIntegrationKeys = async ({ context, data }: { context: { userId: string }; data: any }) => {
  const sql = await getSql();
  const admin = await requireAdmin(sql, context.userId);
  if (data.clearYoutube) {
    await sql`update agency_settings set youtube_api_key = null, updated_at = now() where id = 1`;
  } else if (typeof data.youtubeApiKey === "string" && data.youtubeApiKey.trim()) {
    const key = data.youtubeApiKey.trim();
    if (secretState(key) !== "ready") {
      throw new Error("Eso no es una API key de YouTube. En Google Cloud crea una API key, no un cliente OAuth ni una contraseña.");
    }
    await sql`update agency_settings set youtube_api_key = ${key}, updated_at = now() where id = 1`;
  }
  if (data.clearTiktok) {
    await sql`
      update agency_settings
      set tiktok_client_key = null, tiktok_client_secret = null, updated_at = now()
      where id = 1
    `;
  } else if (data.tiktokClientKey?.trim() || data.tiktokClientSecret?.trim()) {
    const key = data.tiktokClientKey?.trim() ?? "";
    const secret = data.tiktokClientSecret?.trim() ?? "";
    if (secretState(key) !== "ready" || secretState(secret) !== "ready") {
      throw new Error("TikTok necesita client key y client secret reales, los dos juntos.");
    }
    await sql`
      update agency_settings
      set tiktok_client_key = ${key}, tiktok_client_secret = ${secret}, updated_at = now()
      where id = 1
    `;
  }
  invalidateIntegrations();
  await audit(sql, admin.userId, "integrations.save", "agency_settings", "1", {
    youtube: Boolean(data.youtubeApiKey || data.clearYoutube),
    tiktok: Boolean(data.tiktokClientKey || data.clearTiktok),
  });
  return { ok: true };
};

