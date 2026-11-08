export default function handler(req, res) {
  res.status(200).json({
    database: "conectada",
    renderer: process.env.CLIPRD_RENDERER_URL ? "configurado" : "no configurado",
  });
}
