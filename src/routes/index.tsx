import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/cliprd/public-pages";

export const Route = createFileRoute("/")({
  component: HomePage,
});
