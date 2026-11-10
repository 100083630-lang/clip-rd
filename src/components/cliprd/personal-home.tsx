import { Link } from "@tanstack/react-router";
import { Clapperboard, Download, Radio, Sparkles, Video } from "lucide-react";
import { Logo } from "./logo";

export function PersonalHome() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,255,125,.16),transparent_32%),radial-gradient(circle_at_left,rgba(100,120,255,.10),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-10">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <Link to="/clipper/auto-clip" className="btn btn-primary"><Sparkles className="size-4" /> Abrir estudio</Link>
          </div>
          <div className="grid gap-10 py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <p className="label text-neon">TU ESTUDIO PERSONAL</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-tight md:text-7xl">CLIPRD <span className="text-neon">AUTO CLIP</span></h1>
              <p className="mt-5 max-w-2xl text-lg text-muted">Mira fuentes Live autorizadas, detecta momentos y genera clips desde tu propio motor local. La página principal queda limpia: producción cuando la necesitas, resultados al frente.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/clipper/auto-clip" className="btn btn-primary"><Clapperboard className="size-4" /> Ir al panel de clipping</Link>
                <Link to="/clipper/auto-clip#live" className="btn btn-ghost"><Radio className="size-4" /> Ver un Live</Link>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between"><span className="label">ESTADO DEL ESTUDIO</span><span className="text-neon text-sm font-bold">PERSONAL</span></div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-surface-2 p-4"><Radio className="size-5 text-neon" /><p className="mt-3 font-bold">Live Monitor</p><p className="text-xs text-muted">YouTube y fuentes compatibles para visualización.</p></div>
                <div className="rounded-2xl border border-border bg-surface-2 p-4"><Sparkles className="size-5 text-neon" /><p className="mt-3 font-bold">Auto selección</p><p className="text-xs text-muted">Detección basada en actividad de audio.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="label">BIBLIOTECA</p><h2 className="mt-1 text-3xl font-black">Mis clips descargados</h2><p className="mt-2 text-sm text-muted">Los nuevos renders aparecerán aquí cuando el motor local los devuelva al navegador.</p></div>
          <Link to="/clipper/auto-clip" className="btn btn-ghost"><Video className="size-4" /> Crear nuevos clips</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3].map((n) => <div key={n} className="card overflow-hidden">
            <div className="aspect-video bg-surface-2 grid place-items-center"><Clapperboard className="size-10 text-muted" /></div>
            <div className="p-4"><p className="font-bold">Clip {String(n).padStart(2,"0")}</p><p className="mt-1 text-xs text-muted">Tus renders reales aparecerán aquí.</p><button className="btn btn-ghost mt-4 w-full" disabled><Download className="size-4" /> Disponible tras generar</button></div>
          </div>)}
        </div>
      </section>
    </main>
  );
}
