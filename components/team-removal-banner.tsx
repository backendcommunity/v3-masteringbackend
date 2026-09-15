"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Percent, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { usePricing } from "@/hooks/use-pricing";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/pricing";
import type { TeamRemovalNotice } from "@/lib/data";

/**
 * The dismissal key, per user.
 *
 * sessionStorage because the × "hides it until the next visit", per the
 * approved design. Per-user because sessionStorage belongs to the TAB, not to
 * the sign-in: logout's key sweep (`store/auth.ts`) iterates `localStorage`
 * only and never sees this key, so on a shared browser A could dismiss, log
 * out, and leave B — who is separately entitled to the offer — silently
 * suppressed in the same tab. Keying on the user id is what actually prevents
 * that; the `mb_` prefix alone does not.
 */
function dismissKey(userId: string): string {
  return `mb_team_removal_banner_dismissed_${userId}`;
}

/**
 * A Paddle coupon the product owner created. It applies to BOTH billing
 * cycles, which is why the banner names it once and lets the buyer pick the
 * cycle at checkout rather than branching on it.
 *
 * GLOBAL only. PPP and NG regional prices already sit below a half-price
 * global one, so this code would not apply to them — and a code that does
 * not apply is worse than no code.
 */
const GLOBAL_COUPON_CODE = "50POFF";

function isDismissed(userId: string): boolean {
  try {
    return window.sessionStorage.getItem(dismissKey(userId)) === "1";
  } catch {
    return false;
  }
}

/**
 * The notice, fetched once per signed-in user per page load.
 *
 * `DashboardLayout` is not a shared Next.js layout — it is rendered inside each
 * of ~67 separate `page.tsx` trees, so this banner unmounts and remounts on
 * every in-app navigation. Fetching in the effect alone would therefore run a
 * three-join policy query on every page view, which is the very load the notice
 * was split off `/auth/me` to avoid.
 *
 * Keyed by user id, not bare: a same-tab logout/login must not hand the
 * previous user's notice to the next one. The promise itself is cached, so
 * concurrent mounts share one request rather than racing.
 *
 * A failure caches `null` for the session — the banner is an offer, and no
 * offer is a fine outcome; retrying a policy query on every navigation is not.
 */
let noticeCache: {
  userId: string;
  promise: Promise<TeamRemovalNotice | null>;
} | null = null;

function loadNoticeOnce(
  userId: string,
  fetcher: () => Promise<TeamRemovalNotice>,
): Promise<TeamRemovalNotice | null> {
  if (noticeCache?.userId === userId) return noticeCache.promise;
  const promise = fetcher()
    .then((result) => result ?? null)
    .catch(() => null);
  noticeCache = { userId, promise };
  return promise;
}

/**
 * Test-only. The cache is module state and would otherwise leak between cases.
 */
export function __resetTeamRemovalNoticeCache(): void {
  noticeCache = null;
}

/**
 * Half of a price, rounded DOWN to the cent.
 *
 * $19.99 halves to $9.995. Rounding to nearest would quote $10.00 — more than
 * half of the list price, and a worse-looking number than the $9.99 the offer
 * is meant to read as. Cents are integers here so the arithmetic never lands
 * a penny out through a float.
 */
function halfPrice(amount: number): number {
  return Math.floor(Math.round(amount * 100) / 2) / 100;
}

/**
 * Offers Pro to someone whose Pro access ended because a team removed them.
 *
 * Renders on every page of the dashboard shell, so both of its network calls
 * are gated: the notice is skipped entirely once dismissed, and pricing is
 * only fetched when the banner is actually going to show a price.
 *
 * Prices always come from `usePricing` — the same resolver /pricing and
 * /checkout use — never from a second country list in this component.
 */
