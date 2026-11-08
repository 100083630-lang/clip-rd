export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const sourceUrl = String(body.sourceUrl || "").trim();
  const clips = Array.isArray(body.clips) ? body.clips.slice(0, 6) : [];

  if (!/^https?:\/\//i.test(sourceUrl)) {
    return res.status(400).json({ error: "sourceUrl debe ser una URL http(s) pública y autorizada." });
  }
  if (!clips.length) {
    return res.status(400).json({ error: "Selecciona al menos un segmento." });
  }

  const base = (process.env.CLIPRD_RENDERER_URL || "https://clip-rd.onrender.com").replace(/\/$/, "");
  const token = process.env.CLIPRD_RENDERER_TOKEN || "";
  const job = {
    id: body.id || crypto.randomUUID(),
    sourceUrl,
    clips: clips.map((clip) => ({
      start: Number(clip.start),
      end: Number(clip.end)
    }))
  };

  try {
    const response = await fetch(base + "/jobs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: "Bearer " + token } : {})
      },
      body: JSON.stringify(job)
    });

    const data = await response.json().catch(() => ({ error: "Respuesta inválida del renderer" }));
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "No se pudo contactar el renderer." });
  }
}