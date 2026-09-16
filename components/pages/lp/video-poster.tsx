"use client";

/**
 * Click-to-play facade for every video slot on the LP (hero overview, both
 * testimonials). Renders a static poster — no Vimeo player, no network
 * request — until clicked, so the page's first paint costs ~nothing per
 * video slot instead of loading three Vimeo players nobody has asked for
 * yet. This matters specifically here: this route is the destination for
 * paid Nigerian mobile traffic, where a loaded video player is real data
 * cost before anyone has decided to watch anything.
 *
 * `vimeoId` is optional on purpose — see Task 6. Until it's supplied,
 * clicking shows an honest "not wired yet" note instead of a broken player.
 */
import { useState } from "react";

export interface VideoPosterProps {
  label: string;
  vimeoId?: string;
  aspect?: "wide" | "tall";
}

export function VideoPoster({ label, vimeoId, aspect = "wide" }: VideoPosterProps) {
  const [opened, setOpened] = useState(false);

  if (opened && vimeoId) {
    return (
      <div className={aspect === "wide" ? "aspect-video" : "aspect-[4/3]"}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          className="h-full w-full rounded"
          allow="autoplay; fullscreen; picture-in-picture"
          title={label}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpened(true)}
      aria-label={
        opened && !vimeoId ? "Video not available yet" : `Play ${label}`
      }
      className={`relative w-full overflow-hidden rounded ${
        aspect === "wide" ? "aspect-video" : "aspect-[4/3]"
      } bg-gradient-to-br from-[#223642] to-[#101A22]`}
    >
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary shadow-lg">
          <span className="ml-1 h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-[#05262F]" />
        </span>
      </span>
      <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-white/80">
        {label}
      </span>
      {opened && !vimeoId ? (
        <span className="absolute inset-0 grid place-items-center bg-[#0E1F33] p-6 text-center">
          <span className="max-w-[38ch] text-sm text-white/75">
            This video isn&apos;t wired up yet — it needs a Vimeo ID.
          </span>
        </span>
      ) : null}
    </button>
  );
}
