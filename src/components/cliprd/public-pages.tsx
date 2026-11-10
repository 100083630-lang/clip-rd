import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PersonalHome } from "./personal-home";
import { bootstrapProfile } from "@/server/cliprd";
import { useQueryClient } from "@tanstack/react-query";

// ── Keys ────────────────────────────────────────────────────────────────
const JUST_LOGGED_IN_KEY = "cliprd.just-logged-in";
const INVITE_CODE_KEY = "cliprd.invite-code";
const BEARER_KEY = "grok-auth.bearer-token";

// ── Helpers ─────────────────────────────────────────────────────────────
function writeInviteCodeToStorage(code: string) {
  try {
    if (code) window.sessionStorage.setItem(INVITE_CODE_KEY, code);
  } catch {}
}

function readInviteCodeFromStorage(): string {
  try {
    return window.sessionStorage.getItem(INVITE_CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

function clearInviteCodeFromStorage() {
  try {
    window.sessionStorage.removeItem(INVITE_CODE_KEY);
  } catch {}
}

async function saveBearerTokenFromSession() {
  try {
    const session = await authClient.getSession();
    const token =
      (session as any)?.data?.session?.token ??
      (session as any)?.session?.token ??
      null;
    if (token) window.sessionStorage.setItem(BEARER_KEY, token);
  } catch {}
}

function cleanInviteCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ── HOMEPAGE / PÁGINA PÚBLICA PRINCIPAL ────────────────────────────────
export function HomePage() {
  return <PersonalHome />;
}
// Alias para que no falle ningún import viejo
export const PublicHomePage = HomePage;

// ── LOGIN ───────────────────────────────────────────────────────────────
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (!isPending && user) {
      window.location.href = "/register";
    }
  }, [user, isPending]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (signError) throw new Error(signError.message ?? "No se pudo iniciar sesión.");
      try {
        sessionStorage.setItem(JUST_LOGGED_IN_KEY, "1");
      } catch {}
      // GUARDA EL BEARER TOKEN - SIN ESTO DA Unauthorized
      await saveBearerTokenFromSession();
      window.location.href = "/register";
    } catch (err: any) {
      setError(err?.message ?? "No se pudo entrar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (isPending) return <div style={{ padding: 24 }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h1>Entrar</h1>
      <p>Entra con tu correo y contraseña de CLIPRD.</p>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
        </label>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: 14, background: "#111", color: "#fff", borderRadius: 10, border: "none" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </div>
  );
}

// ── REGISTER / TU FICHA ────────────────────────────────────────────────
export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authEnabled) return;
    if (isPending) return;
    if (!user) {
      setIsNewUser(true);
      const savedInvite = readInviteCodeFromStorage();
      if (savedInvite) setInviteCode(savedInvite);
      return;
    }
    setIsNewUser(false);
    setEmail(user.primaryEmail ?? "");
    setDisplayName(user.displayName ?? "");
  }, [user, isPending]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cleanInvite = cleanInviteCode(inviteCode);
      const { error: signError } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: displayName.trim() || fullName.trim(),
      });
      if (signError) throw new Error(signError.message ?? "No se pudo crear la cuenta.");
      if (cleanInvite) writeInviteCodeToStorage(cleanInvite);
      await saveBearerTokenFromSession();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err: any) {
      setError(err?.message ?? "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnterCliprd() {
    setError(null);
    setLoading(true);
    try {
      await saveBearerTokenFromSession();
      const cleanInvite = cleanInviteCode(inviteCode);
      const result = await bootstrapProfile({
        data: {
          fullName: fullName.trim(),
          displayName: displayName.trim() || fullName.trim(),
          inviteCode: cleanInvite || undefined,
        },
      });
      if ((result as any)?.error) throw new Error("No se pudo entrar a CLIPRD.");
      clearInviteCodeFromStorage();
      queryClient.invalidateQueries();
      navigate({ to: "/cliprd" });
    } catch (err: any) {
      setError(err?.message ?? "No se pudo entrar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (isPending) return <div style={{ padding: 24 }}>Cargando...</div>;

  if (isNewUser || !user) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <h1>Crear cuenta</h1>
        <p>Crea tu cuenta de CLIPRD con correo y contraseña.</p>
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            Nombre completo
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
          </label>
          <label>
            Cómo quieres que te llamen
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
          </label>
          <label>
            Correo
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
          </label>
          <label>
            Código de invitación <span style={{ color: "#888" }}>(opcional)</span>
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Si tienes uno, ponlo aquí" style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4, textTransform: "uppercase" }} />
          </label>
          {error && <div style={{ color: "red" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: 14, background: "#111", color: "#fff", borderRadius: 10, border: "none" }}>
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          ¿Ya tienes cuenta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h1>Tu ficha</h1>
      <p>Completa tu ficha para entrar a CLIPRD.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Nombre completo
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
        </label>
        <label>
          Cómo quieres que te llamen
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
        </label>
        <label>
          Correo
          <input value={email} disabled style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #eee", background: "#f5f5f5", marginTop: 4 }} />
        </label>
        <label>
          Código de invitación <span style={{ color: "#888" }}>(opcional)</span>
          <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Déjalo en blanco si no tienes" style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", marginTop: 4, textTransform: "uppercase" }} />
        </label>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button onClick={handleEnterCliprd} disabled={loading} style={{ padding: 14, background: "#111", color: "#fff", borderRadius: 10, border: "none" }}>
          {loading ? "Entrando..." : "Entrar a CLIPRD"}
        </button>
      </div>
    </div>
  );
}

// ── ESTOS 4 FALTABAN Y POR ESO DABA BUILD FAILED ──────────────────────

export function DashboardGate({ children }: { children?: React.ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!user) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <h1>Debes entrar primero</h1>
        <Link to="/login">Ir a Entrar</Link>
      </div>
    );
  }
  return <>{children}</>;
}

export function NotificationsPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!user) return <div style={{ padding: 24 }}>Debes entrar primero. <Link to="/login">Entrar</Link></div>;
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>Notificaciones</h1>
      <p>No tienes notificaciones nuevas.</p>
    </div>
  );
}

export function PoliciesPage() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>Políticas</h1>
      <p>Políticas de CLIPRD.</p>
      <p>Al usar CLIPRD aceptas las reglas de la comunidad y el uso responsable de la plataforma.</p>
    </div>
  );
}

export function RankingPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!user) return <div style={{ padding: 24 }}>Debes entrar primero. <Link to="/login">Entrar</Link></div>;
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>Ranking</h1>
      <p>El ranking de CLIPRD aparecerá aquí.</p>
    </div>
  );
}
