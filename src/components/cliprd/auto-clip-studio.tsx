import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Flame,
  Play,
  Scissors,
  Sparkles,
  Upload,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import { Shell, PageTitle } from "./chrome";
import type { Profile } from "@/lib/cliprd/types";

type Segment = {
  id: number;
  start: string;
  end: string;
  seconds: number;
  score: number;
  title: string;
  hook: string;
  reason: string;
  tags: string[];
};

type DurationMode = "short" | "viral" | "long";
type Aspect = "9:16" | "1:1" | "16:9";

const DEMO = [
  { id: 1, start: "00:02:14", end: "00:02:53", seconds: 39, score: 96, title: "La confesión que cambió todo", hook: "Nadie esperaba que dijera esto…", reason: "Hook fuerte + giro + idea completa", tags: ["Hook", "Sorpresa", "Cierre"] },
  { id: 2, start: "00:18:06", end: "00:18:42", seconds: 36, score: 93, title: "El momento más polémico", hook: "Aquí fue donde explotó la conversación", reason: "Conflicto + reacción + alta retención", tags: ["Polémica", "Emoción"] },
  { id: 3, start: "00:31:20", end: "00:31:58", seconds: 38, score: 89, title: "La respuesta más directa", hook: "Te voy a decir una verdad", reason: "Opinión contundente + cierre claro", tags: ["Opinión", "Hook"] },
] satisfies Segment[];

function secondsFromTimestamp(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
}

