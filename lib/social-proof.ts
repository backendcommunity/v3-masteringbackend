// Social-proof thresholds shared across course / path / project detail pages.
//
// Why a floor: social proof is bidirectional. Above a credible count, "N
// learners" reassures (low risk). Below it, the SAME element reads as negative
// proof — "2 learners" signals "nobody's here → risky/unproven". For a young
// catalog we must never expose tiny absolute counts; we hide them and fall back
// to novelty / risk-reversal framing until the number earns its place.

export const MIN_CREDIBLE_LEARNERS = 100;

/**
 * Whether a learner/student/enrollment count is large enough to display as
 * positive social proof. Below the threshold, callers should render a
 * "Newly launched" style framing instead of the raw number.
 */
export function isCredibleLearnerCount(count?: number | null): boolean {
  return (count ?? 0) >= MIN_CREDIBLE_LEARNERS;
}
