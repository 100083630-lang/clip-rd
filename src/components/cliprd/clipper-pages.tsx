import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatUsd, formatViews, formatWhen, maskAccount } from "@/lib/cliprd/format";
import { platformName, PageTitle, PayBadge, Shell, Stat, StatusBadge, useRefresh } from "./chrome";
import { PerformanceChart } from "./charts";
import { ClipGallery, ClipPoster } from "./media";
import type { Profile } from "@/lib/cliprd/types";
import {
  getClipDetail,
  getClipperDashboard,
  getMyClips,
  getMyPayments,
  getTikTokStatus,
  registerClip,
  requestPayout,
  savePayoutAccount,
  startTikTokConnect,
  disconnectTikTok,
  syncMyTikTok,
  updateMyProfile,
} from "@/server/cliprd";

function fail(error: unknown) {
  toast.error(error instanceof Error ? error.message : "No se pudo completar");
}

export function ClipperHome({ profile }: { profile: Profile }) {
  const data = useQuery({ queryKey: ["clipper-home"], queryFn: () => getClipperDashboard() });
  const clips = useQuery({ queryKey: ["my-clips"], queryFn: () => getMyClips() });
  const dash = data.data;
  return (
    <Shell profile={profile}>
      <p className="text-xs font-bold tracking-[0.18em] text-neon">BIENVENIDO A CLIPRD</p>
      <div className="mt-2 flex items-center gap-4">
        <span className="grid size-14 place-items-center overflow-hidden rounded-full bg-surface-2 text-xl font-bold">
          {profile.avatarUrl ? <img alt="" src={profile.avatarUrl} className="size-14 object-cover" /> : profile.displayName.slice(0, 1)}
        </span>
        <div>
          <h1 className="text-4xl">{profile.displayName}</h1>
          <p className="text-sm text-muted">{profile.agencyName}</p>
        </div>
      </div>
      {profile.status === "pending" ? (
        <p className="mt-4 rounded-lg border border-warn/40 px-4 py-3 text-sm text-warn">Tu cuenta espera aprobación. Puedes ver el panel, pero no registrar clips ni pedir pagos.</p>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Reproducciones" value={formatViews(dash?.views ?? 0)} hint="Vistas válidas aprobadas" />
        <Stat label="Ganancias" value={formatUsd(dash?.balance.earned ?? "0")} />
        <Stat label="Disponible" value={formatUsd(dash?.balance.available ?? "0")} />
        <Stat label="Pagos recibidos" value={formatUsd(dash?.received ?? "0")} hint={`Pendientes ${formatUsd(dash?.balance.pending ?? "0")}`} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/clipper/register-clip" search={{ platform: "tiktok" }} className="btn btn-primary">Registrar clip de TikTok</Link>
        <Link to="/clipper/register-clip" search={{ platform: "youtube" }} className="btn btn-ghost">Registrar clip de YouTube</Link>
      </div>
      <section className="card mt-6 p-4">
        <h2 className="mb-2 text-xl">Rendimiento</h2>
        <PerformanceChart data={dash?.series ?? []} mode="money" />
      </section>
      <section className="mt-6">
        <h2 className="mb-3 text-xl">Clips recientes</h2>
        <ClipGallery clips={(clips.data ?? []).slice(0, 6)} />
      </section>
    </Shell>
  );
}

export function RegisterClipPage({ profile }: { profile: Profile }) {
  const refresh = useRefresh();
  const search = useSearch({ from: "/clipper/register-clip" });
  const [declared, setDeclared] = useState<"tiktok" | "youtube_shorts" | "youtube_video">(
    search.platform === "youtube" ? "youtube_shorts" : "tiktok",
  );
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishedOn, setPublishedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, setPending] = useState(false);
  return (
    <Shell profile={profile}>
      <PageTitle kicker="NUEVO CLIP" title="Registrar publicación" text="El enlace se valida y se busca duplicado. Las vistas solo se marcan verificadas si las entrega la API." />
      <form
        className="card grid max-w-2xl gap-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          void registerClip({ data: { url, title, description, publishedOn, declared } })
            .then((result) => {
              toast.success(result.statsVerified ? "Clip guardado con estadísticas de YouTube." : "Clip guardado. Las vistas no están verificadas.");
              result.warnings.forEach((warning) => toast.message(warning));
              setUrl("");
              setTitle("");
              setDescription("");
              return refresh();
            })
            .catch(fail)
            .finally(() => setPending(false));
        }}
      >
        <label className="field">
          <span className="label">Plataforma</span>
          <select className="select" value={declared} onChange={(event) => setDeclared(event.target.value as typeof declared)}>
            <option value="tiktok">TikTok</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="youtube_video">YouTube Videos</option>
          </select>
        </label>
        <label className="field"><span className="label">Enlace</span><input className="input" required placeholder="https://" value={url} onChange={(event) => setUrl(event.target.value)} /></label>
        <label className="field"><span className="label">Nombre del clip</span><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="field"><span className="label">Fecha de publicación</span><input className="input" type="date" required value={publishedOn} onChange={(event) => setPublishedOn(event.target.value)} /></label>
        <label className="field"><span className="label">Descripción</span><textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <button className="btn btn-primary" disabled={pending || profile.status !== "active"}>{pending ? "Validando…" : "Enviar a revisión"}</button>
      </form>
    </Shell>
  );
}

