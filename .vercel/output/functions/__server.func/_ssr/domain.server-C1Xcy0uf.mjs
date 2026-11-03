import { c as amountToCents, d as parseMoneyInput, f as rateScale, l as centsToAmount, o as TERMS_VERSION, u as earningAmount } from "./labels-nxp7TcxZ.mjs";
import { i as getSql, t as dbSource } from "./db-Bq2RenG3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/domain.server-C1Xcy0uf.js
var YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
function hostOf(url) {
	return url.hostname.replace(/^www\./, "").toLowerCase();
}
function parseClipUrl(raw) {
	const trimmed = raw.trim();
	let url;
	try {
		url = new URL(trimmed);
	} catch {
		return {
			ok: false,
			error: "El enlace no es una URL válida."
		};
	}
	if (url.protocol !== "https:" && url.protocol !== "http:") return {
		ok: false,
		error: "Solo se aceptan enlaces http o https."
	};
	const host = hostOf(url);
	if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) return parseYoutube(url, host);
	if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
		const match = url.pathname.match(/\/video\/(\d{8,22})/);
		const shortLink = host.startsWith("vm.") || host.startsWith("vt.") || /^\/t\/[^/]+/.test(url.pathname);
		return {
			ok: true,
			provider: "tiktok",
			videoId: match?.[1] ?? null,
			shortLink,
			normalized: url.toString()
		};
	}
	return {
		ok: false,
		error: "Solo se aceptan enlaces de TikTok o YouTube."
	};
}
function parseYoutube(url, host) {
	let videoId = "";
	let shortsPath = false;
	if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
	else if (url.pathname.startsWith("/shorts/")) {
		shortsPath = true;
		videoId = url.pathname.split("/")[2] ?? "";
	} else if (url.pathname.startsWith("/embed/")) videoId = url.pathname.split("/")[2] ?? "";
	else if (url.pathname.startsWith("/live/")) return {
		ok: false,
		error: "Los enlaces de YouTube Live no se registran como clips."
	};
	else videoId = url.searchParams.get("v") ?? "";
	videoId = videoId.slice(0, 11);
	if (!YOUTUBE_ID.test(videoId)) return {
		ok: false,
		error: "No se identificó un video de YouTube en ese enlace."
	};
	const normalized = shortsPath ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`;
	return {
		ok: true,
		provider: "youtube",
		videoId,
		shortsPath,
		normalized
	};
}
function parseIsoDuration(iso) {
	const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
	if (!match) return null;
	if (!match[1] && !match[2] && !match[3]) return null;
	return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}
/** Shorts URL is authoritative. Over 3 minutes cannot be a Short. Otherwise unknown. */
function classifyYoutube(input) {
	if (input.durationSeconds != null && input.durationSeconds > 180) return "youtube_video";
	if (input.shortsPath) return "youtube_shorts";
	return "unknown";
}
var CLIP_FROM = `
  from clips c
  join profiles p on p.user_id = c.user_id
`;
var CLIP_FIELDS = `
  c.id, c.user_id, p.display_name as owner_name, c.provider, c.platform_id,
  c.declared_platform, c.classification, c.external_id, c.url, c.title, c.description,
  c.channel_name, c.published_on::text as published_on, c.duration_seconds, c.status,
  c.availability, c.stats_source, c.stats_verified, c.public_views, c.valid_views,
  c.billed_views, c.views_locked, c.likes, c.comments, c.shares, c.flags,
  to_char(c.stats_updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as stats_updated_at,
  c.stats_error, c.rejection_reason,
  to_char(c.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
  coalesce((select sum(e.amount) from earnings e where e.clip_id = c.id), 0)::text as earning
`;
var buckets = /* @__PURE__ */ new Map();
function limited(key, max, windowMs) {
	const now = Date.now();
	const recent = (buckets.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
	if (recent.length >= max) return false;
	recent.push(now);
	buckets.set(key, recent);
	return true;
}
function flagsOf(value) {
	if (Array.isArray(value)) return value.map(String);
	if (typeof value === "string") try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
	return [];
}
function withFlag(flags, flag) {
	return flags.includes(flag) ? flags : [...flags, flag];
}
function mapClip(row) {
	return {
		id: Number(row.id),
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
		earning: row.earning,
		createdAt: row.created_at
	};
}
function mapProfile(row) {
	return {
		userId: row.user_id,
		email: row.email,
		displayName: row.display_name,
		avatarUrl: row.avatar_url,
		role: row.role,
		status: row.status,
		phone: row.phone,
		agencyName: row.agency_name,
		termsVersion: row.terms_version
	};
}
async function profileByUser(sql, userId) {
	const rows = await sql`
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
async function requireProfile(sql, userId) {
	const profile = await profileByUser(sql, userId);
	if (!profile) throw new Error("Completa tu registro en CLIPRD.");
	if (profile.status === "suspended") throw new Error("Tu cuenta está suspendida.");
	if (profile.status === "inactive") throw new Error("Tu cuenta está inactiva.");
	return profile;
}
async function requireAdmin(sql, userId) {
	const profile = await requireProfile(sql, userId);
	if (profile.role !== "admin") throw new Error("No tienes permiso de administrador.");
	return profile;
}
function assertActive(profile) {
	if (profile.status !== "active") throw new Error("Tu cuenta todavía no está activa.");
}
async function notify(sql, userId, kind, title, body, href) {
	await sql`
    insert into notifications (user_id, kind, title, body, href)
    values (${userId}, ${kind}, ${title}, ${body}, ${href})
  `;
}
async function notifyAdmins(sql, kind, title, body, href) {
	await sql`
    insert into notifications (user_id, kind, title, body, href)
    select user_id, ${kind}, ${title}, ${body}, ${href}
    from profiles
    where role = 'admin' and status = 'active'
  `;
}
async function audit(sql, actorId, action, entity, entityId, detail) {
	await sql`
    insert into audit_logs (actor_id, action, entity, entity_id, detail)
    values (${actorId}, ${action}, ${entity}, ${entityId}, ${JSON.stringify(detail)}::jsonb)
  `;
}
async function balanceOf(sql, userId) {
	const rows = await sql`
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
		available: centsToAmount(amountToCents(earned) - amountToCents(committed))
	};
}
async function activeRate(sql, platformId) {
	const rows = await sql`
    select amount_per_mille::text as amount
    from rates
    where platform_id = ${platformId} and active = true
    order by effective_from desc
    limit 1
  `;
	if (!rows[0]) throw new Error("No hay una tarifa activa para esta plataforma.");
	return rows[0].amount;
}
async function writeHistory(sql, clipId, source, note, actorId) {
	await sql`
    insert into clip_statistics (clip_id, public_views, valid_views, likes, comments, shares, source, note, recorded_by)
    select id, public_views, valid_views, likes, comments, shares, ${source}, ${note}, ${actorId}
    from clips where id = ${clipId}
  `;
}
async function accrue(sql, input) {
	if (!Number.isInteger(input.newValid) || input.newValid < 0) throw new Error("Las vistas válidas deben ser un entero positivo o cero.");
	const clip = (await sql`
    select billed_views, platform_id, classification, user_id
    from clips where id = ${input.clipId}
  `)[0];
	if (!clip) throw new Error("Publicación no encontrada.");
	const billed = Number(clip.billed_views);
	const delta = input.newValid - billed;
	if (delta !== 0 && clip.classification !== "confirmed") throw new Error("Confirma si es Short o video antes de liquidar vistas.");
	const rate = delta === 0 ? "0.0000" : await activeRate(sql, clip.platform_id);
	const amount = delta === 0 ? "0.00" : earningAmount(delta, rate);
	const updated = await sql`
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
	if (!updated[0] || Number(updated[0].updated) !== 1) throw new Error("La publicación cambió durante el cálculo. Vuelve a intentarlo.");
	await writeHistory(sql, input.clipId, input.source, input.note, input.actorId);
	if (delta !== 0) await notify(sql, clip.user_id, "views", "Vistas actualizadas", `Se registraron ${delta > 0 ? "+" : ""}${delta.toLocaleString("es-DO")} vistas válidas. Ganancia de este movimiento: US$${amount}.`, "/clipper/earnings");
}
async function youtubeList(sql, ids) {
	const key = process.env.YOUTUBE_API_KEY;
	if (!key) return { error: "YOUTUBE_API_KEY no está configurada en el servidor." };
	const quota = await sql`
    select case when youtube_quota_day = current_date then youtube_quota_used else 0 end as used
    from agency_settings where id = 1
  `;
	if (Number(quota[0]?.used ?? 0) >= 9500) return { error: "La cuota diaria de YouTube está reservada. La sincronización se detuvo." };
	const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
	endpoint.searchParams.set("part", "snippet,contentDetails,statistics,status");
	endpoint.searchParams.set("id", ids.join(","));
	endpoint.searchParams.set("key", key);
	const response = await fetch(endpoint, { signal: AbortSignal.timeout(12e3) });
	await sql`
    update agency_settings
    set youtube_quota_used = case when youtube_quota_day = current_date then youtube_quota_used + 1 else 1 end,
        youtube_quota_day = current_date,
        updated_at = now()
    where id = 1
  `;
	if (!response.ok) return { error: (await response.json().catch(() => null))?.error?.message ?? `YouTube respondió ${response.status}.` };
	return { items: (await response.json()).items ?? [] };
}
async function applyYoutubeItem(sql, clip, item, actorId) {
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
		return {
			ok: false,
			message: "YouTube no devolvió el video."
		};
	}
	const privacy = item.status?.privacyStatus ?? "unknown";
	const availability = privacy === "public" || privacy === "unlisted" || privacy === "private" ? privacy : "unknown";
	const duration = item.contentDetails?.duration ? parseIsoDuration(item.contentDetails.duration) : null;
	const detected = classifyYoutube({
		shortsPath: clip.url.includes("/shorts/"),
		durationSeconds: duration
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
	const dropped = clip.publicViews >= 1e3 && publicViews < clip.publicViews * .4;
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
	const canAccrue = !clip.viewsLocked && !spike && !dropped && availability === "public" && classification === "confirmed" && (clip.status === "approved" || clip.status === "settled") && publicViews > clip.billedViews;
	if (canAccrue) await accrue(sql, {
		clipId: clip.id,
		newValid: publicViews,
		actorId,
		kind: "accrual",
		note: "Sincronización YouTube Data API. Solo se liquidó el aumento.",
		source: "youtube_api",
		lock: false,
		status: null
	});
	else await writeHistory(sql, clip.id, "youtube_api", spike ? "Salto sospechoso" : "Observación", actorId);
	if (spike) await notifyAdmins(sql, "fraud", "Reproducciones sospechosas", `${clip.title} multiplicó sus vistas. Revisa antes de liquidar.`, "/admin/clips");
	return {
		ok: true,
		message: canAccrue ? "Estadísticas verificadas y diferencia liquidada." : "Estadísticas públicas actualizadas."
	};
}
async function loadClip(sql, id) {
	const found = await sql.query(`select ${CLIP_FIELDS} ${CLIP_FROM} where c.id = $1`, [id]);
	return found[0] ? mapClip(found[0]) : null;
}
async function runScheduledSync() {
	const sql = await getSql();
	const interval = await sql`
    select sync_interval_minutes as minutes from agency_settings where id = 1
  `;
	const minutes = Number(interval[0]?.minutes ?? 360);
	return syncRows(sql, (await sql.query(`select ${CLIP_FIELDS} ${CLIP_FROM}
     where c.provider = 'youtube'
       and c.status in ('pending','in_review','verified','approved','settled')
       and c.availability <> 'deleted'
       and (c.stats_updated_at is null or c.stats_updated_at < now() - ($1 || ' minutes')::interval)
     order by c.stats_updated_at nulls first
     limit 25`, [String(minutes)])).map(mapClip), "cron");
}
async function syncRows(sql, clips, actorId) {
	const errors = [];
	if (!process.env.YOUTUBE_API_KEY) return {
		synced: 0,
		errors: ["YOUTUBE_API_KEY no está configurada. No se inventaron estadísticas."]
	};
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
			const applied = await applyYoutubeItem(sql, clip, result.items.find((entry) => entry.id === clip.externalId), actorId);
			if (!applied.ok) errors.push(`${clip.title}: ${applied.message}`);
			synced += 1;
		}
	}
	return {
		synced,
		errors
	};
}
function inviteCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const bytes = /* @__PURE__ */ new Uint8Array(6);
	crypto.getRandomValues(bytes);
	return `CLIP-${Array.from(bytes, (byte) => alphabet[byte % 32]).join("")}`;
}
async function digest(value) {
	const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return Array.from(new Uint8Array(hash).slice(0, 10), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
var getPublicHome = async () => {
	const sql = await getSql();
	const settings = await sql`
    select agency_name, slogan, currency from agency_settings where id = 1
  `;
	const rates = await sql`
    select distinct on (p.id) p.id, p.label, r.amount_per_mille::text as amount
    from platforms p
    left join rates r on r.platform_id = p.id and r.active = true
    order by p.id, r.effective_from desc nulls last
  `;
	return {
		agencyName: settings[0]?.agency_name ?? "Origen Simple",
		slogan: settings[0]?.slogan ?? "CONVIERTE VISUALIZACIONES EN DINERO.",
		currency: settings[0]?.currency ?? "USD",
		rates: rates.map((rate) => ({
			id: rate.id,
			label: rate.label,
			amount: rate.amount ?? "0.0000"
		}))
	};
};
var getMyProfile = async ({ context }) => {
	return profileByUser(await getSql(), context.userId);
};
var bootstrapProfile = async ({ context, data }) => {
	if (!data.acceptTerms) throw new Error("Debes aceptar las condiciones de participación.");
	const sql = await getSql();
	const existing = await profileByUser(sql, context.userId);
	if (existing) return existing;
	const admins = await sql`
      select count(*)::int as total from profiles where role = 'admin'
    `;
	const first = Number(admins[0]?.total ?? 0) === 0;
	let status = first ? "active" : "pending";
	const role = first ? "admin" : "clipper";
	const code = data.inviteCode?.trim().toUpperCase();
	if (!first && code) {
		if (!(await sql`
        update invites
        set used_by = ${context.userId}, used_at = now()
        where code = ${code} and used_by is null and expires_at > now()
        returning code
      `)[0]) throw new Error("La invitación no es válida o ya se usó.");
		status = "active";
	}
	const image = await sql`
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
	await audit(sql, context.userId, "profile.create", "profile", context.userId, {
		role,
		status
	});
	if (!first) await notifyAdmins(sql, "clipper", "Nuevo clipper", `${data.displayName.trim()} se registró y está ${status === "active" ? "activo" : "pendiente de aprobación"}.`, "/admin/clippers");
	const created = await profileByUser(sql, context.userId);
	if (!created) throw new Error("No se pudo crear el perfil.");
	return created;
};
var updateMyProfile = async ({ context, data }) => {
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
var getNotifications = async ({ context }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	return await sql`
      select id, kind, title, body, href,
             to_char(read_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as read_at,
             to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from notifications
      where user_id = ${context.userId}
      order by id desc
      limit 40
    `;
};
var markNotificationsRead = async ({ context }) => {
	await (await getSql())`
      update notifications set read_at = now()
      where user_id = ${context.userId} and read_at is null
    `;
	return { ok: true };
};
var getRanking = async ({ context, data }) => {
	const sql = await getSql();
	await requireProfile(sql, context.userId);
	const from = data.period === "weekly" ? "now() - interval '7 days'" : data.period === "monthly" ? "now() - interval '30 days'" : "timestamp '1970-01-01'";
	return {
		ranking: (await sql.query(`select p.user_id, p.display_name, p.avatar_url,
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
       limit 100`, [data.platform])).map((row, index) => ({
			place: index + 1,
			userId: row.user_id,
			displayName: row.display_name,
			avatarUrl: row.avatar_url,
			views: Number(row.views),
			posts: Number(row.posts),
			earnings: row.earnings,
			bestPlatform: row.best_platform
		})),
		prizes: await sql`
      select id, scope, place, title, amount::text as amount, active
      from ranking_prizes
      order by scope, place
    `
	};
};
var registerClip = async ({ context, data }) => {
	const sql = await getSql();
	const profile = await requireProfile(sql, context.userId);
	if (profile.role !== "clipper") throw new Error("Las publicaciones las registran los clippers.");
	assertActive(profile);
	if (!limited(`clip:${context.userId}`, 20, 36e5)) throw new Error("Demasiados registros en una hora. Espera un momento.");
	let parsed = parseClipUrl(data.url);
	if (!parsed.ok) throw new Error(parsed.error);
	if (parsed.provider === "tiktok" && data.declared !== "tiktok") throw new Error("Ese enlace es de TikTok, no de YouTube.");
	if (parsed.provider === "youtube" && data.declared === "tiktok") throw new Error("Ese enlace es de YouTube, no de TikTok.");
	if (parsed.provider === "tiktok" && (parsed.shortLink || !parsed.videoId)) {
		const resolved = parseClipUrl(await resolveFinal(parsed.normalized));
		if (resolved.ok && resolved.provider === "tiktok") parsed = resolved;
	}
	if (!parsed.ok) throw new Error("No se pudo leer el enlace.");
	let externalId = parsed.provider === "youtube" ? parsed.videoId : parsed.videoId;
	if (!externalId) externalId = `url:${await digest(parsed.normalized)}`;
	if ((await sql`
      select id from clips where provider = ${parsed.provider} and external_id = ${externalId}
    `)[0]) throw new Error("Ese video ya está registrado en CLIPRD.");
	let title = data.title?.trim() || "";
	let channel = null;
	let duration = null;
	let publicViews = 0;
	let likes = null;
	let comments = null;
	let availability = "unknown";
	let statsSource = "none";
	let statsVerified = false;
	let statsError = null;
	const warnings = [];
	let classification = parsed.provider === "tiktok" ? "confirmed" : "unconfirmed";
	let platformId = data.declared;
	if (parsed.provider === "youtube") {
		if (classifyYoutube({
			shortsPath: parsed.shortsPath,
			durationSeconds: null
		}) === "youtube_shorts") {
			classification = "confirmed";
			platformId = "youtube_shorts";
			if (data.declared === "youtube_video") {
				classification = "conflict";
				warnings.push("El enlace es un Short. Quedó en revisión.");
			}
		}
		const api = await youtubeList(sql, [parsed.videoId]);
		if ("error" in api) {
			statsError = api.error;
			warnings.push("Sin YouTube Data API no hay reproducciones verificadas. El clip queda pendiente.");
			const embed = await oembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(parsed.normalized)}`);
			if (embed?.title) title = title || embed.title;
			if (embed?.author_name) channel = embed.author_name;
			if (embed) statsSource = "oembed";
		} else {
			const item = api.items[0];
			if (!item) {
				availability = "deleted";
				statsError = "YouTube no devolvió el video.";
				warnings.push("YouTube no encontró el video. Un administrador debe revisarlo.");
			} else {
				duration = item.contentDetails?.duration ? parseIsoDuration(item.contentDetails.duration) : null;
				const kind = classifyYoutube({
					shortsPath: parsed.shortsPath,
					durationSeconds: duration
				});
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
		const embed = await oembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(parsed.normalized)}`);
		if (embed?.title) title = title || embed.title;
		if (embed?.author_name) channel = embed.author_name;
		if (embed) statsSource = "oembed";
		statsError = "TikTok no entregó reproducciones. oEmbed solo confirma título y autor, no vistas.";
		warnings.push("Las reproducciones de TikTok no están verificadas. No se suman como vistas válidas.");
		if (!parsed.videoId) warnings.push("No se pudo resolver el ID del video. Se guardó una huella del enlace.");
	}
	if (!title) title = "Clip sin título";
	const status = classification === "confirmed" ? "pending" : "in_review";
	const inserted = await sql`
      insert into clips (
        user_id, provider, platform_id, declared_platform, classification, external_id, url,
        title, description, channel_name, published_on, duration_seconds, status, availability,
        stats_source, stats_verified, public_views, likes, comments, stats_error, stats_updated_at
      ) values (
        ${context.userId}, ${parsed.provider}, ${platformId}, ${data.declared}, ${classification},
        ${externalId}, ${parsed.normalized}, ${title}, ${data.description?.trim() ?? ""}, ${channel},
        ${data.publishedOn}, ${duration}, ${status}, ${availability}, ${statsSource}, ${statsVerified},
        ${publicViews}, ${likes}, ${comments}, ${statsError}, now()
      )
      returning id
    `;
	const id = Number(inserted[0]?.id);
	await writeHistory(sql, id, statsSource, "Registro inicial", context.userId);
	await audit(sql, context.userId, "clip.register", "clip", String(id), {
		provider: parsed.provider,
		externalId,
		statsSource,
		statsVerified
	});
	await notifyAdmins(sql, "clip", "Nueva publicación", `${profile.displayName} registró «${title}».`, "/admin/clips");
	await notify(sql, context.userId, "clip", "Clip registrado", `«${title}» quedó ${status === "pending" ? "pendiente" : "en revisión"}.`, "/clipper/my-clips");
	return {
		id,
		warnings,
		statsVerified,
		statsSource
	};
};
async function resolveFinal(url) {
	try {
		return (await fetch(url, {
			redirect: "follow",
			signal: AbortSignal.timeout(8e3),
			headers: { "user-agent": "CLIPRD/1.0" }
		})).url || url;
	} catch {
		return url;
	}
}
async function oembed(url) {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(8e3) });
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}
var getMyClips = async ({ context }) => {
	const sql = await getSql();
	const profile = await requireProfile(sql, context.userId);
	return (await sql.query(`select ${CLIP_FIELDS} ${CLIP_FROM} where c.user_id = $1 order by c.id desc limit 200`, [profile.userId])).map(mapClip);
};
var getClipDetail = async ({ context, data }) => {
	const sql = await getSql();
	const profile = await requireProfile(sql, context.userId);
	const clip = await loadClip(sql, data.id);
	if (!clip) throw new Error("Publicación no encontrada.");
	if (profile.role !== "admin" && clip.userId !== profile.userId) throw new Error("No tienes acceso a esta publicación.");
	const history = await sql`
      select to_char(recorded_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as recorded_at,
             public_views, valid_views, source, note
      from clip_statistics
      where clip_id = ${clip.id}
      order by id desc
      limit 40
    `;
	const earnings = await sql`
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
			note: row.note
		})),
		earnings: earnings.map((row) => ({
			at: row.created_at,
			delta: Number(row.views_delta),
			rate: row.rate_per_mille,
			amount: row.amount,
			kind: row.kind,
			note: row.note
		}))
	};
};
var getClipperDashboard = async ({ context }) => {
	const sql = await getSql();
	const profile = await requireProfile(sql, context.userId);
	if (profile.role !== "clipper") throw new Error("Este panel es de clippers.");
	const balance = await balanceOf(sql, profile.userId);
	const views = await sql`
      select coalesce(sum(valid_views), 0)::int as views,
             count(*) filter (where status in ('approved','settled'))::int as posts
      from clips where user_id = ${profile.userId}
    `;
	const byPlatform = await sql`
      select platform_id, coalesce(sum(amount), 0)::text as amount, coalesce(sum(views_delta), 0)::int as views
      from earnings
      where user_id = ${profile.userId} and platform_id is not null
      group by platform_id
    `;
	const series = await sql`
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
	const received = await sql`
      select coalesce(sum(amount), 0)::text as total from payments where user_id = ${profile.userId}
    `;
	return {
		profile,
		balance,
		views: Number(views[0]?.views ?? 0),
		posts: Number(views[0]?.posts ?? 0),
		received: received[0]?.total ?? "0.00",
		byPlatform,
		series
	};
};
var savePayoutAccount = async ({ context, data }) => {
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
		accountType: data.accountType
	});
	return { ok: true };
};
var requestPayout = async ({ context, data }) => {
	const sql = await getSql();
	const profile = await requireProfile(sql, context.userId);
	if (profile.role !== "clipper") throw new Error("Solo un clipper solicita retiros.");
	assertActive(profile);
	const amount = parseMoneyInput(data.amount);
	const cents = amountToCents(amount);
	if (cents <= 0) throw new Error("El monto debe ser mayor que cero.");
	const settings = await sql`select min_payout::text as min_payout from agency_settings where id = 1`;
	const minimum = amountToCents(settings[0]?.min_payout ?? "10.00");
	if (cents < minimum) throw new Error(`El mínimo de retiro es US$${(minimum / 100).toFixed(2)}.`);
	if (!(await sql`select id from payout_accounts where user_id = ${profile.userId}`)[0]) throw new Error("Registra tu cuenta del Banco Popular u otro banco antes de retirar.");
	const balance = await balanceOf(sql, profile.userId);
	if (cents > amountToCents(balance.available)) throw new Error("El monto supera tu balance disponible.");
	const inserted = await sql`
      insert into payout_requests (user_id, amount, note)
      values (${profile.userId}, ${amount}::numeric, ${data.note?.trim() || null})
      returning id
    `;
	await notifyAdmins(sql, "payout", "Solicitud de pago", `${profile.displayName} solicitó US$${amount}.`, "/admin/payments");
	await notify(sql, profile.userId, "payout", "Solicitud enviada", `Tu retiro de US$${amount} está pendiente. No es una transferencia automática.`, "/clipper/payments");
	await audit(sql, profile.userId, "payout.request", "payout_request", String(inserted[0]?.id), { amount });
	return { id: inserted[0]?.id };
};
var getMyPayments = async ({ context }) => {
	const sql = await getSql();
	const profile = await requireProfile(sql, context.userId);
	const balance = await balanceOf(sql, profile.userId);
	const account = await sql`
      select holder_name, bank_name, account_type, account_number
      from payout_accounts where user_id = ${profile.userId}
    `;
	const requests = await sql`
      select r.id, r.amount::text as amount, r.status, r.note, r.admin_note, r.rejection_reason,
             to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             pay.reference, pay.receipt_url,
             to_char(pay.paid_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as paid_at
      from payout_requests r
      left join payments pay on pay.request_id = r.id
      where r.user_id = ${profile.userId}
      order by r.id desc
    `;
	const ledger = await sql`
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
	return {
		balance,
		minimum: (await sql`select min_payout::text as min_payout from agency_settings where id = 1`)[0]?.min_payout ?? "10.00",
		account: account[0] ? {
			holderName: account[0].holder_name,
			bankName: account[0].bank_name,
			accountType: account[0].account_type,
			accountNumber: account[0].account_number
		} : null,
		requests,
		ledger
	};
};
async function series(sql, unit, points, platform, to) {
	const step = unit === "day" ? "1 day" : unit === "week" ? "1 week" : "1 month";
	const lookback = unit === "day" ? `${points - 1} days` : unit === "week" ? `${points - 1} weeks` : `${points - 1} months`;
	return sql.query(`select to_char(bucket, 'YYYY-MM-DD') as bucket,
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
     order by bucket`, [platform, to]);
}
var getAdminDashboard = async ({ context, data }) => {
	const sql = await getSql();
	await requireAdmin(sql, context.userId);
	const platform = data.platform ?? "all";
	const from = data.from ?? "1970-01-01";
	const to = data.to ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const card = (await sql.query(`select
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
         (select coalesce(sum(amount),0)::text from payout_requests where status in ('pending','approved','processing')) as pending_pay`, [
		platform,
		from,
		to
	]))[0];
	const earnedCents = amountToCents(card?.earned ?? "0");
	const paidCents = amountToCents(card?.paid ?? "0");
	const platforms = await sql.query(`select p.id as platform_id,
              coalesce(sum(c.valid_views) filter (where c.status in ('approved','settled')), 0)::int as views,
              coalesce((select sum(e.amount) from earnings e where e.platform_id = p.id and e.created_at >= $2::date and e.created_at < ($3::date + interval '1 day')), 0)::text as amount,
              count(c.id) filter (where c.status in ('approved','settled'))::int as posts
       from platforms p
       left join clips c on c.platform_id = p.id
       where $1 = 'all' or p.id = $1
       group by p.id
       order by p.id`, [
		platform,
		from,
		to
	]);
	const [daily, weekly, monthly] = await Promise.all([
		series(sql, "day", 14, platform, to),
		series(sql, "week", 8, platform, to),
		series(sql, "month", 6, platform, to)
	]);
	const leaders = await sql.query(`select p.display_name,
              coalesce(sum(e.amount), 0)::text as amount,
              coalesce(sum(e.views_delta), 0)::int as views
       from profiles p
       left join earnings e on e.user_id = p.user_id
         and e.created_at >= $2::date and e.created_at < ($3::date + interval '1 day')
         and ($1 = 'all' or e.platform_id = $1)
       where p.role = 'clipper'
       group by p.user_id, p.display_name
       order by sum(e.amount) desc nulls last
       limit 8`, [
		platform,
		from,
		to
	]);
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
			outstanding: centsToAmount(earnedCents - paidCents)
		},
		platforms,
		daily,
		weekly,
		monthly,
		leaders
	};
};
var listClippers = async ({ context }) => {
	const sql = await getSql();
	await requireAdmin(sql, context.userId);
	return sql`
      select p.user_id, p.display_name, u.email, p.avatar_url, p.status, p.phone,
             to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             coalesce((select sum(valid_views) from clips c where c.user_id = p.user_id and c.status in ('approved','settled')), 0)::int as views,
             (select count(*)::int from clips c where c.user_id = p.user_id) as posts,
             coalesce((select sum(amount) from earnings e where e.user_id = p.user_id), 0)::text as earned
      from profiles p
      join "user" u on u.id = p.user_id
      where p.role = 'clipper'
      order by p.created_at desc
    `;
};
var updateClipper = async ({ context, data }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	if (data.remove) {
		const money = await sql`
        select (
          (select count(*) from earnings where user_id = ${data.userId}) +
          (select count(*) from payout_requests where user_id = ${data.userId})
        )::int as total
      `;
		if (Number(money[0]?.total ?? 0) > 0) throw new Error("No se elimina: hay historial financiero. Suspéndelo para conservar el registro.");
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
	await audit(sql, admin.userId, "clipper.update", "profile", data.userId, { status: data.status ?? null });
	if (data.status) await notify(sql, data.userId, "account", "Estado de tu cuenta", `Tu cuenta quedó ${data.status}.`, "/clipper/dashboard");
	return { ok: true };
};
var createInvite = async ({ context }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	for (let attempt = 0; attempt < 4; attempt += 1) {
		const code = inviteCode();
		if ((await sql`
        insert into invites (code, created_by, expires_at)
        values (${code}, ${admin.userId}, now() + interval '7 days')
        on conflict (code) do nothing
        returning code
      `)[0]) return {
			code,
			expiresInDays: 7
		};
	}
	throw new Error("No se pudo generar la invitación.");
};
var listInvites = async ({ context }) => {
	const sql = await getSql();
	await requireAdmin(sql, context.userId);
	return sql`
      select code,
             to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as expires_at,
             used_by,
             to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from invites
      order by created_at desc
      limit 30
    `;
};
var listClips = async ({ context, data }) => {
	const sql = await getSql();
	await requireAdmin(sql, context.userId);
	return (await sql.query(`select ${CLIP_FIELDS} ${CLIP_FROM}
       where ($1 = '' or c.status = $1)
         and ($2 = '' or c.platform_id = $2)
         and ($3 = '' or c.title ilike '%' || $3 || '%' or c.external_id ilike '%' || $3 || '%' or p.display_name ilike '%' || $3 || '%')
       order by c.id desc
       limit 50 offset $4`, [
		data.status ?? "",
		data.platform ?? "",
		data.q ?? "",
		data.offset ?? 0
	])).map(mapClip);
};
var reviewClip = async ({ context, data }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	const clip = await loadClip(sql, data.clipId);
	if (!clip) throw new Error("Publicación no encontrada.");
	if (data.action === "reject") {
		if ((data.reason ?? "").trim().length < 8) throw new Error("Explica el rechazo en al menos 8 caracteres.");
		if (clip.billedViews > 0) throw new Error("Esta publicación ya tiene ganancias. Ajusta las vistas antes de rechazarla.");
		await sql`
        update clips set status = 'rejected', rejection_reason = ${data.reason.trim()}, updated_at = now()
        where id = ${clip.id}
      `;
		await notify(sql, clip.userId, "clip", "Clip rechazado", data.reason.trim(), "/clipper/my-clips");
	} else if (data.action === "suspend") {
		await sql`update clips set status = 'suspended', updated_at = now() where id = ${clip.id}`;
		await notify(sql, clip.userId, "clip", "Clip suspendido", clip.title, "/clipper/my-clips");
	} else if (data.action === "review") await sql`update clips set status = 'in_review', updated_at = now() where id = ${clip.id}`;
	else if (data.action === "verified") await sql`update clips set status = 'verified', updated_at = now() where id = ${clip.id}`;
	else if (data.action === "settle") {
		if (clip.status !== "approved") throw new Error("Solo se liquida una publicación aprobada.");
		await sql`update clips set status = 'settled', updated_at = now() where id = ${clip.id}`;
	} else {
		if (clip.classification !== "confirmed") throw new Error("Confirma si es Short o video antes de aprobar.");
		const requested = data.validViews ?? (clip.statsVerified ? clip.publicViews : 0);
		const manual = requested !== clip.publicViews || !clip.statsVerified;
		if (manual && (data.justification ?? "").trim().length < 12) throw new Error("Si las vistas no vienen verificadas por la API, justifica el ajuste (mínimo 12 caracteres).");
		await accrue(sql, {
			clipId: clip.id,
			newValid: requested,
			actorId: admin.userId,
			kind: manual ? "adjustment" : "accrual",
			note: manual ? data.justification.trim() : "Aprobación con estadísticas de la API.",
			source: manual ? "admin_adjustment" : clip.statsSource,
			lock: manual,
			status: "approved"
		});
		if (manual) await sql`
          update clips set stats_verified = false, stats_source = 'admin_adjustment'
          where id = ${clip.id}
        `;
		await notify(sql, clip.userId, "clip", "Clip aprobado", `«${clip.title}» fue aprobado.`, "/clipper/my-clips");
	}
	await audit(sql, admin.userId, `clip.${data.action}`, "clip", String(clip.id), {
		validViews: data.validViews ?? null,
		reason: data.reason ?? data.justification ?? null
	});
	return { ok: true };
};
var classifyClip = async ({ context, data }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	const clip = await loadClip(sql, data.clipId);
	if (!clip || clip.provider !== "youtube") throw new Error("Solo YouTube necesita esta clasificación.");
	if (data.platformId === "youtube_shorts" && clip.durationSeconds != null && clip.durationSeconds > 180) throw new Error("Un video de más de 3 minutos no puede clasificarse como Short.");
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
var adjustViews = async ({ context, data }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	const clip = await loadClip(sql, data.clipId);
	if (!clip) throw new Error("Publicación no encontrada.");
	if (clip.status !== "approved" && clip.status !== "settled") throw new Error("Aprueba la publicación antes de ajustar vistas válidas.");
	await accrue(sql, {
		clipId: clip.id,
		newValid: data.validViews,
		actorId: admin.userId,
		kind: "adjustment",
		note: data.justification,
		source: "admin_adjustment",
		lock: true,
		status: null
	});
	await sql`
      update clips set stats_verified = false, stats_source = 'admin_adjustment', updated_at = now()
      where id = ${clip.id}
    `;
	await audit(sql, admin.userId, "clip.adjust", "clip", String(clip.id), {
		validViews: data.validViews,
		justification: data.justification
	});
	return { ok: true };
};
var syncClip = async ({ context, data }) => {
	const sql = await getSql();
	const profile = await requireProfile(sql, context.userId);
	const clip = await loadClip(sql, data.clipId);
	if (!clip) throw new Error("Publicación no encontrada.");
	if (profile.role !== "admin" && clip.userId !== profile.userId) throw new Error("No tienes acceso.");
	if (clip.provider !== "youtube") return {
		ok: false,
		message: "TikTok no tiene una fuente oficial de vistas conectada. El enlace sigue guardado, pero las reproducciones no se marcan como verificadas."
	};
	const result = await syncRows(sql, [clip], profile.userId);
	return {
		ok: result.errors.length === 0,
		message: result.errors[0] ?? "Sincronización hecha.",
		synced: result.synced
	};
};
var syncYoutubeBatch = async ({ context }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	const result = await syncRows(sql, (await sql.query(`select ${CLIP_FIELDS} ${CLIP_FROM}
       where c.provider = 'youtube' and c.availability <> 'deleted'
         and c.status in ('pending','in_review','verified','approved','settled')
       order by c.stats_updated_at nulls first
       limit 25`)).map(mapClip), admin.userId);
	await audit(sql, admin.userId, "youtube.sync", "integration", "youtube", result);
	return result;
};
var listPayouts = async ({ context }) => {
	const sql = await getSql();
	await requireAdmin(sql, context.userId);
	return sql`
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
var decidePayout = async ({ context, data }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	if (data.action === "rejected" && (data.reason ?? "").trim().length < 8) throw new Error("Explica el rechazo.");
	const request = (await sql`
      select user_id, status from payout_requests where id = ${data.id}
    `)[0];
	if (!request) throw new Error("Solicitud no encontrada.");
	if (request.status === "paid") throw new Error("Ese pago ya está completado.");
	await sql`
      update payout_requests
      set status = ${data.action},
          rejection_reason = ${data.action === "rejected" ? data.reason.trim() : null},
          updated_at = now()
      where id = ${data.id}
    `;
	await notify(sql, request.user_id, "payout", "Actualización de tu retiro", data.action === "rejected" ? data.reason.trim() : `Tu solicitud pasó a ${data.action}.`, "/clipper/payments");
	await audit(sql, admin.userId, "payout.decide", "payout_request", String(data.id), { action: data.action });
	return { ok: true };
};
var recordPayment = async ({ context, data }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	const receipt = data.receiptUrl?.trim() || null;
	if (receipt && !/^https:\/\//.test(receipt)) throw new Error("El comprobante debe ser un enlace https.");
	const request = (await sql`
      select user_id, amount::text as amount, status from payout_requests where id = ${data.id}
    `)[0];
	if (!request) throw new Error("Solicitud no encontrada.");
	if (request.status === "paid" || request.status === "rejected") throw new Error("Esa solicitud ya no admite un pago.");
	await sql`
      update payout_requests
      set status = 'paid', admin_note = ${data.adminNote?.trim() || null}, updated_at = now()
      where id = ${data.id} and status <> 'paid'
    `;
	await sql`
      insert into payments (request_id, user_id, amount, reference, receipt_url, recorded_by)
      values (${data.id}, ${request.user_id}, ${request.amount}::numeric, ${data.reference.trim()}, ${receipt}, ${admin.userId})
    `;
	await notify(sql, request.user_id, "payout", "Transferencia registrada", `Se registró la transferencia manual por US$${request.amount}. Referencia ${data.reference.trim()}. CLIPRD no mueve el dinero: esto documenta el pago que ya hiciste en el banco.`, "/clipper/payments");
	await audit(sql, admin.userId, "payout.record", "payment", String(data.id), { reference: data.reference.trim() });
	return { ok: true };
};
var setRate = async ({ context, data }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	const normalized = data.amount.trim().replace(",", ".");
	if (!/^\d+(\.\d{1,4})?$/.test(normalized)) throw new Error("Tarifa inválida.");
	const scale = rateScale(normalized);
	const amount = `${Math.floor(scale / 1e4)}.${String(scale % 1e4).padStart(4, "0")}`;
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
	return {
		ok: true,
		amount
	};
};
var addBonus = async ({ context, data }) => {
	const sql = await getSql();
	const admin = await requireAdmin(sql, context.userId);
	const amount = parseMoneyInput(data.amount);
	if (amountToCents(amount) === 0) throw new Error("La bonificación no puede ser cero.");
	if (!(await sql`
      select user_id from profiles where user_id = ${data.userId} and role = 'clipper'
    `)[0]) throw new Error("Clipper no encontrado.");
	await sql`
      insert into earnings (user_id, views_delta, rate_per_mille, amount, kind, note, created_by)
      values (${data.userId}, 0, 0, ${amount}::numeric, 'bonus', ${data.note}, ${admin.userId})
    `;
	await notify(sql, data.userId, "bonus", "Bonificación", data.note, "/clipper/earnings");
	await audit(sql, admin.userId, "earning.bonus", "profile", data.userId, { amount });
	return { ok: true };
};
var setPrize = async ({ context, data }) => {
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
		active: data.active
	});
	return { ok: true };
};
var getSettings = async ({ context }) => {
	const sql = await getSql();
	await requireAdmin(sql, context.userId);
	const settings = await sql`
      select agency_name, slogan, currency, sync_interval_minutes, min_payout::text as min_payout,
             youtube_quota_used, youtube_quota_day::text as youtube_quota_day
      from agency_settings where id = 1
    `;
	const rates = await sql`
      select platform_id, amount_per_mille::text as amount,
             to_char(effective_from at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as effective_from,
             note
      from rates
      where active = true
      order by platform_id
    `;
	const integrations = await sql`
      select id, label, status_note from api_integrations order by id
    `;
	return {
		settings: settings[0],
		rates,
		integrations,
		env: {
			youtube: Boolean(process.env.YOUTUBE_API_KEY),
			tiktok: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
			cron: Boolean(process.env.CRON_SECRET),
			database: dbSource === "neon" ? "Neon Postgres" : "Postgres de vista previa"
		}
	};
};
var updateSettings = async ({ context, data }) => {
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
		minPayout
	});
	return { ok: true };
};
var listAudit = async ({ context }) => {
	const sql = await getSql();
	await requireAdmin(sql, context.userId);
	return sql`
      select a.id, a.actor_id, a.action, a.entity, a.entity_id,
             to_char(a.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             p.display_name as actor_name
      from audit_logs a
      left join profiles p on p.user_id = a.actor_id
      order by a.id desc
      limit 80
    `;
};
var getReports = async ({ context, data }) => {
	const sql = await getSql();
	const profile = await requireProfile(sql, context.userId);
	const admin = profile.role === "admin";
	const userFilter = admin ? null : profile.userId;
	if (data.kind === "participants") {
		if (!admin) throw new Error("Ese reporte es de la agencia.");
		return {
			title: "Reproducciones y ganancias por participante",
			columns: [
				"Participante",
				"Vistas liquidadas",
				"Publicaciones aprobadas",
				"Ganancias",
				"Pagos"
			],
			rows: (await sql.query(`select p.display_name as name,
                coalesce(sum(e.views_delta),0)::int as views,
                (select count(*)::int from clips c where c.user_id = p.user_id and c.status in ('approved','settled')) as posts,
                coalesce(sum(e.amount),0)::text as earned,
                coalesce((select sum(amount) from payments pay where pay.user_id = p.user_id and pay.paid_at >= $1::date and pay.paid_at < ($2::date + interval '1 day')),0)::text as paid
         from profiles p
         left join earnings e on e.user_id = p.user_id and e.created_at >= $1::date and e.created_at < ($2::date + interval '1 day')
         where p.role = 'clipper'
         group by p.user_id, p.display_name
         order by sum(e.amount) desc nulls last`, [data.from, data.to])).map((row) => [
				row.name,
				String(row.views),
				String(row.posts),
				row.earned,
				row.paid
			])
		};
	}
	if (data.kind === "platforms") return {
		title: "Ganancias por plataforma",
		columns: [
			"Plataforma",
			"Vistas del movimiento",
			"Monto USD"
		],
		rows: (await sql.query(`select coalesce(platform_id, 'bonificacion') as platform_id,
                coalesce(sum(views_delta),0)::int as views,
                coalesce(sum(amount),0)::text as amount
         from earnings
         where created_at >= $1::date and created_at < ($2::date + interval '1 day')
           and ($3::text is null or user_id = $3)
         group by 1
         order by 1`, [
			data.from,
			data.to,
			userFilter
		])).map((row) => [
			row.platform_id,
			String(row.views),
			row.amount
		])
	};
	if (data.kind === "paid" || data.kind === "pending") {
		const rows = await sql.query(`select p.display_name as name, r.amount::text as amount, r.status,
                to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD') as created_at,
                pay.reference
         from payout_requests r
         join profiles p on p.user_id = r.user_id
         left join payments pay on pay.request_id = r.id
         where r.created_at >= $1::date and r.created_at < ($2::date + interval '1 day')
           and ($3::text is null or r.user_id = $3)
           and ($4 = 'paid' and r.status = 'paid' or $4 = 'pending' and r.status in ('pending','approved','processing'))
         order by r.id desc`, [
			data.from,
			data.to,
			userFilter,
			data.kind
		]);
		return {
			title: data.kind === "paid" ? "Pagos realizados" : "Pagos pendientes",
			columns: [
				"Participante",
				"Monto USD",
				"Estado",
				"Fecha",
				"Referencia"
			],
			rows: rows.map((row) => [
				row.name,
				row.amount,
				row.status,
				row.created_at,
				row.reference ?? ""
			])
		};
	}
	if (data.kind === "monthly" || data.kind === "general" || data.kind === "earnings") {
		const rows = await sql.query(`select to_char(date_trunc('month', e.created_at at time zone 'UTC'), 'YYYY-MM') as bucket,
                e.platform_id, e.views_delta::int as views, e.amount::text as amount,
                c.title, e.rate_per_mille::text as rate
         from earnings e
         left join clips c on c.id = e.clip_id
         where e.created_at >= $1::date and e.created_at < ($2::date + interval '1 day')
           and ($3::text is null or e.user_id = $3)
         order by e.id desc
         limit 500`, [
			data.from,
			data.to,
			userFilter
		]);
		if (data.kind === "monthly") {
			const grouped = /* @__PURE__ */ new Map();
			for (const row of rows) {
				const key = `${row.bucket} · ${row.platform_id ?? "bono"}`;
				const current = grouped.get(key) ?? {
					views: 0,
					cents: 0
				};
				current.views += Number(row.views);
				current.cents += amountToCents(row.amount);
				grouped.set(key, current);
			}
			return {
				title: "Reporte mensual",
				columns: [
					"Mes y plataforma",
					"Vistas",
					"Monto USD"
				],
				rows: [...grouped.entries()].map(([key, value]) => [
					key,
					String(value.views),
					centsToAmount(value.cents)
				])
			};
		}
		return {
			title: data.kind === "general" ? "Reporte general de movimientos" : "Ganancias individuales",
			columns: [
				"Mes",
				"Publicación",
				"Plataforma",
				"Vistas",
				"Tarifa /1000",
				"Monto USD"
			],
			rows: rows.map((row) => [
				row.bucket,
				row.title ?? "Bonificación",
				row.platform_id ?? "—",
				String(row.views),
				row.rate,
				row.amount
			])
		};
	}
	throw new Error("Reporte no disponible.");
};
//#endregion
export { addBonus, adjustViews, bootstrapProfile, classifyClip, createInvite, decidePayout, getAdminDashboard, getClipDetail, getClipperDashboard, getMyClips, getMyPayments, getMyProfile, getNotifications, getPublicHome, getRanking, getReports, getSettings, listAudit, listClippers, listClips, listInvites, listPayouts, markNotificationsRead, recordPayment, registerClip, requestPayout, reviewClip, runScheduledSync, savePayoutAccount, setPrize, setRate, syncClip, syncYoutubeBatch, updateClipper, updateMyProfile, updateSettings };
