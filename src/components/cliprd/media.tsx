import { clipPoster, formatDuration, formatUsd, formatViews } from "@/lib/cliprd/format";
import type { Clip } from "@/lib/cliprd/types";
import { platformName, StatusBadge } from "./chrome";

export function ClipPoster({ clip }: { clip: Pick<Clip, "provider" | "externalId" | "thumbnailUrl" | "platformId" | "durationSeconds" | "title"> }) {
  const poster = clipPoster(clip);
  return (
    <div className="poster-frame relative overflow-hidden">
      {poster ? (
        <img src={poster} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center px-4 text-center text-sm text-muted">Sin miniatura todavía</div>
      )}
      <span className="absolute left-3 top-3 rounded-md bg-bg/85 px-2 py-1 text-xs font-bold text-neon">{platformName(clip.platformId)}</span>
      <span className="absolute bottom-3 right-3 rounded-md bg-bg/85 px-2 py-1 text-xs font-semibold">{formatDuration(clip.durationSeconds)}</span>
    </div>
  );
}

export function ClipGallery({ clips }: { clips: Clip[] }) {
  if (clips.length === 0) {
    return <p className="text-sm text-muted">Todavía no hay publicaciones en esta vista.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {clips.map((clip) => (
        <article key={clip.id} className="card overflow-hidden">
          <ClipPoster clip={clip} />
          <div className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-lg">{clip.title}</h3>
              <StatusBadge value={clip.status} />
            </div>
            <p className="text-xs text-muted">{clip.ownerName}{clip.channelName ? ` · ${clip.channelName}` : ""}</p>
            <p className="text-sm">
              <span className="stat-value">{formatViews(clip.statsVerified ? clip.validViews : clip.publicViews)}</span>
              <span className="text-muted"> {clip.statsVerified ? "vistas válidas" : "vistas observadas, no liquidadas"}</span>
            </p>
            <p className="text-sm font-semibold text-neon">{formatUsd(clip.earning)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
