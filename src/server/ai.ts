import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

const inputSchema = z.object({
  topic: z.string().trim().min(3).max(500),
  platform: z.enum(["tiktok", "youtube_shorts", "youtube_video"]),
  audience: z.string().trim().max(160).optional(),
  tone: z.enum(["controversial", "funny", "informative", "emotional", "news"]).default("controversial"),
});

export const generateClipIdeas = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("La IA aún no está configurada. Añade OPENAI_API_KEY en las variables de entorno de Vercel.");

    const prompt = [
      "Eres el estratega editorial de CLIPRD, una agencia de clips cortos en español para público latino.",
      "Genera exactamente 3 propuestas accionables a partir del tema dado. No inventes citas, sucesos ni marcas de tiempo de un video que no has visto.",
      "Devuelve JSON válido con esta forma: {"ideas":[{"hook":"...","title":"...","angle":"...","caption":"...","hashtags":["#..."],"editingTips":["..."],"whyItMayWork":"..."}]}",
      "Los ganchos deben captar atención en los primeros 2 segundos, sin engaño ni clickbait falso. Títulos claros, breves y naturales.",
      "Incluye recomendaciones de edición vertical, subtítulos legibles y contexto suficiente. No prometas viralidad ni resultados garantizados.",
      `Plataforma: ${data.platform}. Tono: ${data.tone}. Audiencia: ${data.audience || "público latino general"}. Tema/contexto: ${data.topic}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input: prompt,
        text: { format: { type: "json_object" } },
        max_output_tokens: 1400,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI no pudo generar las ideas (${response.status}): ${detail.slice(0, 240)}`);
    }
    const payload = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const text = payload.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text;
    if (!text) throw new Error("La IA no devolvió propuestas. Inténtalo de nuevo.");
    const parsed = JSON.parse(text) as { ideas?: unknown[] };
    if (!Array.isArray(parsed.ideas) || parsed.ideas.length !== 3) throw new Error("La IA devolvió un formato inesperado.");
    return parsed;
  });
