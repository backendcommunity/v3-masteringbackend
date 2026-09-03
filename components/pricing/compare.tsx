import { Check, X } from "lucide-react";

/**
 * The shared vocabulary of a plan-comparison cell.
 *
 * "yes" / "no" render as a tick or a cross; any other string renders as
 * itself, which is how a row states a real quota ("Unlimited", "Up to 60
 * min") instead of flattening it to a tick that says less than the truth.
 */
export type CompareCell = "yes" | "no" | string;

/**
 * Status chip shown beside a feature label — see COMING_SOON in
 * lib/plan-features.ts for which labels get one.
 *
 * Deliberately quiet: muted and outlined. This is a caveat, not a selling
 * point, and a loud chip would pull the eye away from what the tier actually
 * delivers today.
 *
 * Inline text rather than an icon, so it survives a screen reader and a
 * monochrome print with no extra markup.
 */
export function FeatureBadge() {
  return (
    <span className="ml-2 inline-block whitespace-nowrap rounded border border-border px-1.5 py-0.5 align-middle font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      Coming soon
    </span>
  );
}

/**
 * One comparison-table cell.
 *
 * role="img" alongside the aria-label is load-bearing, not belt-and-braces: a
 * bare aria-label on an <svg> is not reliably announced, because an SVG's
 * default role is generic in several engines and a generic element's label is
 * ignored. Without it, an assistive-technology user scanning the table hears
 * the row label and then silence in every plan column — the entire
 * comparison, conveyed by colour and glyph shape alone.
 */
export function CompareMark({ value }: { value: CompareCell }) {
  if (value === "yes") {
    return (
      <Check
        className="mx-auto h-5 w-5 text-primary"
        strokeWidth={3}
        role="img"
        aria-label="Included"
      />
    );
  }
  if (value === "no") {
    return (
      <X
        className="mx-auto h-5 w-5 text-muted-foreground/40"
        role="img"
        aria-label="Not included"
      />
    );
  }
  return (
    <span className="text-sm font-medium text-muted-foreground">{value}</span>
  );
}
