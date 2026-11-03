import { createFileRoute } from "@tanstack/react-router";
import { DashboardGate } from "@/components/cliprd/public-pages";

export const Route = createFileRoute("/dashboard")({
  component: DashboardGate,
});
