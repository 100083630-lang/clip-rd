import { createFileRoute } from "@tanstack/react-router";
import { RankingPage } from "@/components/cliprd/public-pages";

export const Route = createFileRoute("/ranking")({
  ssr: false,
  component: RankingPage,
});
