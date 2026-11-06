import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  Bell,
  Clapperboard,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { ACCOUNT_STATUS, CLIP_STATUS, PAYOUT_STATUS, PLATFORM_LABEL } from "@/lib/cliprd/labels";
import type { Profile, ReportTable } from "@/lib/cliprd/types";
import { getMyProfile, getNotifications, markNotificationsRead } from "@/server/cliprd";
import { Logo } from "./logo";

const ADMIN_GROUPS = [
  {
    label: "Agencia",
    items: [
      { to: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
      { to: "/admin/clips", label: "Publicaciones", icon: Clapperboard },
      { to: "/admin/clippers", label: "Clippers", icon: Users },
      { to: "/admin/payments", label: "Pagos", icon: Wallet },
      { to: "/ranking", label: "Ranking", icon: Trophy },
      { to: "/admin/settings", label: "APIs", icon: Settings },
      { to: "/admin/rates", label: "Ajustes", icon: BadgeDollarSign },
    ],
  },
] as const;

const CLIPPER_GROUPS = [
  {
    label: "Mi trabajo",
    items: [
      { to: "/clipper/dashboard", label: "Panel", icon: LayoutDashboard, exact: true },
      { to: "/clipper/register-clip", label: "Registrar", icon: Plus },
      { to: "/clipper/my-clips", label: "Mis clips", icon: Clapperboard },
      { to: "/clipper/earnings", label: "Ganancias", icon: BadgeDollarSign },
      { to: "/ranking", label: "Ranking", icon: Trophy },
    ],
  },
  {
    label: "Ajustes",
    items: [
      { to: "/clipper/payments", label: "Pagos", icon: Wallet },
      { to: "/notifications", label: "Avisos", icon: Bell },
      { to: "/clipper/profile", label: "Perfil", icon: Users },
    ],
  },
] as const;

export function Boot() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="flex flex-col items-center gap-4">
        <Logo slogan />
        <p className="text-sm text-muted">Cargando tu sesión…</p>
      </div>
    </div>
  );
}

export function Authed({
  role,
  children,
}: {
  role?: "admin" | "clipper";
  children: (profile: Profile) => ReactNode;
}) {
  // Temporary read-only demo profile: UI routes stay viewable while auth is rebuilt.
  const profile: Profile = {
    userId: "demo-open-access",
    email: "demo@cliprd.local",
    displayName: "Vista pública",
    avatarUrl: null,
    role: role ?? "admin",
    status: "active",
    phone: null,
    agencyName: "CLIPRD",
    termsVersion: "demo",
  };
  return children(profile);
}

export function Shell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const groups = profile.role === "admin" ? ADMIN_GROUPS : CLIPPER_GROUPS;
  const notes = useQuery({
    queryKey: ["notes", profile.userId],
    queryFn: () => getNotifications(),
  });
  const unread = (notes.data ?? []).filter((note) => !note.read_at).length;
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="no-print sticky top-0 z-20 border-b border-border bg-surface md:h-screen md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to={profile.role === "admin" ? "/admin" : "/clipper/dashboard"}>
            <Logo size="sm" />
          </Link>
          <button type="button" className="btn btn-ghost h-11 w-11 px-0 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menú">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        <nav className={`${open ? "grid" : "hidden"} content-start px-3 pb-4 md:grid`}>
          {groups.map((group) => (
            <div key={group.label}>
              <p className="side-label">{group.label}</p>
              {group.items.map((item) => {
                const active = "exact" in item && item.exact ? path === item.to : path.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${active ? "nav-pill" : "text-muted hover:bg-bg hover:text-fg"}`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="hidden border-t border-border px-4 py-4 md:block">
          <p className="truncate text-sm font-semibold">{profile.displayName}</p>
          <p className="truncate text-xs text-muted">{profile.role === "admin" ? "Administración · Origen Simple" : profile.agencyName}</p>
          <button type="button" className="mt-3 text-sm text-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => void signOut()}>
            Salir
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="no-print flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-8">
          {profile.role === "admin" ? (
            <form
              className="min-w-0 flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                void navigate({ to: "/admin/clips", search: { q: query } });
              }}
            >
              <input className="search" placeholder="Buscar..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </form>
          ) : (
            <p className="text-xs font-bold tracking-[0.16em] text-muted">ORIGEN SIMPLE</p>
          )}
          <Link to="/notifications" className="btn btn-ghost relative h-11 shrink-0 px-3">
            <Bell className="size-4" />
            {unread > 0 ? <span className="absolute right-2 top-2 size-2 rounded-full bg-neon" /> : null}
          </Link>
        </header>
        <div className="px-4 py-6 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}

export function PageTitle({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold tracking-[0.16em] text-neon">{kicker}</p>
      <h1 className="mt-1 text-3xl md:text-4xl">{title}</h1>
      {text ? <p className="mt-2 max-w-2xl text-sm text-muted">{text}</p> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="card p-4">
      <p className="text-xs font-bold tracking-[0.12em] text-muted uppercase">{label}</p>
      <p className="stat-value mt-2 text-2xl md:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </article>
  );
}

export function Badge({ value, map }: { value: string; map: Record<string, string> }) {
  const tone =
    value === "approved" || value === "paid" || value === "active" || value === "verified" || value === "settled"
      ? "text-neon border-neon/40"
      : value === "rejected" || value === "suspended"
        ? "text-danger border-danger/40"
        : value === "in_review" || value === "processing" || value === "pending"
          ? "text-warn border-warn/40"
          : "text-muted border-border";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${tone}`}>{map[value] ?? value}</span>;
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge value={value} map={CLIP_STATUS} />;
}

export function PayBadge({ value }: { value: string }) {
  return <Badge value={value} map={PAYOUT_STATUS} />;
}

export function platformName(id: string | null): string {
  if (!id) return "Bonificación";
  return PLATFORM_LABEL[id] ?? id;
}

export function useRefresh() {
  const client = useQueryClient();
  return async () => {
    await client.invalidateQueries();
  };
}

export async function readNotes() {
  await markNotificationsRead();
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function toCsv(table: ReportTable): string {
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [table.columns, ...table.rows].map((row) => row.map(cell).join(",")).join("\n");
}

export function toExcel(table: ReportTable): string {
  const cell = (value: string) =>
    `<Cell><Data ss:Type="String">${value
      .replaceAll("&", "&")
      .replaceAll("<", "<")
      .replaceAll(">", ">")}</Data></Cell>`;
  const rows = [table.columns, ...table.rows].map((row) => `<Row>${row.map(cell).join("")}</Row>`).join("");
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="CLIPRD"><Table>${rows}</Table></Worksheet></Workbook>`;
}
