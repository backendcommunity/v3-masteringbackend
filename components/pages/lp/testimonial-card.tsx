"use client";

import { VideoPoster } from "./video-poster";

export interface TestimonialCardProps {
  youtubeId: string;
  /** The learner's story in one line; shown under the video and read to screen readers. */
  title: string;
}

export function TestimonialCard({ youtubeId, title }: TestimonialCardProps) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card transition-colors duration-200 hover:border-primary/30">
      <VideoPoster youtubeId={youtubeId} title={title} aspect="wide" />
      <div className="p-4">
        <p className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Masteringbackend learner</p>
      </div>
    </div>
  );
}
