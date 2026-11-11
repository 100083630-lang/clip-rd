import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, Bot, Check, ChevronRight, CircleDot, Clock3, FileText, Flame,
  MonitorPlay, Pause, Play, Radio, Scissors, Sparkles, Video,
  WandSparkles, Zap,
} from "lucide-react";
import { Shell, PageTitle } from "./chrome";
import { Link } from "@tanstack/react-router";
import { addClipLibrary } from "./clip-library";
import type { Profile } from "@/lib/cliprd/types";

type Segment = {
  id: number; start: string; end: string; seconds: number; score: number;
  title: string; reason: string; tags: string[];
};
type Mode = "studio" | "live";
type DurationMode = "short" | "viral" | "long";

const demo: Segment[] = [
  { id: 1, start: "00:42:18", end: "00:43:01", seconds: 43, score: 97, title: "La confesión que nadie esperaba", reason: "Hook fuerte + sorpresa + contexto completo", tags: ["Hook", "Sorpresa", "Alta retención"] },
  { id: 2, start: "01:18:06", end: "01:18:49", seconds: 43, score: 94, title: "Aquí fue donde explotó la conversación", reason: "Conflicto + reacción + frase contundente", tags: ["Polémica", "Emoción"] },
  { id: 3, start: "00:31:20", end: "00:31:58", seconds: 38, score: 91, title: "Te voy a decir una verdad", reason: "Opinión directa + cierre claro", tags: ["Opinión", "Hook"] },
];

function stamp(n: number) {
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function toSeconds(value: string) {
  const parts = value.split(":").map(Number);
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
}

function scoreLine(text: string, index: number, mode: DurationMode): Segment {
  const t = text.toLowerCase();
  const tags: string[] = [];
  let score = 56;
  const add = (test: boolean, points: number, tag: string) => { if (test) { score += points; tags.push(tag); } };
  add(/[!?¿¡]/.test(text), 7, "Pregunta");
  add(/nadie|secreto|verdad|revel|incre[ií]ble|atenci[oó]n/.test(t), 12, "Hook");
  add(/pol[eé]mica|pelea|mentira|atac|acusar|problema/.test(t), 14, "Conflicto");
  add(/pero|aunque|resulta|sin embargo|de repente/.test(t), 8, "Giro");
  add(/risa|llor|miedo|furia|sorprend/.test(t), 9, "Emoción");
  if (mode === "viral") score += 4;
  if (mode === "short") score += 2;
  const seconds = mode === "long" ? 92 : mode === "short" ? 32 : 44;
  const start = index * (mode === "long" ? 100 : 55) + 12;
  return {
    id: index + 1, start: stamp(start), end: stamp(start + seconds), seconds,
    score: Math.min(99, score + (index % 3)),
    title: text.length > 58 ? text.slice(0, 58).replace(/[,.!?]$/, "") + "…" : text,
    reason: tags.length ? tags.join(" + ") + " + contexto completo" : "Claridad + duración óptima",
    tags: tags.slice(0, 4),
  };
}

function liveEmbedUrl(value: string) {
  try {
    const u = new URL(value.trim());
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      let id = "";
      if (u.hostname === "youtu.be") id = u.pathname.split("/").filter(Boolean)[0] || "";
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] || "";
      else id = u.searchParams.get("v") || "";
      return id ? "https://www.youtube.com/embed/" + encodeURIComponent(id) + "?autoplay=1&mute=1&playsinline=1" : "";
    }
    return "";
  } catch { return ""; }
}

