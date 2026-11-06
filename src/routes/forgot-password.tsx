import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  return <main className="min-h-screen bg-[#07111f] px-6 py-20 text-white"><section className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[.03] p-8"><p className="text-sm font-bold tracking-[.2em] text-cyan-400">CLIPRD</p><h1 className="mt-3 text-3xl font-black">Recuperación en reconstrucción</h1><p className="mt-4 leading-7 text-slate-300">El sistema de autenticación anterior fue retirado de la versión limpia. La plataforma pública permanece disponible mientras reconstruimos el acceso correctamente.</p><Link to="/dashboard" className="mt-7 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">Continuar a la plataforma</Link></section></main>;
}
