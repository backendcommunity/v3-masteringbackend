/**
 * ── Mock-interview tier allowances ───────────────────────────────────────
 *
 * Pure presentation logic for what a user may book, extracted from
 * components/pages/mock-interviews.tsx so it can be tested without rendering
 * a 1,700-line page. Same split lib/subscription-pricing.ts already uses for
 * the plan-classification helpers.
 *
 * The source of truth is PLAN_CONFIG in academy's
 * src/modules/mock-interview/helpers/subscription-access.ts — the only thing
 * that actually grants or refuses a session:
 *
 *     free:       { maxSessions: 1,  allowedDurations: [15] },
 *     pro:        { maxSessions: -1, allowedDurations: [15, 30] },
 *     enterprise: { maxSessions: -1, allowedDurations: [15, 30, 45, 60] },
 *
 * Session COUNT stopped separating Pro from Enterprise when Pro went
 * unlimited. Session LENGTH is now the only thing that does, so anywhere the
 * UI quotes an allowance it must quote the duration alongside it, or the two
 * paid tiers read as the same product.
 */

/** The API's sentinel for "no limit", on both count fields. */
export const UNLIMITED = -1;

export interface InterviewAccess {
  tier: "free" | "pro" | "enterprise";
  hasAccess: boolean;
  /** -1 means unlimited. Never render this number raw. */
  maxSessions: number;
  usedSessions: number;
  /** -1 means unlimited. Never render this number raw. */
  remainingSessions: number;
  allowedDurations: number[];
  message?: string;
}

/** Longest session this user can book, straight off the API's own list. */
export function maxAllowedDuration(
  access: Pick<InterviewAccess, "allowedDurations">,
): number | null {
  return access.allowedDurations?.length
    ? Math.max(...access.allowedDurations)
    : null;
}

/**
 * The LOWEST tier that unlocks each session length — mirrors PLAN_CONFIG's
 * allowedDurations above.
 *
 * Needed because the access payload only describes the CURRENT user's tier;
 * it cannot say which plan would unlock a length they don't have. The custom
 * template form previously labelled every unavailable duration "(Enterprise)",
 * so a free user was told 30-minute sessions needed Enterprise when Pro
 * grants them — an upsell pointing at the wrong, more expensive plan.
 */
export const DURATION_UNLOCKED_BY: Record<number, string> = {
  30: "Pro",
  45: "Enterprise",
  60: "Enterprise",
};

/**
 * One line describing what this user may book — count and length together.
 *
 * Returns null when the access payload carries nothing worth saying (e.g.
 * the API's "user not found" shape, which has no durations and no sessions).
 *
 * The -1 sentinel must never reach the screen. This page used to print
 * `${remainingSessions} of ${maxSessions} sessions remaining this month`
 * for any non-free tier, which rendered as "-1 of -1 sessions remaining"
 * the moment Pro became unlimited.
 */
export function sessionAllowanceLabel(access: InterviewAccess): string | null {
  const longest = maxAllowedDuration(access);
  const lengthSuffix = longest ? `, up to ${longest} min each` : "";

  if (access.maxSessions === UNLIMITED) {
    return `Unlimited sessions${lengthSuffix}`;
  }
  // A zero allowance is the "user not found" shape, not an exhausted trial.
  if (access.maxSessions === 0) {
    return null;
  }
  if (access.remainingSessions === 0) {
    return "Free trial used";
  }
  if (access.maxSessions === 1) {
    return `1 free trial interview available${lengthSuffix}`;
  }
  return `${access.remainingSessions} of ${access.maxSessions} sessions remaining this month${lengthSuffix}`;
}

/**
 * Whether a duration option should be disabled in the custom-template form.
 *
 * Gated on whether the API told us the allowed set at all, NOT on hasAccess.
 * The original condition (`hasAccess === true && !includes(d)`) inverted
 * itself for an exhausted free user: hasAccess goes false, so every duration
 * became selectable and they could build a 60-minute template their tier can
 * never book.
 */
export function isDurationLocked(
  access: Pick<InterviewAccess, "allowedDurations"> | null | undefined,
  duration: number,
): boolean {
  if (!access?.allowedDurations?.length) return false;
  return !access.allowedDurations.includes(duration);
}
