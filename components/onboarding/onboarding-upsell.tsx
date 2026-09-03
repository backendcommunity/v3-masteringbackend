"use client";

import { usePricing } from "@/hooks/use-pricing";
import { type PublicPricing } from "@/lib/pricing";
import { formatUpsellPrice } from "@/lib/pro-cta";

import styles from "../pages/onboarding-flow.module.css";

interface OnboardingUpsellProps {
  /**
   * The path the learner was just enrolled in. Named in the lede so the
   * offer reads as the continuation of what they chose, not a generic ad.
   */
  pathTitle: string;
  /**
   * Region-resolved Pro price. Three states, and the difference matters:
   *
   *   `undefined` — nobody is supplying one, so this component fetches its
   *                 own copy (the preview route's "Live fetch" mode).
   *   `null`      — the CALLER is supplying one and it has not arrived yet.
   *                 No self-fetch: a second request would race the caller's,
   *                 and the two could disagree.
   *   an object   — use it.
   *
   * The null state exists because of a real bug. The onboarding wizard holds
   * the pricing that `subscribe()` charges against; this card used to fetch
   * its OWN copy in parallel and enable "Go Pro" the moment that landed,
   * while the wizard's copy was still in flight. Clicking then fell through
   * to /checkout instead of opening the payment sheet. Whoever takes the
   * money owns the price.
   */
  pricing?: PublicPricing | null;
  /** Primary action — hand the learner to checkout. */
  onGoPro: () => void;
  /** The free exit. Must always deliver the lesson they already enrolled in. */
  onSkip: () => void;
  /** Disables both actions while a navigation is already in flight. */
  busy?: boolean;
}

/**
 * The payment step of onboarding: shown after the learner's path is enrolled
 * and before they land in it.
 *
 * Pricing is region-resolved and renders BLANK while the fetch is in flight
 * rather than flashing a guessed number — a Nigerian learner briefly seeing
 * a dollar figure is exactly the bug regional pricing exists to prevent (see
 * lib/pro-cta.ts, where both label builders own that contract).
 */
export function OnboardingUpsell({
  pathTitle,
  pricing,
  onGoPro,
  onSkip,
  busy = false,
}: OnboardingUpsellProps) {
  // Only fetch when NO caller is supplying one. `null` means "mine is
  // coming" — see the prop's doc above for why a second request there is a
  // bug rather than a redundancy.
  const ownPricing = usePricing(pricing === undefined);
  const resolved = pricing ?? ownPricing;

  return (
    <section className={styles.upsell} aria-labelledby="onboarding-upsell-title">
      <h2 className={styles.upsellH2} id="onboarding-upsell-title">
        Your path is ready.{" "}
        <span className={styles.upsellAccent}>Go all the way?</span>
      </h2>
      <p className={styles.upsellLede}>
        You&rsquo;re set up for {pathTitle}. Pro opens every step, every project
        review, and the mock interviews.
      </p>

      {/* aria-live: the price arrives after first paint, so a screen reader
          that has already read this card still hears the number land. */}
      <p
        className={styles.upsellPrice}
        id="onboarding-upsell-price"
        aria-live="polite"
      >
        {formatUpsellPrice(resolved)}
        {resolved && <span className={styles.upsellPer}>per month</span>}
      </p>

      {/* Disabled until the price is known. A card that cannot state a price
          must not offer to charge one: the click would reach a subscribe()
          with no pricing, which reports failure, which the wizard reads as
          "inline cannot work" and navigates to /checkout. The learner asked
          to pay and got moved to another page instead.

          The skip below stays enabled throughout — the free exit delivers the
          lesson they are already enrolled in and never depends on a price. */}
      <button
        type="button"
        className={styles.cta}
        onClick={onGoPro}
        disabled={busy || !resolved}
        aria-describedby={
          !resolved ? "onboarding-upsell-price" : undefined
        }
      >
        Go Pro
      </button>

      <div>
        <button
          type="button"
          className={styles.upsellSkip}
          onClick={onSkip}
          disabled={busy}
        >
          Continue with the free plan
        </button>
      </div>
    </section>
  );
}
