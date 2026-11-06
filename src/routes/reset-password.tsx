import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  return <main className="min-h-screen bg-[#07111f] px-6 py-20 text-white"><section className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[.03] p-8"><p className="text-sm font-bold tracking-[.2em] text-cyan-400">CLIPRD</p><h1 className="mt-3 text-3xl font-black">Sistema reiniciado</h1><p className="mt-4 leading-7 text-slate-300">La recuperación de contraseña se reconstruirá junto con el nuevo sistema de acceso. Puedes navegar la versión pública sin iniciar sesión.</p><Link to="/dashboard" className="mt-7 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">Ir al dashboard</Link></section></main>;
}
