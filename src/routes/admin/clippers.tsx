import { createFileRoute } from "@tanstack/react-router";
import { ClippersPage } from "@/components/cliprd/admin-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/clippers")({
  ssr: false,
  component: () => <Authed role="admin">{(profile) => <ClippersPage profile={profile} />}</Authed>,
});
