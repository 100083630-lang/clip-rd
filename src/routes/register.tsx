import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "@/components/cliprd/public-pages";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
