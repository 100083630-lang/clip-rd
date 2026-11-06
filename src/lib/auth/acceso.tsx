import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/acceso")({
  component: AccesoPage,
});

function AccesoPage() {
  useEffect(() => {
    window.location.replace("/admin");
  }, []);
  return <p className="p-6">Entrando al panel…</p>;
}
