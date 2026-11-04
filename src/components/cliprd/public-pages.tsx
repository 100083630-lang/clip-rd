import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatUsd } from "@/lib/cliprd/format";
import { TERMS_VERSION } from "@/lib/cliprd/labels";
import { INITIAL_RATES, WORKED_EXAMPLE, earningAmount, sumAmounts } from "@/lib/cliprd/money";
import { bootstrapProfile, getPublicHome } from "@/server/cliprd";
import { Authed, Shell } from "./chrome";
import { Logo } from "./logo";

const PROOF = WORKED_EXAMPLE.map((row) => ({ ...row, amount: earningAmount(row.views, row.rate) }));

export function HomePage() {
  const { user, isPending } = useCurrentUserState();
  const home = useQuery({ queryKey: ["home"], queryFn: () => getPublicHome() });
  const rates = home.data?.rates?.length
    ? home.data.rates
    : [
        { id: "tiktok", label: "TikTok", amount: INITIAL_RATES.tiktok },
        { id: "youtube_shorts", label: "YouTube Shorts", amount: INITIAL_RATES.youtube_shorts },
        { id: "youtube_video", label: "YouTube Videos", amount: INITIAL_RATES.youtube_video },
      ];
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem]" aria-hidden="true" />
      <header className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Logo size="sm" />
        <div className="flex gap-2 sm:shrink-0">
          {isPending ? <div className="h-11 w-28 rounded-md bg-surface" /> : null}
          {!isPending && !user ? (
            <Link to="/login" className="btn btn-primary">Panel de administración</Link>
          ) : null}
          {!isPending && user ? <Link to="/dashboard" className="btn btn-primary">Ir al panel</Link> : null}
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 pb-20">
        <section className="grid gap-10 py-10 md:grid-cols-[1.25fr_0.75fr] md:py-16">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-neon">AGENCIA ORIGEN SIMPLE</p>
            <h1 className="sr-only">CLIPRD</h1>
            <img src="/brand/cliprd-wordmark.png" alt="" className="mt-6 h-16 w-auto max-w-full md:h-28" />
            <p className="mt-6 max-w-xl text-2xl font-semibold tracking-tight">Convierte visualizaciones en dinero.</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Una agencia, dos plataformas, un solo libro. Los clippers registran TikTok y YouTube. La agencia aprueba, liquida solo las vistas nuevas y documenta cada transferencia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn btn-primary">Entrar al panel</Link>
              <Link to="/politicas" className="btn btn-ghost">Condiciones</Link>
            </div>
          </div>
          <aside className="card p-5">
            <p className="label">Tarifas activas</p>
            <ul className="mt-4 space-y-3">
              {rates.map((rate) => (
                <li key={rate.id} className="flex items-end justify-between gap-3 border-b border-border pb-3">
                  <span>{rate.label}</span>
                  <span className="stat-value text-xl text-neon">{formatUsd(rate.amount)}<span className="text-xs text-muted"> / mil</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">El administrador puede cambiarlas. Lo ya liquidado conserva la tarifa del momento.</p>
          </aside>
        </section>
        <section className="card p-5 md:p-8">
          <h2 className="text-2xl">Así se calcula, sin duplicar</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Ganancia = (vistas válidas nuevas / 1,000) × tarifa. Una sincronización posterior solo cobra la diferencia. Este ejemplo usa el motor real, no un número escrito a mano.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {PROOF.map((row) => (
              <article key={row.label} className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted">{row.label}</p>
                <p className="mt-2 stat-value text-2xl">{row.views.toLocaleString("es-DO")} vistas</p>
                <p className="mt-1 text-neon">{formatUsd(row.amount)}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-lg">Balance del ejemplo: <span className="text-neon">{formatUsd(sumAmounts(PROOF.map((row) => row.amount)))}</span></p>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["1. Publicas", "Pegas el enlace. CLIPRD valida TikTok o YouTube, rechaza duplicados y pide aprobación."],
            ["2. Se verifican", "YouTube Data API trae vistas cuando hay clave. Sin clave, no se inventan números."],
            ["3. Se paga", "El clipper pide un retiro. La agencia registra la transferencia manual del banco."],
          ].map(([title, text]) => (
            <article key={title} className="card p-5">
              <h3 className="text-xl">{title}</h3>
              <p className="mt-2 text-sm text-muted">{text}</p>
            </article>
          ))}
        </section>
        <footer className="mt-12 flex flex-wrap gap-4 text-sm text-muted">
          <Link to="/politicas" className="underline-offset-4 hover:underline">Condiciones y antifraude</Link>
          <span>Acumular vistas no garantiza un pago.</span>
        </footer>
      </main>
    </div>
  );
}

function authText(message: string | undefined, fallback: string) {
  return message || fallback;
}

const BEARER_KEY = "grok-auth.bearer-token";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (!isPending && user) return <Navigate to="/dashboard" />;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card w-full max-w-md p-6 md:p-8">
        <Logo slogan />
        <h1 className="mt-8 text-3xl">Administración</h1>
        <p className="mt-2 text-sm text-muted">
          Entras directo al panel de CLIPRD. No hay inicio con Google ni contraseña.
        </p>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <button
          className="btn btn-primary mt-6 w-full"
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true);
            setError("");
            void import("@/server/cliprd")
              .then((mod) => mod.enterAdmin())
              .then(async (result) => {
                if (result.token) {
                  try {
                    window.sessionStorage.setItem(BEARER_KEY, result.token);
                  } catch {
                    /* cookie session still applies when the browser allows it */
                  }
                }
                await navigate({ to: "/admin" });
                window.location.assign("/admin");
              })
              .catch((reason: unknown) => {
                setError(authText(reason instanceof Error ? reason.message : undefined, "No se pudo abrir el panel."));
                setPending(false);
              });
          }}
        >
          {pending ? "Abriendo panel…" : "Entrar al panel"}
        </button>
        <p className="mt-5 text-xs text-muted">
          Los clippers no crean cuenta aquí. La agencia los administra desde el panel.
        </p>
      </div>
    </main>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !isPending && Boolean(user),
    queryFn: () => import("@/server/cliprd").then((mod) => mod.getMyProfile()),
  });
  if (!isPending && user && profile.data) return <Navigate to="/dashboard" />;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card w-full max-w-md p-6 md:p-8">
        <Logo slogan />
        {isPending || (user && profile.isLoading) ? <p className="mt-8 text-sm text-muted">Cargando…</p> : null}
        {!isPending && !user ? (
          <div className="mt-8 space-y-4">
            <h1 className="text-3xl">Solo administración</h1>
            <p className="text-sm text-muted">Las cuentas públicas y el inicio con Google quedaron fuera. Entra al panel.</p>
            <Link to="/login" className="btn btn-primary w-full">Ir al panel</Link>
          </div>
        ) : null}
        {user && profile.data === null && !profile.isLoading ? (
          <Onboarding
            onDone={() => {
              void navigate({ to: "/dashboard" });
            }}
          />
        ) : null}
      </div>
    </main>
  );
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        void bootstrapProfile({ data: { displayName, phone, inviteCode, acceptTerms } })
          .then(() => onDone())
          .catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : "No se pudo crear el perfil");
            setPending(false);
          });
      }}
    >
      <h1 className="text-3xl">Tu ficha</h1>
      <p className="text-sm text-muted">Si nadie administra todavía, esta cuenta abre la agencia. Si ya hay administrador, entras como clipper.</p>
      <label className="field"><span className="label">Nombre en el ranking</span><input className="input" required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Sr. Melo" /></label>
      <label className="field"><span className="label">Teléfono</span><input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
      <label className="field"><span className="label">Invitación, si te la dieron</span><input className="input" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="CLIP-XXXXXX" /></label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 size-4" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
        <span>Acepto las <Link to="/politicas" className="underline">condiciones {TERMS_VERSION}</Link>. Sé que las vistas no garantizan el pago.</span>
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending || !acceptTerms}>{pending ? "Guardando…" : "Entrar a CLIPRD"}</button>
    </form>
  );
}

