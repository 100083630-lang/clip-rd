import { createFileRoute, Link } from "@tanstack/react-router";

function CliprdHome() {
  return (
    <main style={{ minHeight: "100vh", background: "#070b0f", color: "#f5f7fa", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2a33", paddingBottom: 20 }}>
          <strong style={{ fontSize: 24 }}>CLIPRD <span style={{ color: "#2eff7d" }}>AUTO CLIP</span></strong>
          <Link to="/clipper/auto-clip" style={{ background: "#2eff7d", color: "#07110a", padding: "12px 18px", borderRadius: 10, fontWeight: 800, textDecoration: "none" }}>Abrir estudio</Link>
        </header>
        <section style={{ padding: "80px 0 56px" }}>
          <p style={{ color: "#2eff7d", fontWeight: 800, letterSpacing: 2 }}>NUEVA PORTADA · BIBLIOTECA PERSONAL</p>
          <h1 style={{ fontSize: "clamp(46px,9vw,96px)", margin: "16px 0", lineHeight: 0.95 }}>TU ESTUDIO<br /><span style={{ color: "#2eff7d" }}>PERSONAL.</span></h1>
          <p style={{ maxWidth: 680, color: "#9daab5", fontSize: 20, lineHeight: 1.6 }}>Aquí verás primero tus clips descargados. El panel de procesamiento queda separado para que puedas crear clips automáticos sin llenar la portada.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link to="/clipper/auto-clip" style={{ background: "#2eff7d", color: "#07110a", padding: "14px 20px", borderRadius: 10, fontWeight: 800, textDecoration: "none" }}>🎬 Crear clips</Link>
            <Link to="/clipper/auto-clip#live" style={{ border: "1px solid #33414b", color: "#fff", padding: "14px 20px", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>📡 Live Monitor</Link>
          </div>
        </section>
        <section style={{ border: "1px solid #1f2a33", borderRadius: 20, padding: 28, background: "#0d141a" }}>
          <p style={{ color: "#2eff7d", fontWeight: 800, margin: 0 }}>BIBLIOTECA DE CLIPS</p>
          <h2 style={{ fontSize: 32, marginBottom: 8 }}>Mis clips descargados</h2>
          <p style={{ color: "#9daab5" }}>Los clips generados aparecerán aquí. Esta pantalla es la portada principal de CLIPRD.</p>
        </section>
        <p style={{ marginTop: 28, color: "#65737e", fontSize: 13 }}>CLIPRD PERSONAL · VERSION HOME 2026-11-10</p>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/")({
  component: CliprdHome,
});
