import { createFileRoute } from "@tanstack/react-router";
import { ClipperHome } from "@/components/cliprd/clipper-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/clipper/dashboard")({
  ssr: false,
  component: () => <Authed role="clipper">{(profile) => <ClipperHome profile={profile} />}</Authed>,
});
