import { useMemo, useState } from "react";
import { Sparkles, Scissors, Flame, Play, Upload, Clock, CheckCircle2 } from "lucide-react";
import { Shell, PageTitle } from "./chrome";
import type { Profile } from "@/lib/cliprd/types";

type Segment = { id: number; start: string; end: string; seconds: number; score: number; title: string; hook: string; reason: string };

const DEMO: Segment[] = [
  { id: 1, start: "00:02:14", end: "00:02:53", seconds: 39, score: 96, title: "La confesión que cambió todo", hook: "Nadie esperaba que dijera esto…", reason: "Hook fuerte + giro + frase completa" },
  { id: 2, start: "00:18:06", end: "00:18:42", seconds: 36, score: 93, title: "El momento más polémico", hook: "Aquí fue donde explotó la conversación", reason: "Conflicto + reacción + alta retención" },
  { id: 3, start: "00:31:20", end: "00:31:58", seconds: 38, score: 89, title: "La respuesta más directa", hook: "Te voy a decir algo que nadie quiere escuchar", reason: "Opinión contundente + cierre claro" },
];

function scoreText(text: string, index: number): number {
  const t = text.toLowerCase();
  let score = 62;
  if (/[!?¿¡]/.test(text)) score += 7;
  if (/nadie|nunca|siempre|verdad|pol[eé]mica|incre[ií]ble|secreto|nadie sabe|mira|escucha|atenci[oó]n/.test(t)) score += 10;
  if (/yo|t[uú]|me|mi|nosotros/.test(t)) score += 4;
  if (/pero|aunque|resulta|despu[eé]s|entonces|porque/.test(t)) score += 5;
  if (/d/.test(t)) score += 3;
  return Math.min(99, score + (index % 5));
}

function transcriptSegments(transcript: string): Segment[] {
  const chunks = transcript.split(/\n+/).map((x) => x.trim()).filter(Boolean);
  return chunks.slice(0, 12).map((line, i) => {
    const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*(.*)$/);
    const start = match ? match[1] : `00:${String(i * 20).padStart(2, "0")}`;
    const body = (match ? match[2] : line).slice(0, 240);
    const seconds = 28 + (body.length % 24);
    const endSeconds = i * 20 + seconds;
    const end = `00:${String(Math.floor(endSeconds / 60)).padStart(2, "0")}:${String(endSeconds % 60).padStart(2, "0")}`;
    const score = scoreText(body, i);
    return {
      id: i + 1,
      start,
      end,
      seconds,
      score,
      title: body.length > 58 ? body.slice(0, 58).replace(/[,.!?]$/, "") + "…" : body || "Momento detectado",
      hook: body || "Momento destacado por CLIPRD AI",
      reason: score >= 90 ? "Hook + emoción + idea completa" : score >= 80 ? "Buen contexto y potencial de retención" : "Momento válido para revisión",
    };
  }).sort((a,b) => b.score-a.score).slice(0, 6);
}