export function PoliciesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/"><Logo /></Link>
      <h1 className="mt-8 text-4xl">Condiciones de participación</h1>
      <p className="mt-2 text-sm text-muted">Versión {TERMS_VERSION}. Agencia Origen Simple.</p>
      <div className="mt-8 space-y-6 text-sm leading-6 text-muted">
        <section><h2 className="text-xl text-fg">Derechos de autor</h2><p>Solo se registra material cuyo uso y distribución hayan sido autorizados por sus titulares, incluido el contenido de Alofoke Radio Show y otras fuentes que la agencia declare. CLIPRD no concede esa autorización.</p></section>
        <section><h2 className="text-xl text-fg">Reglas de publicación</h2><p>Cada enlace se valida, se identifica y se compara con los ya registrados. Un video no puede pertenecer a dos cuentas. Los duplicados se rechazan.</p></section>
        <section><h2 className="text-xl text-fg">Aprobación</h2><p>Un clip nace pendiente. El administrador puede pasarlo a revisión, verificado, aprobado, rechazado, suspendido o liquidado. Sin aprobación no hay vistas válidas.</p></section>
        <section><h2 className="text-xl text-fg">Reproducciones válidas</h2><p>Las vistas públicas de YouTube solo cuentan como verificadas si llegan de YouTube Data API. TikTok, sin OAuth oficial, no aporta vistas verificadas. Un ajuste manual exige justificación y nunca se presenta como dato de la API. Cada sincronización suma solo las vistas nuevas.</p></section>
        <section><h2 className="text-xl text-fg">Liquidación</h2><p>La ganancia es (vistas válidas nuevas / 1,000) × la tarifa vigente en ese momento. Esa tarifa queda copiada en el movimiento. Cambiarla después no reescribe el pasado. El pago es una transferencia bancaria manual; el sistema solo la documenta.</p></section>
        <section><h2 className="text-xl text-fg">Antifraude</h2><p>Se marcan enlaces repetidos, videos caídos o privados, saltos anormales de vistas y registros sin evidencia. La agencia puede congelar vistas, rechazar un clip o suspender una cuenta. Acumular reproducciones no garantiza monetización ni un pago.</p></section>
      </div>
    </main>
  );
}

