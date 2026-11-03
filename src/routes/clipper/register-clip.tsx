import { createFileRoute } from "@tanstack/react-router";
import { RegisterClipPage } from "@/components/cliprd/clipper-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/clipper/register-clip")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { platform: "tiktok" | "youtube" } => ({
    platform: search.platform === "youtube" ? "youtube" : "tiktok",
  }),
  component: () => <Authed role="clipper">{(profile) => <RegisterClipPage profile={profile} />}</Authed>,
});
