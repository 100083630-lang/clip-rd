import { createFileRoute } from "@tanstack/react-router";
import { ClipsAdminPage } from "@/components/cliprd/admin-pages";
import { Authed } from "@/components/cliprd/chrome";

export const Route = createFileRoute("/admin/clips")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: function AdminClipsRoute() {
    const { q } = Route.useSearch();
    return <Authed role="admin">{(profile) => <ClipsAdminPage profile={profile} initialQuery={q} />}</Authed>;
  },
});
