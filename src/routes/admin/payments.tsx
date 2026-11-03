import { createFileRoute } from "@tanstack/react-router";
import { PaymentsAdminPage } from "@/components/cliprd/admin-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/payments")({
  ssr: false,
  component: () => <Authed role="admin">{(profile) => <PaymentsAdminPage profile={profile} />}</Authed>,
});