export function DashboardGate() {
  return (
    <Authed>
      {(profile) => <Navigate to={profile.role === "admin" ? "/admin" : "/clipper/dashboard"} />}
    </Authed>
  );
}

export function RankingPage() {
  return (
    <Authed>
      {(profile) => (
        <Shell profile={profile}>
          <RankingBody />
        </Shell>
      )}
    </Authed>
  );
}

function RankingBody() {
  const [platform, setPlatform] = useState<"all" | "tiktok" | "youtube_shorts" | "youtube_video">("all");
  const [period, setPeriod] = useState<"all" | "weekly" | "monthly">("all");
  const query = useQuery({
    queryKey: ["rank", platform, period],
    queryFn: () => import("@/server/cliprd").then((mod) => mod.getRanking({ data: { platform, period } })),
  });
  const rows = query.data?.ranking ?? [];
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold tracking-[0.16em] text-neon">COMPETENCIA</p>
        <h1 className="mt-1 text-4xl">Ranking</h1>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "tiktok", "youtube_shorts", "youtube_video"] as const).map((item) => (
          <button key={item} type="button" className={`btn ${platform === item ? "btn-primary" : "btn-ghost"}`} onClick={() => setPlatform(item)}>
            {item === "all" ? "General" : item === "tiktok" ? "TikTok" : item === "youtube_shorts" ? "Shorts" : "Videos"}
          </button>
        ))}
        {(["all", "weekly", "monthly"] as const).map((item) => (
          <button key={item} type="button" className={`btn ${period === item ? "btn-primary" : "btn-ghost"}`} onClick={() => setPeriod(item)}>
            {item === "all" ? "Histórico" : item === "weekly" ? "Semanal" : "Mensual"}
          </button>
        ))}
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted">Cuando haya clippers activos con movimientos, el ranking se llena solo.</p> : null}
      <ol className="space-y-3">
        {rows.map((row) => (
          <li key={row.userId} className={`card flex items-center gap-4 p-4 ${row.place <= 3 ? "border-neon/50" : ""}`}>
            <span className="stat-value w-8 text-2xl text-neon">{row.place}</span>
            <span className="grid size-11 place-items-center rounded-full bg-surface-2 font-bold">
              {row.avatarUrl ? <img src={row.avatarUrl} alt="" className="size-11 rounded-full object-cover" /> : row.displayName.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{row.displayName}</p>
              <p className="text-xs text-muted">{row.posts} publicaciones · mejor: {row.bestPlatform ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="stat-value">{formatUsd(row.earnings)}</p>
              <p className="text-xs text-muted">{row.views.toLocaleString("es-DO")} vistas</p>
            </div>
          </li>
        ))}
      </ol>
      {query.data?.prizes?.length ? (
        <div className="mt-8">
          <h2 className="text-xl">Premios configurados</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {query.data.prizes.filter((prize) => prize.active).map((prize) => (
              <li key={prize.id}>{prize.scope} · puesto {prize.place}: {prize.title} {prize.amount ? formatUsd(prize.amount) : ""}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function NotificationsPage() {
  return (
    <Authed>
      {(profile) => (
        <Shell profile={profile}>
          <Notes />
        </Shell>
      )}
    </Authed>
  );
}

function Notes() {
  const query = useQuery({ queryKey: ["notes"], queryFn: () => import("@/server/cliprd").then((mod) => mod.getNotifications()) });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-4xl">Avisos</h1>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            void import("@/server/cliprd").then((mod) => mod.markNotificationsRead()).then(() => query.refetch());
          }}
        >
          Marcar leídos
        </button>
      </div>
      <div className="space-y-3">
        {(query.data ?? []).length === 0 ? <p className="text-sm text-muted">No tienes avisos.</p> : null}
        {(query.data ?? []).map((note) => (
          <article key={note.id} className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg">{note.title}</h2>
              {!note.read_at ? <span className="text-xs font-bold text-neon">Nuevo</span> : null}
            </div>
            <p className="mt-1 text-sm text-muted">{note.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