function timestampFromSeconds(total: number) {
  const value = Math.max(0, Math.floor(total));
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;
  return h > 0 ? [h, m, s].map((x) => String(x).padStart(2, "0")).join(":") : [m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

function scoreText(text: string, index: number, mode: DurationMode) {
  const value = text.toLowerCase();
  let score = 52;
  const tags: string[] = [];
  const add = (condition: boolean, points: number, tag: string) => {
    if (condition) {
      score += points;
      tags.push(tag);
    }
  };

  add(/[!?¿¡]/.test(text), 7, "Pregunta");
  add(/nadie|nunca|jam[aá]s|incre[ií]ble|secreto|verdad|revel|nadie sabe|atenci[oó]n/.test(value), 10, "Hook");
  add(/pol[eé]mica|problema|mentira|traici[oó]n|acusar|atacar|pelea|conflicto/.test(value), 11, "Conflicto");
  add(/pero|aunque|resulta|despu[eé]s|entonces|de repente|sin embargo/.test(value), 6, "Giro");
  add(/yo|t[uú]|me|nosotros/.test(value), 3, "Personal");
  add(/risa|llor|miedo|feliz|furia|sorprend|incre[ií]ble/.test(value), 7, "Emoción");
  add(/\d/.test(value), 3, "Dato");

  if (text.length >= 45 && text.length <= 220) score += 5;
  if (mode === "viral") score += 4;
  if (mode === "short") score += 2;
  score += index % 4;

  return { score: Math.min(99, score), tags: tags.slice(0, 4) };
}

function analyzeTranscript(transcript: string, mode: DurationMode) {
  const lines = transcript
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line, index) => {
      const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*(.*)$/);
      const start = match ? match[1] : timestampFromSeconds(index * 25);
      const body = (match ? match[2] : line).replace(/\s+/g, " ").slice(0, 280);
      const startSeconds = secondsFromTimestamp(start);
      const target = mode === "long" ? 90 : mode === "short" ? 28 : 42;
      const seconds = Math.max(15, Math.min(mode === "long" ? 180 : 60, target + ((body.length % 18) - 8)));
      const { score, tags } = scoreText(body, index, mode);

      return {
        id: index + 1,
        start: timestampFromSeconds(startSeconds),
        end: timestampFromSeconds(startSeconds + seconds),
        seconds,
        score,
        title: body.length > 64 ? body.slice(0, 64).replace(/[,.!?…]$/, "") + "…" : body || "Momento detectado",
        hook: body || "Momento destacado por CLIPRD AI",
        reason: tags.length ? tags.join(" + ") + " + contexto completo" : "Contexto claro y duración adecuada",
        tags,
      };
    })
    .filter((clip) => clip.hook.length > 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function AutoClipStudio({ profile }: { profile: Profile }) {
  const [transcript, setTranscript] = useState("");
  const [clips, setClips] = useState<Segment[]>(DEMO);
  const [mode, setMode] = useState<DurationMode>("viral");
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected] = useState<number[]>([1, 2]);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState(true);
  const [topN, setTopN] = useState(3);
  const fileInput = useRef<HTMLInputElement>(null);
  const transcriptInput = useRef<HTMLInputElement>(null);

  const average = useMemo(() => (clips.length ? Math.round(clips.reduce((sum, clip) => sum + clip.score, 0) / clips.length) : 0), [clips]);

  function analyze() {
    setProcessing(true);
    window.setTimeout(() => {
      const result = transcript.trim() ? analyzeTranscript(transcript, mode) : DEMO;
      setClips(result);
      setSelected(result.slice(0, Math.min(topN, result.length)).map((clip) => clip.id));
      setProcessing(false);
    }, 700);
  }

  function toggle(id: number) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function handleVideo(file: File | undefined) {
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoName(file.name);
    setVideoUrl(URL.createObjectURL(file));
  }

  function handleTranscript(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTranscript(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <Shell profile={profile}>
      <PageTitle
        kicker="CLIPRD AI STUDIO"
        title="Auto Clipper"
        text="Sube contenido que tengas derecho a procesar, analiza la transcripción y deja que CLIPRD priorice automáticamente los mejores momentos."
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-neon/15 text-neon"><Sparkles className="size-5" /></span>
            <div><h2 className="text-xl">1. Fuente del análisis</h2><p className="text-sm text-muted">Video para referencia visual + transcripción para detectar timestamps.</p></div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button type="button" onClick={() => fileInput.current?.click()} className="rounded-2xl border border-dashed border-border bg-surface-2 p-4 text-left hover:border-neon/50">
              <Video className="size-5 text-neon" />
              <p className="mt-2 font-bold">{videoName ?? "Cargar video autorizado"}</p>
              <p className="mt-1 text-xs text-muted">Vista previa local. No se publica automáticamente.</p>
            </button>
            <button type="button" onClick={() => transcriptInput.current?.click()} className="rounded-2xl border border-dashed border-border bg-surface-2 p-4 text-left hover:border-neon/50">
              <FileText className="size-5 text-neon" />
              <p className="mt-2 font-bold">Importar transcripción</p>
              <p className="mt-1 text-xs text-muted">TXT con timestamps o pega el contenido abajo.</p>
            </button>
          </div>

          <input ref={fileInput} type="file" accept="video/*" className="hidden" onChange={(event) => handleVideo(event.target.files?.[0])} />
          <input ref={transcriptInput} type="file" accept=".txt,text/plain" className="hidden" onChange={(event) => handleTranscript(event.target.files?.[0])} />

          {videoUrl ? (
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-black">
              <video src={videoUrl} controls className="max-h-[360px] w-full" />
              <button type="button" onClick={() => { URL.revokeObjectURL(videoUrl); setVideoUrl(null); setVideoName(null); }} className="btn btn-ghost absolute right-3 top-3 h-9 w-9 px-0" aria-label="Quitar video"><X className="size-4" /></button>
            </div>
          ) : null}

          <textarea
            className="textarea mt-4 min-h-56"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder={"00:02:14 Nadie esperaba que yo dijera esto...\n00:18:06 Aquí fue donde todo cambió...\n00:31:20 Te voy a decir una verdad..."}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {([
              ["viral", "🔥 Máximo potencial viral"],
              ["short", "📱 Shorts 20–60 s"],
              ["long", "🎬 Clips 60–180 s"],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setMode(value)} className={`btn ${mode === value ? "btn-primary" : "btn-ghost"}`}>{label}</button>
            ))}
          </div>

          <button type="button" onClick={analyze} disabled={processing} className="btn btn-primary mt-4 w-full">
            <WandSparkles className="size-4" /> {processing ? "Analizando momentos..." : "Analizar y seleccionar automáticamente"}
          </button>
        </section>

        <section className="card p-5">
          <h2 className="text-xl">2. Configuración inteligente</h2>
          <div className="mt-4 space-y-4">
            <label className="block"><span className="text-sm font-semibold">Mejores clips a seleccionar</span><input className="mt-2 w-full" type="range" min="1" max="6" value={topN} onChange={(event) => setTopN(Number(event.target.value))} /><p className="text-xs text-muted">Top {topN} automático</p></label>
            <div><p className="text-sm font-semibold">Formato de salida</p><div className="mt-2 flex flex-wrap gap-2">{(["9:16","1:1","16:9"] as Aspect[]).map((value) => <button key={value} type="button" onClick={() => setAspect(value)} className={`btn ${aspect === value ? "btn-primary" : "btn-ghost"}`}>{value}</button>)}</div></div>
            <label className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-3"><span><span className="block font-semibold">Subtítulos</span><span className="text-xs text-muted">Preparar el clip con captions</span></span><input type="checkbox" checked={captions} onChange={(event) => setCaptions(event.target.checked)} /></label>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <article className="rounded-2xl border border-border bg-surface-2 p-4"><p className="text-xs text-muted">Detectados</p><p className="mt-1 text-3xl font-bold">{clips.length}</p></article>
            <article className="rounded-2xl border border-border bg-surface-2 p-4"><p className="text-xs text-muted">Score promedio</p><p className="mt-1 text-3xl font-bold text-neon">{average}/100</p></article>
            <article className="rounded-2xl border border-border bg-surface-2 p-4"><p className="text-xs text-muted">Seleccionados</p><p className="mt-1 text-3xl font-bold">{selected.length}</p></article>
            <article className="rounded-2xl border border-border bg-surface-2 p-4"><p className="text-xs text-muted">Salida</p><p className="mt-1 text-xl font-bold">{aspect}</p></article>
          </div>

          <div className="mt-5 rounded-2xl border border-neon/30 bg-neon/5 p-4 text-sm">
            <p className="font-semibold">Motor de decisión</p>
            <p className="mt-1 text-muted">Hook · conflicto · emoción · sorpresa · giro · pregunta · claridad · duración · cierre.</p>
          </div>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-2xl">Mejores clips detectados</h2><p className="text-sm text-muted">Ordenados automáticamente por potencial de retención.</p></div>
          <button className="btn btn-primary" type="button" disabled={!selected.length}><Scissors className="size-4" /> Preparar render ({selected.length})</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clips.map((clip, index) => {
            const on = selected.includes(clip.id);
            return <article key={clip.id} className={`card overflow-hidden transition ${on ? "border-neon/60" : ""}`}>
              <div className="relative aspect-[9/10] bg-surface-2 p-4">
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl bg-bg/80 px-3 py-2 backdrop-blur"><Flame className="size-4 text-warn" /><span className="font-bold">{clip.score}/100</span></div>
                <div className="absolute right-3 top-3 rounded-full bg-neon/15 px-3 py-1 text-xs font-bold text-neon">#{index + 1}</div>
                <div className="flex h-full flex-col justify-end">
                  <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-border bg-bg/70 px-2 py-1 text-xs text-muted"><Clock className="size-3" /> {clip.seconds}s</span>
                  <h3 className="max-w-[90%] text-2xl font-black leading-tight">{clip.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-1">{clip.tags.map((tag) => <span key={tag} className="rounded-full border border-border bg-bg/60 px-2 py-1 text-[10px] text-muted">{tag}</span>)}</div>
                </div>
                <button type="button" className="absolute inset-0 m-auto grid size-14 place-items-center rounded-full border border-white/20 bg-bg/70 backdrop-blur" aria-label="Previsualizar"><Play className="ml-1 size-5" /></button>
              </div>
              <div className="p-4">
                <p className="font-semibold">{clip.start} → {clip.end}</p>
                <p className="mt-2 text-sm text-muted">{clip.reason}</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => toggle(clip.id)} className={`btn flex-1 ${on ? "btn-primary" : "btn-ghost"}`}>{on ? <><CheckCircle2 className="size-4" /> Seleccionado</> : <><Scissors className="size-4" /> Seleccionar</>}</button>
                  <button type="button" className="btn btn-ghost px-3" aria-label="Exportar configuración"><Download className="size-4" /></button>
                </div>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="card mt-6 p-5">
        <div className="flex items-start gap-3"><Upload className="mt-0.5 size-5 text-neon" /><div><h2 className="text-xl">Pipeline profesional de producción</h2><p className="mt-1 text-sm text-muted">Listo para la siguiente fase: almacenamiento seguro → cola de trabajos → renderizado FFmpeg → subtítulos → exportación. El procesamiento real de video debe ejecutarse en infraestructura de workers, no dentro del navegador.</p></div></div>
      </section>
    </Shell>
  );
}
