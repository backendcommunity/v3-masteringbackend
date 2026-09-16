"use client";

import { VideoPoster } from "./video-poster";

export interface TestimonialCardProps {
  name: string;
  track: string;
  quote: string;
  isPlaceholderQuote: boolean;
  vimeoId?: string;
}

export function TestimonialCard({
  name,
  track,
  quote,
  isPlaceholderQuote,
  vimeoId,
}: TestimonialCardProps) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card transition-colors duration-200 hover:border-primary/30">
      <VideoPoster label="learner spotlight" vimeoId={vimeoId} aspect="tall" />
      <div className="flex flex-col gap-3.5 p-5">
        <p
          className={`text-base font-medium leading-snug tracking-tight ${
            isPlaceholderQuote ? "italic text-muted-foreground" : "text-foreground"
          }`}
        >
          {isPlaceholderQuote ? `Placeholder: ${quote}` : `"${quote}"`}
        </p>
        <div>
          <div className="text-sm font-bold">{name}</div>
          <div className="text-xs text-muted-foreground">
            {isPlaceholderQuote ? "Outcome to be confirmed" : "Masteringbackend learner"}
          </div>
        </div>
        <span className="w-fit rounded-full border border-border px-2.5 py-1 text-xs text-primary">
          {track}
        </span>
      </div>
    </div>
  );
}
