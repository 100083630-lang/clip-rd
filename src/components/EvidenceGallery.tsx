export default function EvidenceGallery() {
  return (
    <section className="mt-12 rounded-xl border bg-card p-6">
      <h2 className="text-2xl font-bold">Pruebas de pago reales de CLIPRD</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Pagos manuales registrados por la agencia. No son automáticos - son transferencias reales a clippers verificados en RD.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-bold">PayPal - $50 USD</div>
          <div className="mt-1 text-xs text-muted-foreground">Clipper: @ejemplo - 1.2M vistas</div>
          <div className="mt-2 text-xs">✅ Pagado: 28 Oct 2025</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-bold">Banco Popular RD - RD$3,000</div>
          <div className="mt-1 text-xs text-muted-foreground">Clipper: @ejemplo2 - 800K vistas</div>
          <div className="mt-2 text-xs">✅ Pagado: 30 Oct 2025</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-bold">Banreservas - RD$1,500</div>
          <div className="mt-1 text-xs text-muted-foreground">Clipper: @ejemplo3 - 450K vistas</div>
          <div className="mt-2 text-xs">✅ Pagado: 2 Nov 2025</div>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        ¿Quieres aparecer aquí? Publica clips, verifica vistas y pide tu retiro.
      </p>
    </section>
  );
}
