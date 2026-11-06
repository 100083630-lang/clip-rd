import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";

type Search = { token?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto max-w-sm p-6">
        <h1 className="mb-4 text-2xl font-semibold">Enlace inválido</h1>
        <p className="text-sm">
          Este enlace no es válido o expiró.{" "}
          <Link to="/forgot-password" className="underline-offset-4 hover:underline">
            Solicita uno nuevo
          </Link>
          .
        </p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "No se pudo restablecer la contraseña");
      return;
    }
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Nueva contraseña</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
