import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/cliprd/admin-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  component: () => <Authed role="admin">{(profile) => <SettingsPage profile={profile} />}</Authed>,
});
