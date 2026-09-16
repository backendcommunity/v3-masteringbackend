"use client";

import { VideoPoster } from "./video-poster";

export interface TestimonialCardProps {
  youtubeId: string;
  /** The learner's story in one line; shown under the video and read to screen readers. */
  title: string;
  /**
   * The learner's full name, where we have it. The scholarship page's own
   * rule applies here: a name a visitor can look up is worth more than an
   * anonymous quote, so a card without one shows its video title instead
   * of inventing an attribution.
   */
  name?: string;
  /** What they do, shown under the name. Only rendered with a name. */
  role?: string;
  /** One line in the learner's own words. Only rendered with a name. */
  quote?: string;
}

export function TestimonialCard({
  youtubeId,
  title,
  name,
  role,
  quote,
}: TestimonialCardProps) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card transition-colors duration-200 hover:border-primary/30">
      <VideoPoster youtubeId={youtubeId} title={title} aspect="wide" />
      <div className="p-4">
        {quote ? (
          <p className="text-[15px] leading-snug text-muted-foreground">
            &ldquo;{quote}&rdquo;
          </p>
        ) : (
          <p className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
            {title}
          </p>
        )}
        {name ? (
          <>
            <p className="mt-2.5 text-[14px] font-semibold tracking-tight text-foreground">
              {name}
            </p>
            {role ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{role}</p>
            ) : null}
          </>
        ) : (
          <p className="mt-2.5 text-xs text-muted-foreground">
            Masteringbackend learner
          </p>
        )}
      </div>
    </div>
  );
}
