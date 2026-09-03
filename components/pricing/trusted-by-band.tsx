import { TRUSTED_BY_COMPANIES } from "@/lib/plan-features";

/**
 * "Our learners work at" — the wordmark band that closes the dark hero block
 * on /pricing and on /pricing/enterprise.
 *
 * Two-column layout: heading large and bold on the left, a 4-per-row grid of
 * large white wordmarks on the right. No logo assets exist for these
 * companies, so type size and weight carry the presence a real logo would.
 *
 * White, not white-with-opacity: this band sits on the hero's FIXED navy in
 * both light and dark theme, so a muted-foreground token here would resolve
 * to near-black in light theme and vanish.
 */
export function TrustedByBand() {
  return (
    <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 sm:grid-cols-[minmax(0,280px)_1fr] sm:items-center sm:gap-10">
      <h2 className="text-2xl font-bold leading-[1.2] text-white sm:text-3xl">
        Our learners work at
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {TRUSTED_BY_COMPANIES.map((name) => (
          <span
            key={name}
            className="text-xl font-semibold tracking-tight text-white"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
