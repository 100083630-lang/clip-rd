export async function GET() {
  const rendererUrl = process.env.CLIPRD_RENDERER_URL;
  const rendererToken = process.env.CLIPRD_RENDERER_TOKEN;

  return Response.json({
    database: "conectada",
    renderer: rendererUrl ? "configurado" : "no configurado",
    renderer_url: rendererUrl ? "ok" : "falta CLIPRD_RENDERER_URL",
    renderer_token: rendererToken ? "ok" : "falta CLIPRD_RENDERER_TOKEN",
    mp4: rendererUrl && rendererToken ? "lista para verificar" : "todavia no verificada",
  });
}
