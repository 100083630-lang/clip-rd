import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatUsd, formatViews, formatWhen, formatAgo } from "@/lib/cliprd/format";
import { PLATFORM_LABEL, ACCOUNT_STATUS } from "@/lib/cliprd/labels";
import { WORKED_EXAMPLE, earningAmount, sumAmounts } from "@/lib/cliprd/money";
import type { Profile, ReportTable } from "@/lib/cliprd/types";
import {
  addBonus,
  adjustViews,
  classifyClip,
  createInvite,
  decidePayout,
  getAdminDashboard,
  getReports,
  getSettings,
  listAudit,
  listClippers,
  listClips,
  listInvites,
  listPayouts,
  probeTikTok,
  probeYoutube,
  recordPayment,
  reviewClip,
  saveIntegrationKeys,
  setPrize,
  setRate,
  syncClip,
  syncTiktokBatch,
  syncYoutubeBatch,
  updateClipper,
  updateSettings,
} from "@/server/cliprd";
import { PerformanceChart, PlatformChart } from "./charts";
import { PageTitle, PayBadge, Shell, Stat, StatusBadge, downloadText, platformName, toCsv, toExcel, useRefresh } from "./chrome";
import { ClipGallery, ClipPoster } from "./media";

function fail(error: unknown) {
  toast.error(error instanceof Error ? error.message : "No se pudo completar");
}

export function AdminHome({ profile }: { profile: Profile }) {
  const [platform, setPlatform] = useState("all");
  const [from, setFrom] = useState("1970-01-01");
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [chart, setChart] = useState<"daily" | "weekly" | "monthly">("daily");
  const data = useQuery({
    queryKey: ["admin-home", platform, from, to],
    queryFn: () => getAdminDashboard({ data: { platform: platform as "all", from, to } }),
  });
  const recent = useQuery({
    queryKey: ["admin-clips", "", "", "home"],
    queryFn: () => listClips({ data: { status: "", platform: "", q: "", offset: 0 } }),
  });
  const config = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const cards = data.data?.cards;
  const series = chart === "daily" ? data.data?.daily : chart === "weekly" ? data.data?.weekly : data.data?.monthly;
  return (
    <Shell profile={profile}>
      <PageTitle kicker="AGENCIA" title="Panel" text="Los totales de dinero salen del libro de movimientos, no de una suma repetida de vistas." />
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="select max-w-48" value={platform} onChange={(event) => setPlatform(event.target.value)}>
          <option value="all">Todas</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube_shorts">Shorts</option>
          <option value="youtube_video">Videos</option>
        </select>
        <input className="input max-w-40" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input className="input max-w-40" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </div>
      <section className="mb-8">
        <h2 className="mb-3 text-xl">Clips recientes</h2>
        <ClipGallery clips={(recent.data ?? []).slice(0, 6)} />
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Clippers" value={String(cards?.clippers ?? 0)} hint={`${cards?.activeClippers ?? 0} activos`} />
        <Stat label="Publicaciones" value={String(cards?.posts ?? 0)} hint={`${cards?.pendingPosts ?? 0} por revisar`} />
        <Stat label="Vistas del periodo" value={formatViews(cards?.views ?? 0)} hint="Solo deltas liquidados" />
        <Stat label="Ganancias" value={formatUsd(cards?.earned ?? "0")} />
        <Stat label="TikTok" value={formatViews(cards?.tiktokViews ?? 0)} hint="Vistas de clips aprobados" />
        <Stat label="Shorts" value={formatViews(cards?.shortsViews ?? 0)} hint={config.data?.env.youtube === "ready" ? "API de YouTube conectada" : "YouTube sin clave en este servidor"} />
        <Stat label="Videos" value={formatViews(cards?.videoViews ?? 0)} hint={config.data?.env.youtube === "ready" ? "API de YouTube conectada" : "YouTube sin clave en este servidor"} />
        <Stat label="Pagos hechos" value={formatUsd(cards?.paid ?? "0")} />
        <Stat label="Pagos abiertos" value={formatUsd(cards?.pendingPay ?? "0")} />
        <Stat label="Por liquidar" value={formatUsd(cards?.outstanding ?? "0")} hint="Ganado menos pagado en el periodo" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <div className="mb-3 flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((item) => (
              <button key={item} type="button" className={`btn ${chart === item ? "btn-primary" : "btn-ghost"}`} onClick={() => setChart(item)}>
                {item === "daily" ? "Diario" : item === "weekly" ? "Semanal" : "Mensual"}
              </button>
            ))}
          </div>
          <PerformanceChart data={series ?? []} mode="money" />
        </section>
        <section className="card p-4">
          <h2 className="mb-2 text-xl">Ganancias por plataforma</h2>
          <PlatformChart data={data.data?.platforms ?? []} />
        </section>
        <section className="card p-4 lg:col-span-2">
          <h2 className="mb-2 text-xl">Reproducciones por plataforma</h2>
          <p className="mb-2 text-xs text-muted">Stock de vistas válidas en clips aprobados. No es una suma repetida del historial.</p>
          <PlatformChart data={data.data?.platforms ?? []} metric="views" />
        </section>
      </div>
    </Shell>
  );
}