export function MyClipsPage({ profile }: { profile: Profile }) {
  const clips = useQuery({ queryKey: ["my-clips"], queryFn: () => getMyClips() });
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Shell profile={profile}>
      <PageTitle kicker="ARCHIVO" title="Mis publicaciones" />
      <div className="space-y-3">
        {(clips.data ?? []).length === 0 ? <p className="text-sm text-muted">Todavía no registras clips.</p> : null}
        {(clips.data ?? []).map((clip) => (
          <article key={clip.id} className="card overflow-hidden">
            <ClipPoster clip={clip} />
            <div className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg">{clip.title}</h2>
                  <p className="text-xs text-muted">{platformName(clip.platformId)} · {clip.publishedOn ?? "sin fecha"}</p>
                </div>
                <StatusBadge value={clip.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <p><span className="block text-muted">Públicas</span><span className="stat-value">{formatViews(clip.publicViews)}</span></p>
                <p><span className="block text-muted">Válidas</span><span className="stat-value">{formatViews(clip.validViews)}</span></p>
                <p><span className="block text-muted">Ganancia</span><span className="stat-value">{formatUsd(clip.earning)}</span></p>
                <p><span className="block text-muted">Fuente</span>{sourceLabel(clip.statsSource, clip.statsVerified)}</p>
              </div>
              {clip.statsError ? <p className="mt-2 text-xs text-warn">{clip.statsError}</p> : null}
              <button type="button" className="btn btn-ghost mt-3" onClick={() => setOpen(open === clip.id ? null : clip.id)}>Estadísticas</button>
              {open === clip.id ? <ClipFacts id={clip.id} /> : null}
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

function sourceLabel(source: string, verified: boolean) {
  if (source === "youtube_api" && verified) return "YouTube Data API";
  if (source === "admin_adjustment") return "Ajuste manual";
  if (source === "oembed") return "Metadato, sin vistas";
  if (source === "tiktok_api") return "TikTok video.list";
  return "Sin verificar";
}

function ClipFacts({ id }: { id: string }) {
  const detail = useQuery({ queryKey: ["clip", id], queryFn: () => getClipDetail({ data: { id } }) });
  if (!detail.data) return <p className="mt-3 text-sm text-muted">Cargando historial…</p>;
  return (
    <div className="mt-4 space-y-3 text-sm">
      <a className="underline" href={detail.data.clip.url} target="_blank" rel="noreferrer">Abrir publicación</a>
      <p className="text-muted">Canal: {detail.data.clip.channelName ?? "—"} · Duración: {detail.data.clip.durationSeconds ?? "—"} s · Clasificación: {detail.data.clip.classification}</p>
      <h3 className="font-semibold">Historial</h3>
      {detail.data.history.map((row) => (
        <p key={row.at} className="text-muted">{formatWhen(row.at)} · públicas {formatViews(row.publicViews)} · válidas {formatViews(row.validViews)} · {row.source} {row.note ? `· ${row.note}` : ""}</p>
      ))}
      <h3 className="font-semibold">Movimientos</h3>
      {detail.data.earnings.length === 0 ? <p className="text-muted">Sin ganancias todavía.</p> : null}
      {detail.data.earnings.map((row) => (
        <p key={row.at + row.amount} className="text-muted">{formatWhen(row.at)} · {row.delta.toLocaleString("es-DO")} vistas · tarifa {row.rate} · {formatUsd(row.amount)}</p>
      ))}
    </div>
  );
}

export function EarningsPage({ profile }: { profile: Profile }) {
  const data = useQuery({ queryKey: ["pay"], queryFn: () => getMyPayments() });
  const ledger = data.data?.ledger ?? [];
  return (
    <Shell profile={profile}>
      <PageTitle kicker="LIBRO" title="Ganancias" text="Cada fila es un movimiento nuevo. Actualizar vistas no vuelve a sumar el historial." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Acumuladas" value={formatUsd(data.data?.balance.earned ?? "0")} />
        <Stat label="Disponibles" value={formatUsd(data.data?.balance.available ?? "0")} />
        <Stat label="En solicitudes" value={formatUsd(data.data?.balance.committed ?? "0")} />
      </div>
      <div className="space-y-2">
        {ledger.length === 0 ? <p className="text-sm text-muted">Aún no hay movimientos.</p> : null}
        {ledger.map((row) => (
          <article key={row.id} className="card grid gap-1 p-4 text-sm md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-semibold">{row.title ?? "Bonificación"}</p>
              <p className="text-muted">{platformName(row.platform_id)} · {row.kind} · {formatWhen(row.created_at)}</p>
              {row.note ? <p className="text-muted">{row.note}</p> : null}
            </div>
            <p className="stat-value text-xl">{formatUsd(row.amount)}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function PaymentsPage({ profile }: { profile: Profile }) {
  const refresh = useRefresh();
  const data = useQuery({ queryKey: ["pay"], queryFn: () => getMyPayments() });
  const account = data.data?.account;
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("Banco Popular Dominicano");
  const [accountType, setAccountType] = useState<"ahorro" | "corriente">("ahorro");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  return (
    <Shell profile={profile}>
      <PageTitle kicker="CLIPRD PAYMENTS" title="Pagos" text="El botón no transfiere dinero. Registra la solicitud y la agencia paga por transferencia." />
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="card space-y-3 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void savePayoutAccount({ data: { holderName: holderName || account?.holderName || "", bankName, accountType, accountNumber } })
              .then(() => {
                toast.success("Cuenta guardada");
                return refresh();
              })
              .catch(fail);
          }}
        >
          <h2 className="text-xl">Cuenta bancaria</h2>
          {account ? <p className="text-sm text-muted">Actual: {account.bankName} · {maskAccount(account.accountNumber)}</p> : null}
          <label className="field"><span className="label">Titular</span><input className="input" required defaultValue={account?.holderName} onChange={(event) => setHolderName(event.target.value)} /></label>
          <label className="field"><span className="label">Banco</span><input className="input" value={bankName} onChange={(event) => setBankName(event.target.value)} /></label>
          <label className="field">
            <span className="label">Tipo</span>
            <select className="select" value={accountType} onChange={(event) => setAccountType(event.target.value as "ahorro" | "corriente")}>
              <option value="ahorro">Ahorro</option>
              <option value="corriente">Corriente</option>
            </select>
          </label>
          <label className="field"><span className="label">Número</span><input className="input" inputMode="numeric" required minLength={6} value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} /></label>
          <button className="btn btn-ghost" type="submit">Guardar cuenta</button>
        </form>
        <form
          className="card space-y-3 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void requestPayout({ data: { amount, note } })
              .then(() => {
                toast.success("Solicitud enviada");
                setAmount("");
                return refresh();
              })
              .catch(fail);
          }}
        >
          <h2 className="text-xl">Solicitar retiro</h2>
          <p className="text-sm text-muted">Disponible {formatUsd(data.data?.balance.available ?? "0")} · mínimo {formatUsd(data.data?.minimum ?? "10")}</p>
          <label className="field"><span className="label">Monto USD</span><input className="input" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
          <label className="field"><span className="label">Nota</span><input className="input" value={note} onChange={(event) => setNote(event.target.value)} /></label>
          <button className="btn btn-primary" type="submit" disabled={profile.status !== "active"}>Pedir pago</button>
        </form>
      </div>
      <div className="mt-6 space-y-2">
        {(data.data?.requests ?? []).map((request) => (
          <article key={request.id} className="card p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="stat-value text-xl">{formatUsd(request.amount)}</p>
              <PayBadge value={request.status} />
            </div>
            <p className="mt-1 text-muted">{formatWhen(request.created_at)} {request.reference ? `· Ref. ${request.reference}` : ""}</p>
            {request.rejection_reason ? <p className="text-danger">{request.rejection_reason}</p> : null}
            {request.receipt_url ? <a className="underline" href={request.receipt_url}>Comprobante</a> : null}
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function ProfilePage({ profile }: { profile: Profile }) {
  const refresh = useRefresh();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const tiktok = useQuery({ queryKey: ["tiktok-status"], queryFn: () => getTikTokStatus() });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("tiktok");
    if (flag === "ok") toast.success("TikTok conectado. Las vistas oficiales salen de video.list.");
    if (flag === "error") toast.error(params.get("msg") || "No se pudo conectar TikTok.");
  }, []);
  return (
    <Shell profile={profile}>
      <PageTitle kicker="FICHA" title="Perfil" />
      <form
        className="card max-w-xl space-y-3 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void updateMyProfile({ data: { displayName, phone, avatarUrl } })
            .then(() => {
              toast.success("Perfil actualizado");
              return refresh();
            })
            .catch(fail);
        }}
      >
        <label className="field"><span className="label">Nombre</span><input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
        <label className="field"><span className="label">Teléfono</span><input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label className="field"><span className="label">Foto https</span><input className="input" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} /></label>
        <p className="text-xs text-muted">Correo de acceso: {profile.email}</p>
        <button className="btn btn-primary" type="submit">Guardar</button>
      </form>
      <section className="card mt-4 max-w-xl space-y-3 p-5">
        <h2 className="text-xl">TikTok</h2>
        <p className="text-sm text-muted">
          {tiktok.data?.connected
            ? `Cuenta autorizada${tiktok.data.name ? `: ${tiktok.data.name}` : ""}. video.list lee tus reproducciones. No se inventan.`
            : tiktok.data?.appReady
              ? "La app está lista. Autoriza tu cuenta para verificar vistas. Sin eso, una cifra pública no se paga."
              : "La agencia todavía no cargó TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET. Puedes registrar enlaces, pero las vistas no quedan verificadas."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!tiktok.data?.appReady}
            onClick={() => {
              void startTikTokConnect()
                .then((result) => {
                  window.location.href = result.url;
                })
                .catch(fail);
            }}
          >
            {tiktok.data?.connected ? "Reconectar" : "Conectar TikTok"}
          </button>
          {tiktok.data?.connected ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                void syncMyTikTok()
                  .then((result) => toast.message(`Actualizados ${result.synced}. ${result.errors.join(" ")}`))
                  .catch(fail);
              }}
            >
              Actualizar vistas
            </button>
          ) : null}
          {tiktok.data?.connected ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                void disconnectTikTok().then(() => refresh()).catch(fail);
              }}
            >
              Desconectar
            </button>
          ) : null}
        </div>
      </section>
    </Shell>
  );
}
