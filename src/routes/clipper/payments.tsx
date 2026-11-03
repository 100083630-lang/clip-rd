import { createFileRoute } from "@tanstack/react-router";
import { PaymentsPage } from "@/components/cliprd/clipper-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/clipper/payments")({
  ssr: false,
  component: () => <Authed role="clipper">{(profile) => <PaymentsPage profile={profile} />}</Authed>,
});