export function ClippersPage({ profile }: { profile: Profile }) {
  const refresh = useRefresh();
  const rows = useQuery({ queryKey: ["clippers"], queryFn: () => listClippers() });
  const invites = useQuery({ queryKey: ["invites"], queryFn: () => listInvites() });
  const [bonusFor, setBonusFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const visible = (rows.data ?? []).filter((clipper) => {
    const haystack = `${clipper.display_name} ${clipper.email ?? ""}`.toLowerCase();
    return haystack.includes(q.trim().toLowerCase());
  });
  return (
    <Shell profile={profile}>
      <PageTitle kicker="EQUIPO" title="Clippers" text="La primera cuenta es el administrador. Las demás entran pendientes, salvo que usen una invitación." />
      <button
        type="button"
        className="btn btn-primary mb-4"
        onClick={() => {
          void createInvite()
            .then((invite) => {
              toast.success(`Invitación ${invite.code}`);
              return refresh();
            })
            .catch(fail);
        }}
      >
        Crear invitación
      </button>
      <div className="mb-4 space-y-1 text-sm text-muted">
        {(invites.data ?? []).map((invite) => (
          <p key={invite.code}>{invite.code} · vence {formatWhen(invite.expires_at)} · {invite.used_by ? "usada" : "libre"}</p>
        ))}
      </div>
      <input className="input mb-4 max-w-sm" placeholder="Buscar clipper" value={q} onChange={(event) => setQ(event.target.value)} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((clipper) => (
          <article key={clipper.user_id} className={`card p-4 ${clipper.status === "active" ? "glow-active" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 text-lg font-bold text-neon">
                {clipper.avatar_url ? <img alt="" src={clipper.avatar_url} className="size-12 rounded-full object-cover" /> : clipper.display_name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg">{clipper.display_name}</h2>
                <p className="truncate text-xs text-muted">{clipper.email}</p>
                <p className="mt-1 text-xs font-semibold text-neon">{ACCOUNT_STATUS[clipper.status as keyof typeof ACCOUNT_STATUS] ?? clipper.status}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Este mes: {clipper.month_posts} clips · {formatViews(Number(clipper.month_views))} vistas válidas</p>
            <p className="text-xs text-muted">Último {formatAgo(clipper.last_at)} · total {formatUsd(clipper.earned)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                <select
                  className="select max-w-44"
                  value={clipper.status}
                  aria-label={`Estado de ${clipper.display_name}`}
                  onChange={(event) => {
                    const status = event.target.value as "pending" | "active" | "inactive" | "suspended";
                    void updateClipper({ data: { userId: clipper.user_id, status } }).then(() => refresh()).catch(fail);
                  }}
                >
                  {(Object.keys(ACCOUNT_STATUS) as Array<keyof typeof ACCOUNT_STATUS>).map((status) => (
                    <option key={status} value={status}>{ACCOUNT_STATUS[status]}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-ghost" onClick={() => setBonusFor(clipper.user_id)}>Bono</button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    void updateClipper({ data: { userId: clipper.user_id, remove: true } }).then(() => refresh()).catch(fail);
                  }}
                >
                  Eliminar
                </button>
              </div>
            {bonusFor === clipper.user_id ? (
              <form
                className="mt-3 grid gap-2 md:grid-cols-[8rem_1fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  void addBonus({ data: { userId: clipper.user_id, amount, note } })
                    .then(() => {
                      toast.success("Bonificación registrada");
                      setBonusFor(null);
                      return refresh();
                    })
                    .catch(fail);
                }}
              >
                <input className="input" placeholder="10.00" value={amount} onChange={(event) => setAmount(event.target.value)} />
                <input className="input" placeholder="Motivo del premio" value={note} onChange={(event) => setNote(event.target.value)} />
                <button className="btn btn-primary" type="submit">Aplicar</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function ClipsAdminPage({ profile, initialQuery = "" }: { profile: Profile; initialQuery?: string }) {
  const refresh = useRefresh();
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState("");
  const [q, setQ] = useState(initialQuery);
  const clips = useQuery({
    queryKey: ["admin-clips", status, platform, q],
    queryFn: () => listClips({ data: { status, platform, q } }),
  });
  return (
    <Shell profile={profile}>
      <PageTitle kicker="REVISIÓN" title="Publicaciones" />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input max-w-56" placeholder="Buscar" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className="select max-w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Estado</option>
          {["pending", "in_review", "verified", "approved", "rejected", "suspended", "settled"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="select max-w-48" value={platform} onChange={(event) => setPlatform(event.target.value)}>
          <option value="">Plataforma</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube_shorts">Shorts</option>
          <option value="youtube_video">Videos</option>
        </select>
        <button type="button" className="btn btn-ghost" onClick={() => void syncYoutubeBatch().then((result) => {
          const detail = result.errors.filter(Boolean).join(" ");
          toast.message(
            result.synced > 0
              ? `YouTube actualizó ${result.synced} publicaciones. ${detail}`.trim()
              : detail || "La API respondió, pero no hay publicaciones de YouTube registradas para actualizar.",
          );
        }).catch(fail)}>
          Sincronizar YouTube
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => void syncTiktokBatch().then((result) => toast.message(`TikTok: ${result.synced}. ${result.errors.join(" ")}`)).catch(fail)}>
          Sincronizar TikTok
        </button>
      </div>
      <div className="space-y-3">
        {(clips.data ?? []).map((clip) => (
          <article key={clip.id} className="card overflow-hidden">
            <ClipPoster clip={clip} />
            <ClipReview clipId={clip.id} title={clip.title} owner={clip.ownerName} status={clip.status} platform={clip.platformId} classification={clip.classification} provider={clip.provider} publicViews={clip.publicViews} validViews={clip.validViews} verified={clip.statsVerified} source={clip.statsSource} error={clip.statsError} onDone={refresh} />
          </article>
        ))}
      </div>
    </Shell>
  );
}

function ClipReview(props: {
  clipId: number;
  title: string;
  owner: string;
  status: string;
  platform: string;
  classification: string;
  provider: string;
  publicViews: number;
  validViews: number;
  verified: boolean;
  source: string;
  error: string | null;
  onDone: () => Promise<void>;
}) {
  const [views, setViews] = useState(String(props.verified ? props.publicViews : props.validViews));
  const [text, setText] = useState("");
  const act = (action: "approve" | "reject" | "suspend" | "review" | "verified" | "settle") => {
    void reviewClip({
      data: {
        clipId: props.clipId,
        action,
        validViews: Number(views),
        justification: text,
        reason: text,
      },
    })
      .then(() => props.onDone())
      .catch(fail);
  };
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg">{props.title}</h2>
          <p className="text-xs text-muted">{props.owner} · {platformName(props.platform)} · {props.classification} · {props.source}{props.verified ? " · verificado" : " · no verificado"}</p>
        </div>
        <StatusBadge value={props.status} />
      </div>
      <p className="mt-2 text-sm">Públicas {formatViews(props.publicViews)} · válidas {formatViews(props.validViews)}</p>
      {props.error ? <p className="text-xs text-warn">{props.error}</p> : null}
      <div className="mt-3 grid gap-2 md:grid-cols-[8rem_1fr]">
        <input className="input" inputMode="numeric" value={views} onChange={(event) => setViews(event.target.value)} />
        <input className="input" placeholder="Justificación o motivo" value={text} onChange={(event) => setText(event.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => act("approve")}>Aprobar</button>
        <button type="button" className="btn btn-ghost" onClick={() => act("review")}>Revisión</button>
        <button type="button" className="btn btn-ghost" onClick={() => act("verified")}>Verificada</button>
        <button type="button" className="btn btn-ghost" onClick={() => act("settle")}>Liquidada</button>
        <button type="button" className="btn btn-danger" onClick={() => act("reject")}>Rechazar</button>
        <button type="button" className="btn btn-danger" onClick={() => act("suspend")}>Suspender</button>
        {props.provider === "youtube" ? (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => void classifyClip({ data: { clipId: props.clipId, platformId: "youtube_shorts" } }).then(() => props.onDone()).catch(fail)}>Es Short</button>
            <button type="button" className="btn btn-ghost" onClick={() => void classifyClip({ data: { clipId: props.clipId, platformId: "youtube_video" } }).then(() => props.onDone()).catch(fail)}>Es video</button>
            <button type="button" className="btn btn-ghost" onClick={() => void syncClip({ data: { clipId: props.clipId } }).then((result) => toast.message(result.message)).catch(fail)}>Sincronizar</button>
          </>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => void syncClip({ data: { clipId: props.clipId } }).then((result) => toast.message(result.message)).catch(fail)}>Sincronizar TikTok</button>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            void adjustViews({ data: { clipId: props.clipId, validViews: Number(views), justification: text } })
              .then(() => props.onDone())
              .catch(fail);
          }}
        >
          Ajustar vistas
        </button>
      </div>
    </div>
  );
}

export function PaymentsAdminPage({ profile }: { profile: Profile }) {
  const refresh = useRefresh();
  const rows = useQuery({ queryKey: ["payouts"], queryFn: () => listPayouts() });
  return (
    <Shell profile={profile}>
      <PageTitle kicker="TESORERÍA" title="Pagos" text="Registrar una transferencia no mueve dinero. Documenta el pago que ya hiciste en el banco." />
      <div className="space-y-3">
        {(rows.data ?? []).map((row) => (
          <PayoutCard key={row.id} row={row} onDone={refresh} />
        ))}
      </div>
    </Shell>
  );
}

function PayoutCard({
  row,
  onDone,
}: {
  row: {
    id: number;
    display_name: string;
    amount: string;
    status: string;
    holder_name: string | null;
    bank_name: string | null;
    account_type: string | null;
    account_number: string | null;
    reference: string | null;
    receipt_url: string | null;
    created_at: string;
  };
  onDone: () => Promise<void>;
}) {
  const [reference, setReference] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [reason, setReason] = useState("");
  return (
    <article className="card p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg">{row.display_name}</h2>
          <p className="text-muted">{formatWhen(row.created_at)} · {row.bank_name ?? "sin cuenta"} · {row.account_type ?? ""} · {row.account_number ?? ""}</p>
          <p className="text-muted">Titular {row.holder_name ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="stat-value text-2xl">{formatUsd(row.amount)}</p>
          <PayBadge value={row.status} />
        </div>
      </div>
      {row.reference ? <p className="mt-2">Referencia {row.reference}</p> : null}
      {row.status !== "paid" && row.status !== "rejected" ? (
        <div className="mt-3 grid gap-2">
          <input className="input" placeholder="Referencia bancaria" value={reference} onChange={(event) => setReference(event.target.value)} />
          <input className="input" placeholder="Enlace https del comprobante" value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} />
          <input className="input" placeholder="Motivo si rechazas" value={reason} onChange={(event) => setReason(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => void decidePayout({ data: { id: row.id, action: "approved" } }).then(() => onDone()).catch(fail)}>Aprobar</button>
            <button type="button" className="btn btn-ghost" onClick={() => void decidePayout({ data: { id: row.id, action: "processing" } }).then(() => onDone()).catch(fail)}>En proceso</button>
            <button type="button" className="btn btn-danger" onClick={() => void decidePayout({ data: { id: row.id, action: "rejected", reason } }).then(() => onDone()).catch(fail)}>Rechazar</button>
            <button type="button" className="btn btn-primary" onClick={() => void recordPayment({ data: { id: row.id, reference, receiptUrl } }).then(() => onDone()).catch(fail)}>Registrar transferencia</button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function RatesPage({ profile }: { profile: Profile }) {
  const refresh = useRefresh();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const proof = WORKED_EXAMPLE.map((row) => earningAmount(row.views, row.rate));
  return (
    <Shell profile={profile}>
      <PageTitle kicker="MOTOR" title="Tarifas" text="Una tarifa nueva no reescribe ganancias anteriores. El ejemplo de control debe dar US$79.40." />
      <p className="mb-4 text-lg">Comprobación: {proof.join(" + ")} = <span className="text-neon">{formatUsd(sumAmounts(proof))}</span></p>
      <div className="space-y-3">
        {(settings.data?.rates ?? []).map((rate) => (
          <form
            key={rate.platform_id}
            className="card grid items-end gap-3 p-4 md:grid-cols-[1fr_10rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void setRate({
                data: {
                  platformId: rate.platform_id as "tiktok",
                  amount: amounts[rate.platform_id] || rate.amount,
                  note: "Cambio desde el panel",
                },
              })
                .then(() => {
                  toast.success("Tarifa guardada");
                  return refresh();
                })
                .catch(fail);
            }}
          >
            <div>
              <p className="font-semibold">{PLATFORM_LABEL[rate.platform_id]}</p>
              <p className="text-xs text-muted">Vigente {rate.amount} desde {formatWhen(rate.effective_from)}</p>
            </div>
            <input className="input" defaultValue={rate.amount} onChange={(event) => setAmounts((current) => ({ ...current, [rate.platform_id]: event.target.value }))} />
            <button className="btn btn-primary" type="submit">Guardar</button>
          </form>
        ))}
      </div>
      <PrizeForm onDone={refresh} />
    </Shell>
  );
}

function PrizeForm({ onDone }: { onDone: () => Promise<void> }) {
  const [scope, setScope] = useState<"all" | "tiktok" | "youtube_shorts" | "youtube_video">("all");
  const [place, setPlace] = useState(1);
  const [title, setTitle] = useState("Premio");
  const [amount, setAmount] = useState("");
  return (
    <form
      className="card mt-6 grid gap-3 p-4 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        void setPrize({ data: { scope, place, title, amount, active: true } }).then(() => onDone()).catch(fail);
      }}
    >
      <select className="select" value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}>
        <option value="all">General</option>
        <option value="tiktok">TikTok</option>
        <option value="youtube_shorts">Shorts</option>
        <option value="youtube_video">Videos</option>
      </select>
      <input className="input" type="number" min={1} max={20} value={place} onChange={(event) => setPlace(Number(event.target.value))} />
      <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
      <button className="btn btn-ghost" type="submit">Guardar premio {amount ? "" : ""}</button>
      <input className="input md:col-span-2" placeholder="Monto opcional" value={amount} onChange={(event) => setAmount(event.target.value)} />
    </form>
  );
}

export function ReportsPage({ profile }: { profile: Profile }) {
  const [kind, setKind] = useState<ReportTableKind>("general");
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [table, setTable] = useState<ReportTable | null>(null);
  return (
    <Shell profile={profile}>
      <PageTitle kicker="ARCHIVO" title="Reportes" />
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <select className="select max-w-64" value={kind} onChange={(event) => setKind(event.target.value as ReportTableKind)}>
          <option value="participants">Por participante</option>
          <option value="earnings">Ganancias</option>
          <option value="platforms">Por plataforma</option>
          <option value="paid">Pagos realizados</option>
          <option value="pending">Pagos pendientes</option>
          <option value="monthly">Mensual</option>
          <option value="general">General</option>
        </select>
        <input className="input max-w-40" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input className="input max-w-40" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <button type="button" className="btn btn-primary" onClick={() => void getReports({ data: { kind, from, to } }).then(setTable).catch(fail)}>Generar</button>
        {table ? (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => downloadText(`${kind}.csv`, toCsv(table), "text/csv")}>CSV</button>
            <button type="button" className="btn btn-ghost" onClick={() => downloadText(`${kind}.xls`, toExcel(table), "application/vnd.ms-excel")}>Excel</button>
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>PDF</button>
          </>
        ) : null}
      </div>
      {table ? <ReportView table={table} /> : <p className="text-sm text-muted">Elige un reporte. El PDF sale del diálogo de impresión del navegador.</p>}
    </Shell>
  );
}

type ReportTableKind = "participants" | "earnings" | "platforms" | "paid" | "pending" | "monthly" | "general";

function ReportView({ table }: { table: ReportTable }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl">{table.title}</h2>
      <div className="space-y-2 md:hidden">
        {table.rows.map((row, index) => (
          <article key={index} className="card p-3 text-sm">
            {row.map((cell, cellIndex) => (
              <p key={cellIndex}><span className="text-muted">{table.columns[cellIndex]}: </span>{cell}</p>
            ))}
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>{table.columns.map((column) => <th key={column} className="border-b border-border px-2 py-2 text-muted">{column}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((row, index) => (
              <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-border px-2 py-2">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KeysForm() {
  const refresh = useRefresh();
  const [youtubeApiKey, setYoutube] = useState("");
  const [tiktokClientKey, setTiktokKey] = useState("");
  const [tiktokClientSecret, setTiktokSecret] = useState("");
  const [pending, setPending] = useState(false);
  function save(extra: { clearYoutube?: boolean; clearTiktok?: boolean }) {
    setPending(true);
    void saveIntegrationKeys({
      data: {
        youtubeApiKey: extra.clearYoutube ? undefined : youtubeApiKey,
        tiktokClientKey: extra.clearTiktok ? undefined : tiktokClientKey,
        tiktokClientSecret: extra.clearTiktok ? undefined : tiktokClientSecret,
        clearYoutube: extra.clearYoutube,
        clearTiktok: extra.clearTiktok,
      },
    })
      .then(() => {
        setYoutube("");
        setTiktokKey("");
        setTiktokSecret("");
        toast.success(extra.clearYoutube || extra.clearTiktok ? "Clave retirada" : "Claves guardadas");
        return refresh();
      })
      .catch(fail)
      .finally(() => setPending(false));
  }
  return (
    <form
      className="card mt-6 grid max-w-2xl gap-3 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        save({});
      }}
    >
      <h2 className="text-xl">Claves de YouTube y TikTok</h2>
      <p className="text-sm text-muted">Pega la API key, no un usuario ni una contraseña. No se vuelve a mostrar completa.</p>
      <label className="field">
        <span className="label">API key de YouTube</span>
        <input className="input" autoComplete="off" spellCheck={false} value={youtubeApiKey} onChange={(event) => setYoutube(event.target.value)} placeholder="AIza…" />
      </label>
      <label className="field">
        <span className="label">TikTok client key</span>
        <input className="input" autoComplete="off" spellCheck={false} value={tiktokClientKey} onChange={(event) => setTiktokKey(event.target.value)} />
      </label>
      <label className="field">
        <span className="label">TikTok client secret</span>
        <input className="input" autoComplete="off" spellCheck={false} value={tiktokClientSecret} onChange={(event) => setTiktokSecret(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={pending}>Guardar claves</button>
        <button className="btn btn-ghost" type="button" disabled={pending} onClick={() => save({ clearYoutube: true })}>Quitar YouTube</button>
        <button className="btn btn-ghost" type="button" disabled={pending} onClick={() => save({ clearTiktok: true })}>Quitar TikTok</button>
      </div>
    </form>
  );
}

export function SettingsPage({ profile }: { profile: Profile }) {
  const refresh = useRefresh();
  const data = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const audit = useQuery({ queryKey: ["audit"], queryFn: () => listAudit() });
  const settings = data.data?.settings;
  const [agencyName, setAgencyName] = useState("Origen Simple");
  const [slogan, setSlogan] = useState("CONVIERTE VISUALIZACIONES EN DINERO.");
  const [syncIntervalMinutes, setSync] = useState(360);
  const [minPayout, setMin] = useState("10.00");
  useEffect(() => {
    if (!settings) return;
    setAgencyName(settings.agency_name);
    setSlogan(settings.slogan);
    setSync(settings.sync_interval_minutes);
    setMin(settings.min_payout);
  }, [settings]);
  const env = data.data?.env;
  return (
    <Shell profile={profile}>
      <PageTitle kicker="SISTEMA" title="Ajustes" text="Las claves se guardan en el servidor. El panel solo muestra los últimos 4 caracteres." />
      <form
        className="card grid max-w-2xl gap-3 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void updateSettings({ data: { agencyName, slogan, syncIntervalMinutes: Number(syncIntervalMinutes), minPayout } })
            .then(() => {
              toast.success("Ajustes guardados");
              return refresh();
            })
            .catch(fail);
        }}
      >
        <label className="field"><span className="label">Agencia</span><input className="input" value={agencyName} onChange={(event) => setAgencyName(event.target.value)} /></label>
        <label className="field"><span className="label">Eslogan</span><input className="input" value={slogan} onChange={(event) => setSlogan(event.target.value)} /></label>
        <label className="field"><span className="label">Minutos entre sincronizaciones</span><input className="input" type="number" min={15} value={syncIntervalMinutes} onChange={(event) => setSync(Number(event.target.value))} /></label>
        <label className="field"><span className="label">Retiro mínimo USD</span><input className="input" value={minPayout} onChange={(event) => setMin(event.target.value)} /></label>
        <button className="btn btn-primary" type="submit">Guardar</button>
      </form>
      <KeysForm />
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <article className="card p-4">
          <h2 className="text-lg">YouTube</h2>
          <p className="mt-2 text-sm text-muted">
            {env?.youtube === "ready"
              ? `API key lista${env.youtubeHint ? ` (${env.youtubeHint})` : ""}. videos.list puede leer vistas.`
              : env?.youtube === "placeholder"
                ? "Hay un marcador, no una API key. No se simulan vistas ni se llama a Google."
                : "Falta la API key. Pégala abajo. Sin ella no hay vistas de YouTube."}
          </p>
          <p className="mt-2 text-xs text-muted">Cuota usada hoy: {settings?.youtube_quota_day === new Date().toISOString().slice(0, 10) ? settings?.youtube_quota_used : 0}</p>
          <button type="button" className="btn btn-ghost mt-3" onClick={() => void probeYoutube().then((result) => toast.message(result.message)).catch(fail)}>Probar YouTube</button>
        </article>
        <article className="card p-4">
          <h2 className="text-lg">TikTok</h2>
          <p className="mt-2 text-sm text-muted">
            {env?.tiktok
              ? `App lista${env.tiktokHint ? ` (${env.tiktokHint})` : ""}. Cada clipper autoriza video.list desde su perfil. Sin esa autorización no hay vistas oficiales.`
              : "TikTok no usa una API key suelta. Hacen falta client key y client secret de tu app en developers.tiktok.com."}
          </p>
          <p className="mt-2 break-all text-xs text-muted">Redirect obligatorio: {env?.productionRedirect}</p>
          <button type="button" className="btn btn-ghost mt-3" onClick={() => void probeTikTok().then((result) => toast.message(result.message)).catch(fail)}>Probar TikTok</button>
        </article>
        <article className="card p-4"><h2 className="text-lg">Base y cron</h2><p className="mt-2 text-sm text-muted">{env?.database}. Cron: {env?.cron ? "CRON_SECRET presente" : "sin CRON_SECRET, POST /api/cron/sync responde 503"}.</p></article>
      </section>
      <section className="mt-6 space-y-3 text-sm text-muted">
        <h2 className="text-xl text-fg">Crear la API key de YouTube</h2>
        <p>1. Entra a console.cloud.google.com con la cuenta de la agencia y crea un proyecto, por ejemplo CLIPRD.</p>
        <p>2. Activa <strong className="text-fg">YouTube Data API v3</strong>. No actives OAuth ni crees un “ID de cliente”.</p>
        <p>3. APIs y servicios → Credenciales → Crear credenciales → <strong className="text-fg">Clave de API</strong>. Eso no pide contraseña ni secreto de cliente.</p>
        <p>4. En la clave, restricción de API: solo YouTube Data API v3. Restricción de aplicación: ninguna. Si la limitas por sitio web, el servidor de clip-rd.vercel.app no podrá usarla.</p>
        <p>5. Pega esa clave aquí y pulsa Probar YouTube. Cada videos.list cuesta 1 unidad. CLIPRD se detiene cerca de 9,500 al día.</p>
        <h2 className="text-xl text-fg">Crear la app de TikTok</h2>
        <p>TikTok no da una clave como YouTube. La vista oficial sale de video.list, y eso exige que cada cuenta autorice la app.</p>
        <p>1. Entra a developers.tiktok.com con la cuenta de la agencia y crea una app.</p>
        <p>2. Agrega Login Kit. Activa los permisos user.info.basic y video.list. No basta con el oEmbed público: eso no se paga.</p>
        <p>3. En Redirect URI pega exactamente {env?.productionRedirect}. Si estás probando en otro dominio, también registra el que muestra esta pantalla al conectar.</p>
        <p>4. Copia Client key y Client secret, pégalos juntos aquí y pulsa Probar TikTok. Si la app sigue en sandbox, añade como usuario de prueba cada cuenta de TikTok que vaya a conectar.</p>
        <p>5. El clipper entra a Perfil y pulsa Conectar TikTok. Hasta ese momento CLIPRD puede leer el enlace, pero no liquida esas vistas.</p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl">Auditoría</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(audit.data ?? []).map((row) => (
            <p key={row.id} className="text-muted">{formatWhen(row.created_at)} · {row.actor_name ?? row.actor_id} · {row.action} · {row.entity} {row.entity_id ?? ""}</p>
          ))}
        </div>
      </section>
    </Shell>
  );
}
