"use client";

import { usePricing } from "@/hooks/use-pricing";
import { type PublicPricing } from "@/lib/pricing";
import { formatUpsellPrice, formatUpsellQualifier } from "@/lib/pro-cta";

import styles from "../pages/onboarding-flow.module.css";

interface OnboardingUpsellProps {
  /**
   * The path the learner was just enrolled in. Named in the lede so the
   * offer reads as the continuation of what they chose, not a generic ad.
   */
  pathTitle: string;
  /**
   * Region-resolved Pro price. Optional: when omitted this component fetches
   * its own copy, same contract as PaymentGateOverlay. Callers that already hold
   * pricing (the preview route) pass it so the number is deterministic.
   */
  pricing?: PublicPricing;
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
  // Only fetch when the caller didn't hand us one.
  const ownPricing = usePricing(!pricing);
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
      <p className={styles.upsellPrice} aria-live="polite">
        {formatUpsellPrice(resolved)}
      </p>
      <p className={styles.upsellQual}>{formatUpsellQualifier(resolved)}</p>

      <button
        type="button"
        className={styles.cta}
        onClick={onGoPro}
        disabled={busy}
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