export function AutoClipStudio({ profile }: { profile: Profile }) {
  const [transcript, setTranscript] = useState("");
  const [clips, setClips] = useState<Segment[]>(DEMO);
  const [mode, setMode] = useState<"short" | "viral">("viral");
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<number[]>([1,2]);

  const average = useMemo(() => clips.length ? Math.round(clips.reduce((n,c)=>n+c.score,0)/clips.length) : 0, [clips]);

  function analyze() {
    setProcessing(true);
    window.setTimeout(() => {
      const result = transcript.trim() ? transcriptSegments(transcript) : DEMO;
      setClips(result);
      setSelected(result.slice(0, 3).map(x => x.id));
      setProcessing(false);
    }, 900);
  }

  function toggle(id:number) {
    setSelected(current => current.includes(id) ? current.filter(x=>x!==id) : [...current,id]);
  }

  return (
    <Shell profile={profile}>
      <PageTitle kicker="CLIPRD AI" title="Auto Clipper" text="Analiza una transcripción y prioriza automáticamente los momentos con mayor potencial. La selección final siempre queda bajo tu control." />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-neon/15 text-neon"><Sparkles className="size-5" /></span>
            <div><h2 className="text-xl">1. Analizar contenido</h2><p className="text-sm text-muted">Pega una transcripción con marcas de tiempo.</p></div>
          </div>
          <textarea className="textarea mt-4 min-h-64" value={transcript} onChange={(e)=>setTranscript(e.target.value)} placeholder={"00:02:14 Nadie esperaba que yo dijera esto...\n00:18:06 Aquí fue donde todo cambió...\n00:31:20 Te voy a decir una verdad..."} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={()=>setMode("viral")} className={`btn ${mode==="viral" ? "btn-primary" : "btn-ghost"}>🔥 Máximo potencial viral</button>
            <button type="button" onClick={()=>setMode("short")} className={`btn ${mode==="short" ? "btn-primary" : "btn-ghost"}>📱 Shorts 20–60 s</button>
          </div>
          <button type="button" onClick={analyze} disabled={processing} className="btn btn-primary mt-4 w-full">
            <Sparkles className="size-4" /> {processing ? "Analizando momentos..." : "Analizar y seleccionar los mejores clips"}
          </button>
          <p className="mt-3 text-xs text-muted">La siguiente fase para corte real requiere un video autorizado y un worker de renderizado (FFmpeg/servicio de video).</p>
        </section>

        <section className="card p-5">
          <h2 className="text-xl">Resumen del análisis</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <article className="rounded-2xl border border-border bg-surface-2 p-4"><p className="text-xs text-muted">Momentos detectados</p><p className="mt-1 text-3xl font-bold">{clips.length}</p></article>
            <article className="rounded-2xl border border-border bg-surface-2 p-4"><p className="text-xs text-muted">Score promedio</p><p className="mt-1 text-3xl font-bold text-neon">{average}/100</p></article>
            <article className="rounded-2xl border border-border bg-surface-2 p-4"><p className="text-xs text-muted">Seleccionados</p><p className="mt-1 text-3xl font-bold">{selected.length}</p></article>
            <article className="rounded-2xl border border-border bg-surface-2 p-4"><p className="text-xs text-muted">Formato</p><p className="mt-1 text-lg font-bold">9:16</p></article>
          </div>
          <div className="mt-5 rounded-2xl border border-neon/30 bg-neon/5 p-4 text-sm">
            <p className="font-semibold">Motor de decisión</p>
            <p className="mt-1 text-muted">Hook · emoción · conflicto · sorpresa · pregunta · claridad · duración · cierre.</p>
          </div>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-2xl">Mejores clips detectados</h2><p className="text-sm text-muted">CLIPRD ordena automáticamente por potencial.</p></div>
          <button className="btn btn-ghost" type="button"><Upload className="size-4" /> Preparar exportación ({selected.length})</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clips.map((clip, index) => {
            const on = selected.includes(clip.id);
            return <article key={clip.id} className={`card overflow-hidden transition ${on ? "border-neon/60" : ""}`}>
              <div className="relative aspect-[9/10] bg-surface-2 p-4">
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl bg-bg/80 px-3 py-2 backdrop-blur">
                  <Flame className="size-4 text-warn" /><span className="font-bold">{clip.score}/100</span>
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-neon/15 px-3 py-1 text-xs font-bold text-neon">#{index+1}</div>
                <div className="flex h-full flex-col justify-end">
                  <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-border bg-bg/70 px-2 py-1 text-xs text-muted"><Clock className="size-3" /> {clip.seconds}s</span>
                  <h3 className="max-w-[90%] text-2xl font-black leading-tight">{clip.title}</h3>
                </div>
                <button type="button" className="absolute inset-0 m-auto grid size-14 place-items-center rounded-full border border-white/20 bg-bg/70 backdrop-blur"><Play className="ml-1 size-5" /></button>
              </div>
              <div className="p-4">
                <p className="font-semibold">{clip.start} → {clip.end}</p>
                <p className="mt-2 text-sm text-muted">{clip.reason}</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={()=>toggle(clip.id)} className={`btn flex-1 ${on ? "btn-primary" : "btn-ghost"}`}>{on ? <><CheckCircle2 className="size-4" /> Seleccionado</> : <><Scissors className="size-4" /> Seleccionar</>}</button>
                  <button type="button" className="btn btn-ghost px-3" aria-label="Previsualizar"><Play className="size-4" /></button>
                </div>
              </div>
            </article>
          })}
        </div>
      </section>
    </Shell>
  );
}