export function TeamRemovalBanner() {
  const router = useRouter();
  const user = useUser();
  const store = useAppStore();
  const [notice, setNotice] = useState<TeamRemovalNotice | null>(null);
  // Starts hidden: on the server, and before the effect has read storage,
  // "dismissed" is the assumption that cannot flash a banner at someone who
  // already closed it.
  const [dismissed, setDismissed] = useState(true);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    if (isDismissed(userId)) return;
    setDismissed(false);

    let cancelled = false;
    // Resolved from the session cache after the first navigation, so this is
    // at most one request per signed-in user per page load.
    loadNoticeOnce(userId, store.getTeamRemovalNotice).then((result) => {
      if (!cancelled) setNotice(result);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, store]);

  const show = !dismissed && notice?.show === true;

  // Gated: /public/pricing is requested only for the few users who see this.
  const pricing = usePricing(show);

  if (!show) return null;

  const dismiss = () => {
    try {
      if (userId) window.sessionStorage.setItem(dismissKey(userId), "1");
    } catch {
      /* private mode — hiding for this view is enough */
    }
    setDismissed(true);
  };

  const isGlobal = pricing?.tier === "GLOBAL";
  const teamName = notice?.teamName?.trim() || "your team";

  const pill = !pricing
    ? null
    : isGlobal
      ? { label: "50% OFF", ghost: false }
      : { label: pricing.tier === "NG" ? "Naira pricing" : "Regional price", ghost: true };

  return (
    <div className="border-b border-cyan-200/70 bg-gradient-to-r from-cyan-50 to-transparent dark:border-cyan-900/50 dark:from-cyan-950/50">
      <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
        <div className="hidden h-8 w-8 flex-none place-items-center rounded-lg bg-cyan-500 text-[#04222b] sm:grid">
          {isGlobal ? (
            <Percent className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Your Pro access through {teamName} has ended
          </p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            {!pricing ? (
              // Pricing has not resolved yet. The message and the CTA still
              // stand on their own; a figure that might be the wrong region's
              // does not, so nothing is quoted until it arrives.
              <>Carry on from exactly where you stopped.</>
            ) : isGlobal ? (
              <>
                Keep going with 50% off — use code{" "}
                <span className="rounded border border-dashed border-cyan-600 bg-muted px-1.5 py-0.5 font-mono text-xs font-bold tracking-wide text-cyan-700 dark:text-cyan-400">
                  {GLOBAL_COUPON_CODE}
                </span>{" "}
                at checkout. <s className="opacity-60">{formatPrice(pricing.monthly, pricing.currency)}</s>{" "}
                <strong className="text-foreground">
                  {formatPrice(halfPrice(pricing.monthly), pricing.currency)}
                </strong>
                /month, or <s className="opacity-60">{formatPrice(pricing.annual, pricing.currency)}</s>{" "}
                <strong className="text-foreground">
                  {formatPrice(halfPrice(pricing.annual), pricing.currency)}
                </strong>
                /year.
              </>
            ) : (
              <>
                Pro is{" "}
                <strong className="text-foreground">
                  {formatPrice(pricing.monthly, pricing.currency)}
                </strong>
                /month or{" "}
                <strong className="text-foreground">
                  {formatPrice(pricing.annual, pricing.currency)}
                </strong>
                /year
                {pricing.tier === "PPP" ? " at your region's pricing" : ""} — carry on from exactly
                where you stopped.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-none items-center gap-2 sm:gap-3">
          {pill && (
            <span
              className={
                pill.ghost
                  ? "hidden whitespace-nowrap rounded-full border border-cyan-700 px-2.5 py-0.5 text-[11.5px] font-bold text-cyan-700 dark:border-cyan-400 dark:text-cyan-400 md:inline-block"
                  : "hidden whitespace-nowrap rounded-full bg-cyan-500 px-2.5 py-0.5 text-[11.5px] font-bold text-[#04222b] md:inline-block"
              }
            >
              {pill.label}
            </span>
          )}
          <Button
            size="sm"
            onClick={() => router.push("/checkout?plan=pro&cycle=monthly")}
            className="bg-cyan-700 font-semibold text-white hover:bg-cyan-800"
          >
            Get Pro
          </Button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
