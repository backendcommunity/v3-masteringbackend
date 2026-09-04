"use client";

/**
 * Shown while the browser resolves the visitor's region (hooks/use-pricing.ts).
 *
 * Deliberately shows NO number. The one thing worse than a late price is a
 * confident wrong one: a placeholder amount that then swaps to a different
 * currency reads as a bait-and-switch on the surface where trust matters
 * most. The request is a single uncached GET to our own API, so this is on
 * screen for roughly one round trip.
 */
export function PricingSkeleton({ label = "Loading pricing" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-24"
    >
      <span className="sr-only">{label}</span>
      <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
      <div className="grid w-full max-w-5xl gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-2xl border border-border p-6"
          >
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
            <div className="flex flex-col gap-2 pt-2">
              {[0, 1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-3 w-full animate-pulse rounded-full bg-muted"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
