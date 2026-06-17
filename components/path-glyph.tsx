"use client";

import { cn } from "@/lib/utils";

/**
 * Brand glyph used for every learning path (replaces per-path banners on the
 * dashboard resume hero and anywhere a consistent path mark is wanted).
 *
 * A milestone route: nodes connected along a climbing path, with the active
 * node ringed — reads as "a journey with checkpoints". Renders white-on-parent,
 * so place it on the teal gradient cover.
 */
export function PathGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn("h-10 w-10", className)}
      aria-hidden="true"
    >
      {/* route line */}
      <path
        d="M11 37 C 11 29, 20 30, 20 24 C 20 18, 29 19, 29 13 C 29 9, 33 8, 37 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeOpacity="0.55"
        strokeDasharray="0.1 5.2"
      />
      {/* done node */}
      <circle cx="11" cy="37" r="3.4" fill="currentColor" fillOpacity="0.85" />
      {/* mid node */}
      <circle cx="20" cy="24" r="3.4" fill="currentColor" fillOpacity="0.85" />
      {/* active node — ringed */}
      <circle cx="29" cy="13" r="5" fill="currentColor" />
      <circle cx="29" cy="13" r="8" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.45" />
      {/* summit / goal */}
      <path
        d="M37 4.5 L38.7 7.9 L42.5 8.5 L39.7 11.2 L40.4 15 L37 13.2 L33.6 15 L34.3 11.2 L31.5 8.5 L35.3 7.9 Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  );
}
