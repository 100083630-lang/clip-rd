import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/cliprd/public-pages";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
