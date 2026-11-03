import { createFileRoute } from "@tanstack/react-router";
import { EarningsPage } from "@/components/cliprd/clipper-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/clipper/earnings")({
  ssr: false,
  component: () => <Authed role="clipper">{(profile) => <EarningsPage profile={profile} />}</Authed>,
});
