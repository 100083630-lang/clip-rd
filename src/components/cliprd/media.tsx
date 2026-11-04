import { Play } from "lucide-react";
import { clipPoster, formatDuration, formatUsd, formatViews } from "@/lib/cliprd/format";
import type { Clip } from "@/lib/cliprd/types";
import { platformName, StatusBadge } from "./chrome";

export function ClipPoster({
  clip,
  tall = false,
}: {
  clip: Pick<Clip, "provider" | "externalId" | "thumbnailUrl" | "platformId" | "durationSeconds" | "title">;
  tall?: boolean;
}) {
  const poster = clipPoster(clip);
  return (
    <div className={`poster-frame relative overflow-hidden ${tall ? "poster-tall" : ""}`}>
      {poster ? (
        <img src={poster} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center px-4 text-center text-sm text-muted">Sin miniatura todavía</div>
      )}
      <span className="absolute left-3 top-3 rounded-md bg-bg/85 px-2 py-1 text-xs font-bold text-neon">{platformName(clip.platformId)}</span>
      <span className="absolute right-3 top-3 rounded-md bg-bg/85 px-2 py-1 text-xs font-semibold">{formatDuration(clip.durationSeconds)}</span>
      <span className="play-badge" aria-hidden="true">
        <Play className="size-5 fill-current" />
      </span>
      <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/80 to-transparent px-3 pb-10 pt-16 text-lg font-bold leading-tight">{clip.title}</p>
    </div>
  );
}

export function ClipGallery({ clips }: { clips: Clip[] }) {
  if (clips.length === 0) {
    return <p className="text-sm text-muted">Todavía no hay publicaciones en esta vista. Cuando un clipper registre un enlace, la tarjeta sale aquí con su miniatura real.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {clips.map((clip) => (
        <article key={clip.id} className="card overflow-hidden">
          <ClipPoster clip={clip} tall />
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-sm text-muted">{clip.description || clip.ownerName}</p>
              <StatusBadge value={clip.status} />
            </div>
            <p className="text-xs text-muted">{clip.ownerName}{clip.channelName ? ` · ${clip.channelName}` : ""}</p>
            <p className="text-sm">
              <span className="stat-value text-2xl">{formatViews(clip.statsVerified ? clip.validViews : clip.publicViews)}</span>
              <span className="text-muted"> {clip.statsVerified ? "vistas válidas" : "vistas observadas, no liquidadas"}</span>
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neon">{formatUsd(clip.earning)}</p>
              <a className="btn btn-primary" href={clip.url} target="_blank" rel="noreferrer">Abrir</a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}