import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/cliprd/admin-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/reports")({
  ssr: false,
  component: () => <Authed role="admin">{(profile) => <ReportsPage profile={profile} />}</Authed>,
});
