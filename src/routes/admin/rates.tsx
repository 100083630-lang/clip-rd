import { createFileRoute } from "@tanstack/react-router";
import { RatesPage } from "@/components/cliprd/admin-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/rates")({
  ssr: false,
  component: () => <Authed role="admin">{(profile) => <RatesPage profile={profile} />}</Authed>,
});
