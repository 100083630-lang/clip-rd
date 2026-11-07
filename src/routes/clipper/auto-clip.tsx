import { createFileRoute } from "@tanstack/react-router";
import { AutoClipStudio } from "@/components/cliprd/auto-clip-studio";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/clipper/auto-clip")({
  ssr: false,
  component: () => <Authed role="clipper">{(profile) => <AutoClipStudio profile={profile} />}</Authed>,
});
