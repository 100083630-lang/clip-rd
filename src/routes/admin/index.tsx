import { createFileRoute } from "@tanstack/react-router";
import { AdminHome } from "@/components/cliprd/admin-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  component: () => <Authed role="admin">{(profile) => <AdminHome profile={profile} />}</Authed>,
});
