import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/cliprd/public-pages";

export const Route = createFileRoute("/notifications")({
  ssr: false,
  component: NotificationsPage,
});
