export default async function handler(req, res) {
  const base = (process.env.CLIPRD_RENDERER_URL || "https://clip-rd.onrender.com").replace(/\/$/, "");
  try {
    const response = await fetch(base + "/health", { headers: { accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    res.status(response.ok ? 200 : 502).json({ ok: response.ok, renderer: base, ...data });
  } catch (error) {
    res.status(502).json({ ok: false, renderer: base, error: error instanceof Error ? error.message : "Renderer unavailable" });
  }
}