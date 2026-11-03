import { createFileRoute } from "@tanstack/react-router";
import { ClipsAdminPage } from "@/components/cliprd/admin-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/clips")({
  ssr: false,
  component: () => <Authed role="admin">{(profile) => <ClipsAdminPage profile={profile} />}</Authed>,
});
