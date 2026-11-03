import { createFileRoute } from "@tanstack/react-router";
import { MyClipsPage } from "@/components/cliprd/clipper-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/clipper/my-clips")({
  ssr: false,
  component: () => <Authed role="clipper">{(profile) => <MyClipsPage profile={profile} />}</Authed>,
});
