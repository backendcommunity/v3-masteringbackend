"use client";

/**
 * Click-to-play facade for every video on the LP. Renders YouTube's own
 * thumbnail as a static image (one ~20KB JPEG) and nothing else until the
 * visitor taps play; only then does the embed iframe load. This route is
 * the destination for paid Nigerian mobile traffic, where six eagerly
 * loaded YouTube players would be real data cost before anyone has decided
 * to watch anything.
 *
 * youtube-nocookie.com keeps the embed out of YouTube's tracking cookies
 * until playback starts.
 */
import { useState } from "react";

export interface VideoPosterProps {
  youtubeId: string;
  title: string;
  aspect?: "wide" | "tall";
}

export function VideoPoster({ youtubeId, title, aspect = "wide" }: VideoPosterProps) {
  const [playing, setPlaying] = useState(false);
  const ratio = aspect === "wide" ? "aspect-video" : "aspect-[4/3]";

  if (playing) {
    return (
      <div className={ratio}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          className="h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play: ${title}`}
      className={`group relative block w-full overflow-hidden bg-[#0E1F33] transition-transform duration-200 hover:scale-[1.01] ${ratio}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-[#0E1F33]/70 via-transparent to-transparent" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary shadow-lg transition-transform duration-200 group-hover:scale-110">
          <span className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-[#05262F]" />
        </span>
      </span>
    </button>
  );
}
