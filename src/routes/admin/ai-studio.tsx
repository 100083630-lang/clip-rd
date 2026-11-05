import { createFileRoute } from "@tanstack/react-router";
import { AIStudio } from "@/components/cliprd/ai-studio";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/ai-studio")({
  ssr: false,
  component: () => <Authed role="admin">{(profile) => <AIStudio profile={profile} />}</Authed>,
});
