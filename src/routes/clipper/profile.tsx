import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/cliprd/clipper-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/clipper/profile")({
  ssr: false,
  component: () => <Authed role="clipper">{(profile) => <ProfilePage profile={profile} />}</Authed>,
});
