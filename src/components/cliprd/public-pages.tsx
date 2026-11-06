import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const features = [
  { title: "Panel CLIPRD", text: "Una vista clara del sistema y sus módulos principales." },
  { title: "Clips", text: "Organiza publicaciones, métricas y flujo de trabajo." },
  { title: "Ranking", text: "Consulta la estructura visual del ranking y la plataforma." },
];

function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#09182a]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-black tracking-tight">CLIP<span className="text-cyan-400">RD</span></Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/ranking" className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white">Ranking</Link>
            <Link to="/dashboard" className="rounded-lg bg-cyan-400 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-300">Ver plataforma</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-slate-400">CLIPRD · Vista pública de la plataforma</footer>
    </main>
  );
}

export function HomePage() {
  return (
    <Layout>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.2fr_.8fr] md:items-center">
        <div>
          <p className="mb-4 text-sm font-bold tracking-[.22em] text-cyan-400">PLATAFORMA CLIPRD</p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">Todo CLIPRD, sin el caos del antiguo acceso.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Hemos separado la experiencia visual pública del sistema de autenticación para que puedas revisar el producto sin quedarte atrapado en bucles de login, registro o OAuth.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard" className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950">Explorar la plataforma</Link>
            <Link to="/ranking" className="rounded-xl border border-white/15 px-6 py-3 font-bold text-white hover:bg-white/5">Ver ranking</Link>
          </div>
        </div>
        <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-blue-500/5 p-8 shadow-2xl">
          <div className="text-sm font-semibold text-cyan-300">ESTADO DEL FRONTEND</div>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-white/5 p-4"><b>✓ Acceso público</b><p className="mt-1 text-sm text-slate-400">La navegación básica ya no depende del login.</p></div>
            <div className="rounded-2xl bg-white/5 p-4"><b>✓ Código simplificado</b><p className="mt-1 text-sm text-slate-400">Sin lógica duplicada de sesión en las páginas públicas.</p></div>
            <div className="rounded-2xl bg-white/5 p-4"><b>✓ Autenticación aislada</b><p className="mt-1 text-sm text-slate-400">Las funciones sensibles pueden reconstruirse después sin bloquear la vista.</p></div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/[.035] p-6">
            <h2 className="text-xl font-bold">{feature.title}</h2>
            <p className="mt-2 text-slate-400">{feature.text}</p>
          </article>
        ))}
      </section>
    </Layout>
  );
}

export const PublicHomePage = HomePage;

export function DashboardGate({ children }: { children?: ReactNode }) {
  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-bold tracking-[.2em] text-cyan-400">VISTA DE PLATAFORMA</p>
        <h1 className="mt-3 text-4xl font-black">CLIPRD está listo para revisión.</h1>
        <p className="mt-4 max-w-2xl text-slate-300">El frontend público fue limpiado para eliminar los bloqueos de autenticación de esta etapa. Las acciones administrativas y datos privados no se exponen aquí.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Interfaz", "Flujo visual", "Arquitectura pública"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><b>{item}</b><p className="mt-2 text-sm text-slate-400">Disponible para revisión y rediseño.</p></div>)}
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </section>
    </Layout>
  );
}

export function LoginPage() {
  return (
    <Layout>
      <section className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm font-bold tracking-[.2em] text-cyan-400">ACCESO EN RECONSTRUCCIÓN</p>
        <h1 className="mt-3 text-4xl font-black">La vista pública está abierta.</h1>
        <p className="mt-4 text-slate-300">Quitamos el flujo inestable de login de la experiencia pública mientras se reconstruye la autenticación desde cero.</p>
        <Link to="/dashboard" className="mt-8 inline-flex rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950">Continuar sin iniciar sesión</Link>
      </section>
    </Layout>
  );
}

export function RegisterPage() { return <LoginPage />; }

export function NotificationsPage() {
  return <Layout><section className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-4xl font-black">Notificaciones</h1><p className="mt-4 text-slate-300">La vista pública no requiere cuenta. Las notificaciones personales se reactivarán con el nuevo sistema de autenticación.</p></section></Layout>;
}

export function PoliciesPage() {
  return <Layout><section className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-4xl font-black">Políticas</h1><p className="mt-4 text-slate-300">CLIPRD está en fase de estabilización. Los datos privados y las funciones financieras permanecen protegidos.</p></section></Layout>;
}

export function RankingPage() {
  return <Layout><section className="mx-auto max-w-3xl px-6 py-16"><p className="text-sm font-bold tracking-[.2em] text-cyan-400">RANKING</p><h1 className="mt-3 text-4xl font-black">Vista pública del ranking</h1><p className="mt-4 text-slate-300">El ranking completo se conectará nuevamente cuando terminemos la limpieza del backend y los permisos.</p><Link to="/dashboard" className="mt-8 inline-flex rounded-xl border border-white/15 px-5 py-3 font-bold">Volver a la plataforma</Link></section></Layout>;
}