function analyze(text: string, mode: DurationMode) {
  const lines = text.split("\n").map((x) => x.trim()).filter((x) => x.length > 8);
  if (!lines.length) return demo;
  return lines
    .map((line, i) => scoreLine(line.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*[-–—]?\s*/, ""), i, mode))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function AutoClipStudio({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Mode>("studio");
  const [duration, setDuration] = useState<DurationMode>("viral");
  const [transcript, setTranscript] = useState("");
  const [clips, setClips] = useState<Segment[]>(demo);
  const [selected, setSelected] = useState<number[]>([1, 2]);
  const [processing, setProcessing] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState("Pipeline listo para recibir trabajos.");
  const [topN, setTopN] = useState(3);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<"checking" | "online" | "offline">("checking");
  const [agentOrigin] = useState("http://127.0.0.1:3847");
  const [liveUrl, setLiveUrl] = useState("");
  const [liveOn, setLiveOn] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [events, setEvents] = useState<string[]>(["Motor listo. Esperando fuente autorizada."]);
  const [outputs, setOutputs] = useState<{ url: string; file: string; index: number }[]>([]);
  const videoInput = useRef<HTMLInputElement>(null);
  const transcriptInput = useRef<HTMLInputElement>(null);

  const avg = useMemo(() => clips.length ? Math.round(clips.reduce((s, c) => s + c.score, 0) / clips.length) : 0, [clips]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const response = await fetch(agentOrigin + "/health", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Agent offline");
        const raw = await response.text();
        let data: { ok?: boolean } | null = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error("Invalid agent response");
        }
        if (!data?.ok) throw new Error("Agent offline");
        if (active) setAgentStatus("online");
      } catch {
        if (active) setAgentStatus("offline");
      }
    };
    check();
    const timer = window.setInterval(check, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [agentOrigin]);

  useEffect(() => {
    if (!liveOn) return;
    const timer = window.setInterval(() => setLiveSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [liveOn]);


  async function sendToPipeline(items: Segment[]) {
    const selectedItems = items.filter((x) => selected.includes(x.id));
    if (!sourceUrl.trim()) {
      setPipelineMessage("Pega una URL de YouTube u otra fuente autorizada antes de renderizar.");
      return;
    }
    if (agentStatus !== "online") {
      setPipelineMessage("CLIPRD Local Agent no está activo. Ejecuta npm start dentro de cliprd-agent y vuelve a intentar.");
      return;
    }
    setUploading(true);
    setPipelineMessage("Enviando selección al motor local...");
    try {
      const response = await fetch(agentOrigin + "/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: sourceUrl.trim(),
          clips: selectedItems.map((clip) => ({
            start: toSeconds(clip.start),
            end: toSeconds(clip.end),
          })),
        }),
      });
      const raw = await response.text();
      let data: any;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        const preview = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
        throw new Error("CLIPRD Local Agent devolvió una respuesta no válida" + (preview ? ": " + preview : "") + ". Verifica que http://127.0.0.1:3847/health muestre JSON y reinicia el agente.");
      }
      if (!response.ok) throw new Error(data.error || "El motor local no pudo generar los clips");
      const count = Array.isArray(data.outputs) ? data.outputs.length : 0;
      if (Array.isArray(data.outputs)) { setOutputs(data.outputs); addClipLibrary(data.outputs); }
      setPipelineMessage("✓ " + count + " clip(s) generados. Se guardaron en CLIPRD-Clips en tu computadora.");
      setEvents((current) => ["Render local completado · " + count + " clips", ...current].slice(0, 6));
      if (data.outputs?.[0]?.url) window.open(data.outputs[0].url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setPipelineMessage(error instanceof Error ? error.message : "Error al conectar con CLIPRD Local Agent");
    } finally {
      setUploading(false);
    }
  }

  async function runAutoClips() {
    if (!sourceUrl.trim()) { setPipelineMessage("Pega una URL autorizada antes de iniciar la selección automática."); return; }
    if (agentStatus !== "online") { setPipelineMessage("El motor local no está conectado."); return; }
    setUploading(true); setPipelineMessage("Analizando audio y buscando zonas activas...");
    try {
      const seconds = duration === "long" ? 90 : duration === "short" ? 30 : 45;
      const response = await fetch(agentOrigin + "/auto-clips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrl: sourceUrl.trim(), clipLength: seconds, maxClips: topN }), });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo completar el análisis automático");
      const generated: Segment[] = (data.clips || []).map((x: any, i: number) => ({ id: Date.now()+i, start: stamp(Math.round(x.start)), end: stamp(Math.round(x.end)), seconds: Math.round(x.end-x.start), score: 90-i, title: "Momento detectado automáticamente", reason: "Zona activa de audio", tags: ["AUTO","AUDIO"] }));
      setClips(generated); setSelected(generated.map(x=>x.id)); setOutputs(data.outputs || []); if (Array.isArray(data.outputs)) addClipLibrary(data.outputs); setPipelineMessage("✓ Selección automática terminada: " + generated.length + " clips reales generados.");
    } catch (error) { setPipelineMessage(error instanceof Error ? error.message : "Error en la selección automática"); } finally { setUploading(false); }
  }

  function runAnalysis() {
    setProcessing(true);
    window.setTimeout(() => {
      const result = analyze(transcript, duration);
      setClips(result);
      setSelected(result.slice(0, topN).map((x) => x.id));
      setProcessing(false);
    }, 850);
  }

  async function loadVideo(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setPipelineMessage("Selecciona un archivo de video valido."); return; }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoName(file.name);
    setVideoUrl(URL.createObjectURL(file));
    setSourceUrl("");
    setUploading(true);
    setPipelineMessage("Subiendo video al almacenamiento seguro...");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/pipeline/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo subir el video");
      setSourceUrl(data.sourceUrl);
      setPipelineMessage("Video listo para procesamiento real.");
    } catch (error) {
      setPipelineMessage(error instanceof Error ? error.message : "Error al subir el video");
    } finally { setUploading(false); }
  }

  function loadTranscript(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTranscript(String(reader.result || ""));
    reader.readAsText(file);
  }

  return (
    <Shell profile={profile}>
      <PageTitle kicker="CLIPRD · INTELLIGENCE ENGINE" title="AI Clipping Command Center" text="Una interfaz de producción para analizar videos y supervisar fuentes Live autorizadas." />

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="card overflow-hidden p-1">
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setTab("studio")} className={`btn flex-1 ${tab === "studio" ? "btn-primary" : "btn-ghost"}`}><WandSparkles className="size-4" /> AI Studio</button>
            <button onClick={() => setTab("live")} className={`btn flex-1 ${tab === "live" ? "btn-primary" : "btn-ghost"}`}><Radio className="size-4" /> Live Monitor</button>
          </div>
        </div>
        <div className="card flex items-center gap-3 px-4 py-3 text-sm">
          <span className={`size-2 rounded-full ${liveOn ? "bg-neon animate-pulse" : "bg-muted"}`} />
          <span className="font-semibold">{liveOn ? "ENGINE ACTIVE" : "ENGINE STANDBY"}</span>
        </div>
      </div>

      {tab === "studio" ? (
        <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <section className="card overflow-hidden">
            <div className="border-b border-border bg-surface-2/60 p-5">
              <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-neon/15 text-neon"><Bot className="size-5" /></span><div><h2 className="text-xl font-black">1. Alimenta el motor</h2><p className="text-sm text-muted">Video local para referencia y texto para detección inteligente.</p></div></div>
            </div>
            <div className="p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <button onClick={() => videoInput.current?.click()} className="rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-left transition hover:border-neon/60 hover:bg-neon/5"><Video className="size-6 text-neon" /><p className="mt-3 font-bold">{videoName || "Cargar video autorizado"}</p><p className="mt-1 text-xs text-muted">MP4, MOV, WebM · vista previa local</p></button>
                <button onClick={() => transcriptInput.current?.click()} className="rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-left transition hover:border-neon/60 hover:bg-neon/5"><FileText className="size-6 text-neon" /><p className="mt-3 font-bold">Importar transcripción</p><p className="mt-1 text-xs text-muted">TXT con timestamps o texto normal</p></button>
              </div>
              <input ref={videoInput} className="hidden" type="file" accept="video/*" onChange={(e) => loadVideo(e.target.files?.[0])} />
              <input ref={transcriptInput} className="hidden" type="file" accept=".txt,text/plain" onChange={(e) => loadTranscript(e.target.files?.[0])} />
              {videoUrl && <video src={videoUrl} controls className="mt-4 max-h-[420px] w-full rounded-2xl border border-border bg-black" />}
              <textarea className="textarea mt-4 min-h-52" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Pega la transcripcion aqui. Ejemplo: Nadie esperaba que yo dijera esto." />
              <div className="mt-3 flex flex-wrap gap-2">
                {([["viral", "🔥 Máximo potencial"], ["short", "📱 Shorts 20–60s"], ["long", "🎬 Clips 60–180s"]] as const).map(([v, label]) => <button key={v} onClick={() => setDuration(v)} className={`btn ${duration === v ? "btn-primary" : "btn-ghost"}`}>{label}</button>)}
              </div>
              <button onClick={runAnalysis} disabled={processing} className="btn btn-primary mt-4 w-full"><Sparkles className="size-4" />{processing ? "Analizando señales…" : "Analizar transcripción"}</button>
              <label className="field mt-4 block">
                <span className="label">URL DE VIDEO AUTORIZADO</span>
                <input className="input mt-2" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              </label>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs">
                <span>CLIPRD Local Agent</span>
                <span className={agentStatus === "online" ? "text-neon font-bold" : agentStatus === "checking" ? "text-warn" : "text-danger"}>
                  {agentStatus === "online" ? "● CONECTADO" : agentStatus === "checking" ? "● COMPROBANDO" : "● DESCONECTADO"}
                </span>
              </div>
              <button onClick={runAutoClips} disabled={!sourceUrl.trim() || uploading || agentStatus !== "online"} className="btn btn-primary mt-3 w-full"><Sparkles className="size-4" /> {uploading ? "Analizando y generando..." : "Auto-generar mejores clips"}</button>
              <button onClick={() => sendToPipeline(clips)} disabled={!selected.length || !sourceUrl.trim() || uploading || agentStatus !== "online"} className="btn btn-ghost mt-3 w-full">
                <Scissors className="size-4" /> {uploading ? "Generando clips reales..." : "Generar clips en mi computadora"}
              </button>
              <p className="mt-2 text-xs text-muted">{pipelineMessage}</p>
              {agentStatus === "offline" && <p className="mt-1 text-xs text-danger">Inicia el agente con <code>npm start</code> dentro de <code>cliprd-agent</code>.</p>}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="card p-5"><div className="flex items-center justify-between"><div><p className="label">TOP AUTO-SELECTION</p><p className="mt-1 text-4xl font-black">{topN}</p></div><Zap className="size-9 text-neon" /></div><input className="mt-5 w-full" type="range" min="1" max="6" value={topN} onChange={(e) => setTopN(Number(e.target.value))} /><p className="mt-2 text-xs text-muted">CLIPRD marca automáticamente los {topN} mejores.</p></section>
            <section className="card p-5"><p className="label">AI SIGNALS</p><div className="mt-4 space-y-3 text-sm">{["Hook y curiosidad","Emoción y energía","Conflicto y polémica","Giros de conversación","Duración y contexto"].map((x, i) => <div key={x} className="flex items-center justify-between"><span>{x}</span><span className="text-neon">{[96, 91, 88, 84, 93][i]}%</span></div>)}</div></section>
            <section className="card p-5"><p className="label">OUTPUT PIPELINE</p><div className="mt-4 space-y-3 text-sm"><Step n="01" text="Detectar momento" /><Step n="02" text="Puntuar potencial" /><Step n="03" text="Preparar render" /><Step n="04" text="Exportar / publicar" /></div></section>
          </aside>
        </div>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
              <div><div className="flex items-center gap-2"><CircleDot className={`size-5 ${liveOn ? "text-danger" : "text-muted"}`} /><h2 className="text-xl font-black">Live Intelligence Monitor</h2></div><p className="mt-1 text-sm text-muted">Conecta una fuente que controles o tengas autorización para procesar.</p></div>
              <button onClick={() => { if (!liveOn && !liveEmbedUrl(liveUrl)) { setEvents(["Introduce una URL de YouTube válida para verla en el monitor."]); return; } setLiveOn((v) => !v); setEvents((current) => [!liveOn ? "Monitor iniciado · reproducción real en pantalla" : "Monitor detenido", ...current].slice(0, 6)); }} className={`btn ${liveOn ? "btn-danger" : "btn-primary"}`}>{liveOn ? <><Pause className="size-4" /> Detener motor</> : <><Play className="size-4" /> Iniciar monitor</>}</button>
            </div>
            <div className="p-5">
              <label className="field"><span className="label">YOUTUBE LIVE</span><input className="input" value={liveUrl} onChange={(e) => { setLiveUrl(e.target.value); setLiveOn(false); setLiveSeconds(0); }} placeholder="https://www.youtube.com/watch?v=... (en directo)" /><p className="mt-2 text-xs text-muted">Por ahora el monitor visual admite enlaces de YouTube. No se simulan detecciones: los eventos solo provienen del procesamiento real.</p></label>
              <div className="mt-4 aspect-video overflow-hidden rounded-2xl border border-border bg-black">
                {liveOn && liveEmbedUrl(liveUrl) ? (
                  <iframe title="CLIPRD Live Monitor" src={liveEmbedUrl(liveUrl)} className="h-full w-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : (
                  <div className="flex h-full flex-col justify-between p-6 bg-[radial-gradient(circle_at_center,rgba(46,255,125,.12),transparent_55%)]">
                    <div className="flex justify-between"><span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-black text-muted">● MONITOR LISTO</span><span className="font-mono text-sm text-muted">{stamp(liveSeconds)}</span></div>
                    <div><MonitorPlay className="mb-3 size-10 text-neon" /><h3 className="text-3xl font-black">Pega un enlace de YouTube Live.</h3><p className="mt-2 max-w-xl text-sm text-muted">Al iniciar, CLIPRD muestra la transmisión real en este panel. La detección automática de clips requiere que el motor local capture y analice la fuente autorizada.</p></div>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric icon={<Flame className="size-4" />} label="Momentos" value={String(clips.length)} /><Metric icon={<Activity className="size-4" />} label="Score medio" value={`${avg}/100`} /><Metric icon={<Scissors className="size-4" />} label="En cola" value={String(selected.length)} /></div>
            </div>
          </div>
          <aside className="card p-5"><p className="label">EVENT STREAM</p><div className="mt-4 space-y-3">{events.map((e, i) => <div key={i} className="rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted">{e}</div>)}</div></aside>
        </section>
      )}

      <section className="mt-6">
        {outputs.length > 0 && <div className="card mb-6 p-5"><div className="flex items-center justify-between gap-3"><div><p className="label">RENDERS RECIENTES</p><h2 className="mt-1 text-2xl font-black">Clips listos</h2></div><Link to="/" className="btn btn-ghost">Ver portada</Link></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{outputs.map((o) => <a key={o.url} href={o.url} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface-2 p-4 hover:border-neon/60"><Video className="size-6 text-neon" /><p className="mt-3 font-bold">Clip {o.index}</p><p className="mt-1 text-xs text-muted">Abrir / descargar</p></a>)}</div></div>}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="label">RANKING INTELIGENTE</p><h2 className="mt-1 text-2xl font-black">Momentos con mayor potencial</h2></div><div className="flex items-center gap-2 text-sm text-muted"><Clock3 className="size-4" /> Score actualizado</div></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clips.map((clip, i) => {
            const on = selected.includes(clip.id);
            return <article key={clip.id} className={`card overflow-hidden transition hover:-translate-y-0.5 ${on ? "border-neon/60" : ""}`}>
              <div className="relative aspect-[16/10] bg-surface-2 p-4">
                <div className="flex justify-between"><span className="rounded-xl bg-bg/80 px-3 py-2 text-sm font-black"><Flame className="mr-1 inline size-4 text-warn" />{clip.score}/100</span><span className="rounded-full bg-neon/15 px-3 py-1 text-xs font-bold text-neon">#{i + 1}</span></div>
                <div className="absolute bottom-4 left-4 right-4"><p className="mb-2 text-xs text-muted">{clip.start} → {clip.end} · {clip.seconds}s</p><h3 className="text-xl font-black leading-tight">{clip.title}</h3></div>
              </div>
              <div className="p-4"><p className="text-sm text-muted">{clip.reason}</p><div className="mt-3 flex flex-wrap gap-1">{clip.tags.map((t) => <span key={t} className="rounded-full border border-border px-2 py-1 text-[10px] text-muted">{t}</span>)}</div><button onClick={() => setSelected((x) => x.includes(clip.id) ? x.filter((id) => id !== clip.id) : [...x, clip.id].slice(0, 6))} className={`btn mt-4 w-full ${on ? "btn-primary" : "btn-ghost"}`}>{on ? <><Check className="size-4" /> En cola</> : <><Scissors className="size-4" /> Añadir a cola</>}</button></div>
            </article>;
          })}
        </div>
      </section>

      <section className="card mt-6 p-5"><div className="flex gap-4"><MonitorPlay className="mt-1 size-6 text-neon" /><div><h2 className="text-xl font-black">Pipeline de producción</h2><p className="mt-1 text-sm text-muted">CLIPRD detecta y selecciona los momentos; el Local Agent de tu computadora descarga fuentes propias o autorizadas y genera los MP4 con FFmpeg sin depender del renderer remoto.</p></div><ChevronRight className="ml-auto size-5 text-muted" /></div></section>
    </Shell>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-lg bg-neon/10 text-xs font-black text-neon">{n}</span><span>{text}</span></div>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-surface-2 p-4"><div className="flex items-center gap-2 text-xs text-muted">{icon}{label}</div><p className="mt-2 text-2xl font-black">{value}</p></div>;
}
