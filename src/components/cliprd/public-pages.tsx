import { Link } from "@tanstack/react-router";
import {
  Bell, Clapperboard, FolderKanban, Gauge, Library, Menu, Search, Settings,
  Share2, Sparkles, TrendingUp, Video, Wand2, X, Zap
} from "lucide-react";
import { useState } from "react";

const clips = [
  { title: "80 policías me acosaron", score: 92, time: "01:10", tag: "Alta retención", img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80" },
  { title: "No vendas tu sueño aún", score: 94, time: "01:00", tag: "Idea clave", img: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=900&q=80" },
  { title: "Me llamo basura en público", score: 94, time: "02:30", tag: "Alta emoción", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80" },
  { title: "Archivo secreto: la verdad", score: 94, time: "00:48", tag: "Buen gancho", img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80" },
];

const nav = [
  ["Dashboard", "/dashboard", Gauge],
  ["Live", "/dashboard", Video],
  ["Proyectos", "/dashboard", FolderKanban],
  ["Videos IA", "/dashboard", Wand2],
  ["Biblioteca", "/dashboard", Library],
  ["Análisis", "/dashboard", TrendingUp],
  ["Publicar", "/dashboard", Share2],
];

function AppShell() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = clips.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[272px] border-r border-white/[.07] bg-[#10131c] px-3 py-5 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-8 flex items-center gap-3 px-3">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_30px_rgba(139,92,246,.35)]"><Clapperboard className="size-5 text-white" /></div>
          <div><div className="text-xl font-black tracking-tight">CLIP<span className="text-violet-400">RD</span></div><div className="text-[10px] font-bold tracking-[.22em] text-slate-500">CREATOR OS</div></div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}><X /></button>
        </div>

        <nav className="space-y-1">
          {nav.map(([label, to, Icon], index) => (
            <Link key={label} to={to as "/dashboard"} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${index === 0 ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-950/30" : "text-slate-400 hover:bg-white/[.05] hover:text-white"}`}>
              <Icon className="size-[18px]" />{label}
            </Link>
          ))}
        </nav>

        <div className="mt-7 px-4 text-[10px] font-black tracking-[.2em] text-slate-600">AJUSTES</div>
        <div className="mt-3 space-y-1">
          {["Revisar usuarios", "Usuarios", "Avisos", "Configuración", "APIs", "Motor Turbo"].map((item, i) => (
            <button key={item} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-slate-500 hover:bg-white/[.04] hover:text-slate-200">
              {i === 3 ? <Settings className="size-[17px]" /> : <Zap className="size-[17px]" />}{item}
            </button>
          ))}
        </div>

        <div className="absolute inset-x-3 bottom-4 rounded-2xl border border-white/[.07] bg-white/[.035] p-3">
          <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 font-black">J</div><div className="min-w-0"><div className="truncate text-sm font-bold">Administrador</div><div className="truncate text-xs text-slate-500">CLIPRD Studio</div></div></div>
        </div>
      </aside>

      {open && <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" />}

      <main className="min-h-screen lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-white/[.07] bg-[#090b12]/90 px-5 backdrop-blur-xl lg:px-9">
          <button className="rounded-xl border border-white/[.08] p-2 text-slate-400 lg:hidden" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar clips, proyectos o creadores..." className="h-12 w-full rounded-2xl border border-white/[.08] bg-[#141823] pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/10" />
          </div>
          <button className="relative grid size-11 place-items-center rounded-xl border border-white/[.08] bg-white/[.025] text-slate-300"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-fuchsia-500 ring-2 ring-[#090b12]" /></button>
          <div className="hidden text-right sm:block"><div className="text-sm font-bold">CLIPRD</div><div className="text-xs text-emerald-400">● Sistema activo</div></div>
        </header>

        <div className="mx-auto max-w-[1600px] px-5 py-8 lg:px-9">
          <section className="mb-8 overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-br from-violet-950/40 via-[#151222] to-[#0b1522] p-6 shadow-2xl shadow-black/20 md:p-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div><div className="mb-2 flex items-center gap-2 text-xs font-black tracking-[.18em] text-violet-300"><Sparkles className="size-4" /> CLIPRD INTELLIGENT STUDIO</div><h1 className="text-3xl font-black tracking-tight md:text-4xl">Tu centro de control para contenido viral.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Analiza, organiza y prepara clips para publicar desde una sola experiencia moderna.</p></div>
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5"><PlusIcon /> Nuevo proyecto</button>
            </div>
          </section>

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="CLIPS ACTIVOS" value="24" trend="+12% esta semana" />
            <Metric label="VISTAS TOTALES" value="2.8M" trend="+18.4% rendimiento" />
            <Metric label="PUNTAJE PROMEDIO" value="91/100" trend="Excelente potencial viral" />
            <Metric label="PUBLICACIONES" value="18" trend="6 listas para exportar" />
          </section>

          <section className="flex items-end justify-between gap-4">
            <div><h2 className="text-2xl font-black">Clips recientes</h2><p className="mt-1 text-sm text-slate-500">Tu biblioteca inteligente de contenido.</p></div>
            <button className="rounded-xl border border-white/[.08] px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/[.04]">Ver todos</button>
          </section>

          <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((clip) => <ClipCard key={clip.title} {...clip} />)}
          </section>

          <section className="mt-9 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-3xl border border-white/[.07] bg-[#11141e] p-6">
              <div className="flex items-center justify-between"><div><h3 className="text-lg font-black">Rendimiento del contenido</h3><p className="mt-1 text-sm text-slate-500">Actividad de los últimos 7 días</p></div><TrendingUp className="size-6 text-emerald-400" /></div>
              <div className="mt-8 flex h-48 items-end gap-3">
                {[38, 62, 48, 86, 58, 92, 74, 100, 81, 66, 94, 78].map((h,i)=><div key={i} className="flex-1 rounded-t-xl bg-gradient-to-t from-violet-700 via-fuchsia-500 to-cyan-300 opacity-90" style={{height:`${h}%`}} />)}
              </div>
            </div>
            <div className="rounded-3xl border border-white/[.07] bg-[#11141e] p-6">
              <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-400"><Zap /></div><div><h3 className="font-black">Motor Turbo</h3><p className="text-xs text-slate-500">Procesamiento inteligente</p></div></div>
              <div className="mt-7 space-y-4">{[["Analizando tendencias","92%"],["Detectando momentos","84%"],["Generando recomendaciones","100%"]].map(([a,b])=><div key={a}><div className="mb-2 flex justify-between text-sm"><span>{a}</span><span className="font-bold text-violet-300">{b}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{width:b}} /></div></div>)}</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Metric({label,value,trend}:{label:string;value:string;trend:string}){return <article className="rounded-2xl border border-white/[.07] bg-[#11141e] p-5 shadow-xl shadow-black/10"><p className="text-[11px] font-black tracking-[.16em] text-slate-500">{label}</p><div className="mt-3 text-3xl font-black">{value}</div><p className="mt-2 text-xs font-semibold text-emerald-400">{trend}</p></article>}
function ClipCard({title,score,time,tag,img}:{title:string;score:number;time:string;tag:string;img:string}){return <article className="group overflow-hidden rounded-3xl border border-white/[.08] bg-[#12151f] transition hover:-translate-y-1 hover:border-violet-400/35 hover:shadow-2xl hover:shadow-violet-950/20"><div className="relative aspect-[9/12] overflow-hidden bg-slate-900"><img src={img} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute left-3 top-3 rounded-lg bg-[#07111f]/85 px-2.5 py-1 text-xs font-black text-emerald-300 backdrop-blur">🔥 {score}/100</div><div className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold">{time}</div></div><div className="p-4"><h3 className="line-clamp-2 min-h-11 font-black leading-5">{title}</h3><span className="mt-3 inline-flex rounded-lg bg-white/[.06] px-2 py-1 text-[11px] font-bold text-slate-400">{tag}</span><div className="mt-4 grid grid-cols-2 gap-2"><button className="rounded-xl border border-white/[.08] py-2.5 text-sm font-bold text-slate-300 hover:bg-white/[.05]">✂ Editar</button><button className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-2.5 text-sm font-black text-white">Exportar</button></div></div></article>}
function PlusIcon(){return <span className="text-xl leading-none">＋</span>}

export function HomePage(){return <AppShell />}
export const PublicHomePage=HomePage;
export function DashboardGate(){return <AppShell />}
export function LoginPage(){return <AppShell />}
export function RegisterPage(){return <AppShell />}
export function NotificationsPage(){return <AppShell />}
export function PoliciesPage(){return <AppShell />}
export function RankingPage(){return <AppShell />}
