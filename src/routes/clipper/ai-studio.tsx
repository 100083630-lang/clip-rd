import { createFileRoute } from "@tanstack/react-router";
import { AIStudio } from "@/components/cliprd/ai-studio";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/clipper/ai-studio")({
  ssr: false,
  component: () => <Authed role="clipper">{(profile) => <AIStudio profile={profile} />}</Authed>,
});
