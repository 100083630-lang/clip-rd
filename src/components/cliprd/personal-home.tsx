import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clapperboard, Download, FolderOpen, Radio, Sparkles, Trash2, Video } from "lucide-react";
import { Logo } from "./logo";
import { clearClipLibrary, readClipLibrary, type ClipLibraryItem } from "./clip-library";

export function PersonalHome() {
  const [clips, setClips] = useState<ClipLibraryItem[]>([]);

  useEffect(() => {
    const refresh = () => setClips(readClipLibrary());
    refresh();
    window.addEventListener("cliprd-library-updated", refresh);
    return () => window.removeEventListener("cliprd-library-updated", refresh);
  }, []);

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
              <p className="mt-5 max-w-2xl text-lg text-muted">Una portada limpia para ver tus resultados. El trabajo pesado queda en el estudio: seleccionas una fuente autorizada y tu motor local procesa los clips en tu propia computadora.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/clipper/auto-clip" className="btn btn-primary"><Clapperboard className="size-4" /> Ir al panel de clipping</Link>
                <Link to="/clipper/auto-clip#live" className="btn btn-ghost"><Radio className="size-4" /> Abrir Live Monitor</Link>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between"><span className="label">ESTADO DEL ESTUDIO</span><span className="text-neon text-sm font-bold">PERSONAL</span></div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-surface-2 p-4"><Radio className="size-5 text-neon" /><p className="mt-3 font-bold">Live Monitor</p><p className="text-xs text-muted">Vista de fuentes Live compatibles.</p></div>
                <div className="rounded-2xl border border-border bg-surface-2 p-4"><Sparkles className="size-5 text-neon" /><p className="mt-3 font-bold">Auto selección</p><p className="text-xs text-muted">Actividad de audio + render local.</p></div>
              </div>
              <div className="mt-4 rounded-2xl border border-neon/20 bg-neon/5 p-4"><p className="text-3xl font-black text-neon">{clips.length}</p><p className="mt-1 text-sm text-muted">clips guardados en tu biblioteca</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="label">BIBLIOTECA</p><h2 className="mt-1 text-3xl font-black">Mis clips descargados</h2><p className="mt-2 text-sm text-muted">Los renders que genere el motor aparecen aquí en este navegador.</p></div>
          <div className="flex gap-2">
            {clips.length > 0 && <button className="btn btn-ghost" onClick={() => { clearClipLibrary(); setClips([]); }}><Trash2 className="size-4" /> Limpiar</button>}
            <Link to="/clipper/auto-clip" className="btn btn-primary"><Video className="size-4" /> Crear clips</Link>
          </div>
        </div>

        {clips.length === 0 ? (
          <div className="card mt-6 grid min-h-72 place-items-center p-8 text-center">
            <div><FolderOpen className="mx-auto size-12 text-neon" /><h3 className="mt-4 text-xl font-black">Tu biblioteca está lista</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted">Cuando generes clips reales desde el estudio, aparecerán aquí para abrirlos o descargarlos.</p><Link to="/clipper/auto-clip" className="btn btn-primary mt-5"><Sparkles className="size-4" /> Crear mi primer clip</Link></div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {clips.map((clip) => <article key={clip.id} className="card overflow-hidden">
              <div className="aspect-video bg-surface-2 grid place-items-center"><Video className="size-10 text-neon" /></div>
              <div className="p-4"><p className="font-bold">Clip {clip.index}</p><p className="mt-1 truncate text-xs text-muted">{clip.file.split("/").pop()}</p><a href={clip.url} target="_blank" rel="noreferrer" className="btn btn-primary mt-4 w-full"><Download className="size-4" /> Abrir / descargar</a></div>
            </article>)}
          </div>
        )}
      </section>
    </main>
  );
}
