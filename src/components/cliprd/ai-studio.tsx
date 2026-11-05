import { useState } from "react";
import { toast } from "sonner";
import { generateClipIdeas } from "@/server/ai";
import { PageTitle, Shell } from "./chrome";
import type { Profile } from "@/lib/cliprd/types";

type Idea = { hook: string; title: string; angle: string; caption: string; hashtags: string[]; editingTips: string[]; whyItMayWork: string };

export function AIStudio({ profile }: { profile: Profile }) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "youtube_shorts" | "youtube_video">("tiktok");
  const [audience, setAudience] = useState("Público latino de 18 a 35 años");
  const [tone, setTone] = useState<"controversial" | "funny" | "informative" | "emotional" | "news">("controversial");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);

  async function create() {
    if (topic.trim().length < 3) { toast.error("Describe el tema o momento que quieres convertir en clip."); return; }
    setLoading(true);
    try {
      const result = await generateClipIdeas({ data: { topic, platform, audience, tone } });
      setIdeas(result.ideas as Idea[]);
      toast.success("Tres propuestas listas.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron generar las ideas.");
    } finally { setLoading(false); }
  }

  return <Shell profile={profile}>
    <PageTitle kicker="CLIPRD INTELLIGENCE" title="Estudio de IA" text="Convierte un tema, una noticia o un momento en propuestas de clips listas para producir. La IA propone; tú verificas el contexto y eliges qué publicar." />
    <section className="card relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-neon/10 blur-3xl" />
      <div className="relative grid gap-4 md:grid-cols-2">
        <label className="field md:col-span-2"><span className="label">¿Qué momento quieres convertir en clip?</span><textarea className="textarea min-h-32" maxLength={500} placeholder="Ej.: debate intenso sobre..., reacción inesperada de..., explicación de..." value={topic} onChange={e=>setTopic(e.target.value)} /></label>
        <label className="field"><span className="label">Plataforma</span><select className="select" value={platform} onChange={e=>setPlatform(e.target.value as typeof platform)}><option value="tiktok">TikTok</option><option value="youtube_shorts">YouTube Shorts</option><option value="youtube_video">YouTube video</option></select></label>
        <label className="field"><span className="label">Estilo editorial</span><select className="select" value={tone} onChange={e=>setTone(e.target.value as typeof tone)}><option value="controversial">Debate / polémica</option><option value="funny">Humor</option><option value="informative">Informativo</option><option value="emotional">Emocional</option><option value="news">Actualidad</option></select></label>
        <label className="field md:col-span-2"><span className="label">Audiencia</span><input className="input" value={audience} onChange={e=>setAudience(e.target.value)} maxLength={160} /></label>
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2"><p className="text-xs text-muted">3 ideas · ganchos · títulos · copies · hashtags · consejos de edición</p><button type="button" className="btn btn-primary" disabled={loading} onClick={()=>void create()}>{loading ? "Creando propuestas…" : "✦ Generar con IA"}</button></div>
      </div>
    </section>
    {ideas.length ? <div className="mt-7 space-y-4"><div><p className="text-xs font-bold tracking-widest text-neon">RESULTADOS</p><h2 className="mt-1 text-2xl">Tus próximas publicaciones</h2></div>{ideas.map((idea,index)=><article key={index} className="card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold tracking-widest text-neon">PROPUESTA 0{index+1}</span><button className="btn btn-ghost" type="button" onClick={()=>void navigator.clipboard.writeText([idea.hook,idea.title,idea.caption,(idea.hashtags??[]).join(" ")].join("\n\n")).then(()=>toast.success("Propuesta copiada." )).catch(()=>toast.error("No se pudo copiar."))}>Copiar propuesta</button></div><h3 className="mt-3 text-xl">{idea.title}</h3><p className="mt-3 rounded-xl border border-neon/25 bg-neon/5 p-3 text-lg font-semibold">“{idea.hook}”</p><p className="mt-3 text-sm text-muted">{idea.angle}</p><div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="label">Copy</p><p className="mt-1 text-sm">{idea.caption}</p></div><div><p className="label">Por qué puede funcionar</p><p className="mt-1 text-sm">{idea.whyItMayWork}</p></div></div><p className="mt-4 text-sm text-neon">{(idea.hashtags??[]).join(" ")}</p><div className="mt-4"><p className="label">Consejos de edición</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{(idea.editingTips??[]).map((tip,i)=><li key={i}>{tip}</li>)}</ul></div></article>)}</div>:<div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center"><p className="text-3xl">✦</p><h2 className="mt-2 text-lg">Tu próximo clip empieza aquí</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted">Describe el momento y la IA de CLIPRD preparará tres enfoques creativos para tu plataforma.</p></div>}
  </Shell>;
}
