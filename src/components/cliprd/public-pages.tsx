export function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (!isPending && user) return <Navigate to="/dashboard" />;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form
        className="card w-full max-w-md space-y-4 p-6 md:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          void authClient.signIn
            .email({ email, password, fetchOptions: { headers: { "Content-Type": "application/json" } } })
            .then(async ({ error: signError }) => {
              if (signError) throw new Error("Correo o contraseña incorrectos.");
              try {
                const profile = await import("@/server/cliprd").then((mod) => mod.getMyProfile());
                if (!profile) {
                  void navigate({ to: "/register" });
                  return;
                }
                void navigate({ to: profile.role === "admin" ? "/admin" : "/clipper/dashboard" });
              } catch {
                // No tiene ficha todavia, mandalo a completarla, no le tires Unauthorized
                void navigate({ to: "/register" });
                return;
              }
            })
            .catch((reason: unknown) => {
              setError(reason instanceof Error ? reason.message : "No se pudo entrar.");
              setPending(false);
            });
        }}
      >
        <Logo slogan />
        <h1 className="text-3xl">Entrar</h1>
        <p className="text-sm text-muted">Usa el correo y la contraseña de tu cuenta CLIPRD.</p>
        <label className="field">
          <span className="label">Correo</span>
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field">
          <span className="label">Contraseña</span>
          <input className="input" type="password" required minLength={8} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={pending || isPending}>{pending ? "Entrando…" : "Entrar"}</button>
        <p className="text-sm text-muted">
          ¿No tienes cuenta? <Link to="/register" className="text-neon underline-offset-4 hover:underline">Regístrate</Link>
        </p>
      </form>
    </main>
  );
}
