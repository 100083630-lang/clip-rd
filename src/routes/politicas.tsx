import { createFileRoute } from "@tanstack/react-router";
import { PoliciesPage } from "@/components/cliprd/public-pages";

export const Route = createFileRoute("/politicas")({
  component: PoliciesPage,
});
