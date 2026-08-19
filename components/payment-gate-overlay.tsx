"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "./ui/button";
import { JourneyGlyph } from "./journey-glyph";
import { PathFeedbackDialog } from "./pages/path/path-feedback-dialog";
import { useUser } from "@/hooks/use-user";
import { usePricing } from "@/hooks/use-pricing";
import {
  useContentPurchase,
  type PurchasableContent,
} from "@/hooks/use-content-purchase";
import { analytics } from "@/lib/analytics";
import { withGeoOverride } from "@/lib/geo-override";
import {
  monthlyEquivalent,
  formatPrice,
  type PublicPricing,
} from "@/lib/pricing";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

/**
 * The paywall, in two shells that share everything except their geometry.
 *
 * `variant="sheet"` — a full-bleed bottom sheet for the four full-screen
 * in-lesson surfaces. Flush to the left, right and bottom viewport edges,
 * square outer corners, no shadow, and NO backdrop: the lesson above stays
 * at full brightness and full legibility. It is covered, not veiled. This is
 * a HARD WALL — no X, no Escape, no click-out. The only way past it is the
 * bordered exit button, which navigates somewhere the learner can actually
 * use.
 *
 * `variant="centered"` — the dismissible form, for browse and purchase pages
 * where a full-width sheet would read as an ad banner. Keeps its X, its
 * Escape handler and its dimmed backdrop.
 *
 * Both shells keep focus management, the focus trap, scroll lock and
 * role/aria-modal. Losing Escape on the sheet makes the trap MORE load
 * bearing, not less: the exit button and the CTA are the only way out, so a
 * keyboard user has to be able to reach them.
 *
 * ── Provider routing (unchanged) ─────────────────────────────────────
 * Subscribe hands off to /checkout and deliberately does NOT open Paddle or
 * AsyncPay directly. An overlay can know the region-resolved PRICE (from
 * GET /public/pricing) but not the price ID or processor that price belongs
 * to; an earlier inline-Paddle version quoted a Nigerian buyer ₦9,999 and
 * charged them the legacy USD amount. /checkout resolves provider, currency
 * and price ID together, server-side, from one region — ASYNCPAY for Nigeria,
 * Paddle elsewhere.
 */

export interface PaymentGateOverlayProps {
  open: boolean;
  onClose: () => void;
  /** What the learner hit the wall on — named in the subheading. */
  itemTitle: string;
  /** Lights the matching pillar of the Learn → Build → Grow glyph. */
  stage?: "learn" | "build" | "grow";
  /**
   * Full-bleed bottom sheet (in-lesson, hard wall) or centered dismissible
   * panel (browse and purchase pages).
   */
  variant?: "sheet" | "centered";
  /**
   * Sheet only. The single exit: its label and where it goes. Each surface
   * names somewhere the learner can actually continue from — the dashboard,
   * the path, the course — never a dead end.
   */
  exitLabel?: string;
  exitHref?: string;
  /** Region-resolved price. Fetched here when the caller has none. */
  pricing?: PublicPricing;
  /** The gated item, in the shape the one-off rails need. */
  purchasable?: PurchasableContent;
  allowOneTime?: boolean;
  /**
   * Bootcamp cohorts can forbid the subscription rail
   * (`cohort.allowsSubscription === false`); the gate must not advertise a
   * plan that would not unlock the thing being bought.
   */
  allowSubscription?: boolean;
  /** Which plan the subscription rail sells. Drives copy and the checkout link. */
  planName?: "Pro" | "Enterprise";
  /** Copy overrides for surfaces that sell a product rather than gate content. */
  headline?: string;
  subheading?: string;
  benefits?: string[];
  onPurchased?: (id: string, method: string, success: boolean) => void;
  /** Centered variant only — the sheet has no soft exit by design. */
  onContinueFree?: () => void;
}

/** Three, not four: the sheet is ~45vh and a fourth line crowds the CTA. */
const PRO_BENEFITS = [
  "Every learning path and premium course, end to end",
  "All projects, with code review on each submission",
  "Unlimited AI mock interviews with a scored report",
];

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/**
 * Keeps `Unlock {title} and get lessons…` to a predictable length.
 *
 * Clamping the rendered line was the obvious fix and the wrong one: the
 * personalisation claim sits at the END of the sentence, so a line clamp
 * removes the only part doing persuasive work. Bounding the title leaves the
 * sentence intact and stops a long path name pushing the CTA down the panel.
 */
const MAX_TITLE_IN_SUBHEADING = 46;

export function truncateForSubheading(title: string): string {
  if (title.length <= MAX_TITLE_IN_SUBHEADING) return title;
  // Cut on a word boundary so it does not read as a rendering glitch.
  const cut = title.slice(0, MAX_TITLE_IN_SUBHEADING);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trimEnd()}\u2026`;
}

function methodsLine(pricing: PublicPricing | null): string {
  if (!pricing) return "";
  return pricing.currency === "NGN"
    ? "Card · Bank transfer · USSD"
    : "Card · PayPal · Apple Pay";
}

/**
 * Reference-counted scroll lock.
 *
 * Naively saving and restoring `body.overflow` per instance breaks the moment
 * two overlays overlap: the second saves "hidden" from the first, and
 * whichever unmounts last writes that back, leaving the page permanently
 * unscrollable. Counting means only the last overlay out restores the
 * original value.
 */
let scrollLockCount = 0;
let scrollLockPrevious = "";

function lockScroll() {
  if (scrollLockCount === 0) {
    scrollLockPrevious = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}

function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = scrollLockPrevious;
  }
}

export function PaymentGateOverlay({
  open,
  onClose,
  itemTitle,
  stage = "learn",
  variant = "centered",
  exitLabel = "Return to dashboard",
  exitHref,
  pricing,
  purchasable,
  allowOneTime = true,
  allowSubscription = true,
  planName = "Pro",
  headline,
  subheading,
  benefits,
  onPurchased,
  onContinueFree,
}: PaymentGateOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const ownPricing = usePricing(!pricing && open);
  const resolved = pricing ?? ownPricing;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const isSheet = variant === "sheet";

  const { buyOnce, payWithAsyncpay } = useContentPurchase({
    data: purchasable ?? {},
    onPurchased: (id, method, success) => {
      onPurchased?.(id, method, success);
      if (success) onClose();
    },
    onCheckoutOpened: onClose,
  });

  // Portals need a DOM target, which does not exist during SSR.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    analytics.track("payment_gate_viewed", {
      itemTitle,
      stage,
      planName,
      variant,
    });
  }, [open, itemTitle, stage, planName, variant]);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    return unlockScroll;
  }, [open]);

  // Focus management: remember what was focused, move focus in, restore out.
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    // Focus the panel itself rather than the first control, so a screen
    // reader announces the heading before the buyer lands on a button.
    const id = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(id);
      restoreFocusTo.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Escape dismisses the centered panel only. The sheet is a hard wall:
      // swallowing Escape there is the point, not an oversight.
      if (event.key === "Escape" && !isSheet) {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      // Shift+Tab off the first control wraps to the last, and vice versa —
      // without this, Tab walks straight out into the page behind, which on
      // the sheet would strand a keyboard user outside a wall they cannot
      // dismiss.
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose, isSheet],
  );

  if (!open || !mounted) return null;

  const annualEquivalent = resolved
    ? monthlyEquivalent(resolved, "annual")
    : "";
  const monthlyRate = resolved
    ? formatPrice(resolved.monthly, resolved.currency)
    : "";

  const oneTimeAmount =
    allowOneTime &&
    typeof purchasable?.amount === "number" &&
    purchasable.amount > 0
      ? purchasable.amount
      : null;

  const isNigerian =
    user?.country?.toLowerCase() === "nigeria" ||
    user?.country?.toLowerCase() === "ng";
  const showPaystack = Boolean(isNigerian && purchasable?.asyncpay_plan_id);
  const hasSecondaryRails =
    oneTimeAmount != null || showPaystack;

  const handleSubscribe = () => {
    analytics.track("payment_gate_subscribe", {
      itemTitle,
      plan: planName,
      variant,
      country: resolved?.country ?? null,
    });
    router.push(
      withGeoOverride(
        `/checkout?plan=${planName.toLowerCase()}&cycle=annual`,
        null,
      ),
    );
    onClose();
  };

  const handleContinueFree = () => {
    analytics.track("payment_gate_continue_free", { itemTitle });
    if (onContinueFree) onContinueFree();
    else onClose();
  };

  // The reference's left panel, rebuilt with our own content.
  //
  // A big, thick ring bleeding off the bottom of the panel; the glyph sits
  // inside it where the reference puts a photograph; pills sit ON the ring's
  // stroke, clustered along the upper-left arc rather than spread evenly all
  // the way round — that asymmetry is what makes the reference read as a
  // composition instead of a diagram.
  //
  // Angles are screen-space degrees (0 = 3 o'clock, negative = upward), and
  // each pill carries its own radius so some ride the outer edge and some the
  // inner, exactly as the reference staggers them. Computing positions rather
  // than hand-placing percentages keeps them locked to the ring at any size.
  //
  // No photograph and no third-party logos: nothing here is licensed from
  // anyone. The tagged pills carry values that are actually this learner's,
  // because the subheading promises personalisation and these are the only
  // element on the page that demonstrates any.
  const ringPills: ({
    angle: number;
    radius: number;
  } & (
    | { kind: "stack"; label: string }
    | { kind: "value"; tag: string; value: string }
  ))[] = [
    { kind: "stack", label: "System Design", angle: -78, radius: 0.5 },
    { kind: "stack", label: "PostgreSQL", angle: -118, radius: 0.44 },
    { kind: "value", tag: "stage", value: stage, angle: -152, radius: 0.53 },
    { kind: "stack", label: "Redis", angle: 172, radius: 0.46 },
    { kind: "stack", label: "Docker", angle: 154, radius: 0.5 },
  ];

  const mobileBrandBand = (
    <div className="relative h-[104px] overflow-hidden bg-[#0E1F33] shadow-[0_10px_28px_rgba(0,0,0,.35)] sm:hidden">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute -right-6 top-1/2 aspect-square h-[210%] -translate-y-1/2 rounded-full border-[26px] border-[#12708A]"
      />
      <JourneyGlyph
        stage={stage}
        className="absolute right-[38px] top-1/2 w-[74px] -translate-y-1/2"
      />
      <div className="relative flex h-full flex-col justify-center px-6">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
          {stage}
        </span>
        <span className="mt-1 text-[15px] font-semibold text-white">
          Mastering&nbsp;Backend
        </span>
      </div>
    </div>
  );

  const leftPanel = (
    <div className="relative z-10 hidden overflow-hidden bg-[#0E1F33] shadow-[10px_0_36px_rgba(0,0,0,.42)] sm:block">
      {/* The app's own hero texture — diamond linework with star points —
          rather than a flat fill. Same class the dashboard, courses, projects
          and eight other heroes use, so the panel is recognisably ours. */}
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      {/* A soft lift behind the ring so the ground reads as lit rather than
          flat. Kept low-alpha: it has to lighten without washing out the star
          points above it or competing with the cyan. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 45% 58%, rgba(255,255,255,.11) 0%, rgba(255,255,255,.045) 38%, rgba(255,255,255,0) 72%)",
        }}
      />

      {/* Ring box: square, taller than the panel, so the ring bleeds off the
          bottom edge the way the reference's does. Everything else positions
          against this box, so the composition scales as one unit. */}
      <div className="absolute left-[26%] top-[6%] z-10 aspect-square h-[104%]">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-[clamp(30px,4vw,68px)] border-[#12708A]"
        />

        {/* Ring colour is a DIMMED cyan, not the full brand #13AECE: at full
            saturation it out-shouts the headline on the white panel beside it
            and the star texture behind it. Lower contrast against the navy
            keeps it part of the ground rather than the loudest thing on the
            sheet. */}

        {/* The glyph takes the photograph's place, inside the ring. */}
        <JourneyGlyph
          stage={stage}
          className="absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2"
        />

        {ringPills.map((pill) => {
          const rad = (pill.angle * Math.PI) / 180;
          const style = {
            left: `${50 + pill.radius * 100 * Math.cos(rad)}%`,
            top: `${50 + pill.radius * 100 * Math.sin(rad)}%`,
            transform: "translate(-50%, -50%)",
          };
          return pill.kind === "stack" ? (
            <span
              key={pill.label}
              style={style}
              className="absolute z-10 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0E1F33] shadow-[0_10px_28px_rgba(0,0,0,.35)]"
            >
              {pill.label}
            </span>
          ) : (
            <span key={pill.tag} style={style} className="absolute z-10 max-w-[12rem]">
              <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
                {pill.tag}
              </span>
              <span className="block truncate rounded-lg bg-[#24384F] px-3.5 py-2 text-[13px] font-medium capitalize text-white shadow-[0_10px_28px_rgba(0,0,0,.35)]">
                {pill.value}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );

  const rightPanel = (
    <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto bg-white p-6 sm:gap-5 text-left text-[#0B1522] sm:p-10">
      {isSheet && (
        // The one and only exit. A navigation, not a dismissal — closing the
        // sheet in place would drop the learner back onto content they still
        // cannot open.
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="h-11 border-[#0B1522]/20 bg-white text-[#0B1522] hover:bg-[#0B1522]/[.04] hover:text-[#0B1522] focus-visible:ring-[#0B7C93] sm:h-9" asChild>
            <Link href={exitHref ?? routes.dashboard}>{exitLabel}</Link>
          </Button>
        </div>
      )}

      <div className="flex max-w-[40rem] flex-1 flex-col justify-center gap-4 sm:gap-5">
        <div className="space-y-1.5">
          <h2
            id="payment-gate-headline"
            className="text-[23px] font-bold leading-[1.25] tracking-tight sm:text-[33px] sm:leading-[1.2]"
          >
            {headline ?? "You’re out of free content. Subscribe to keep going"}
          </h2>
          <p
            id="payment-gate-subheading"
            className="text-[16px] font-semibold leading-snug text-[#0B7C93]"
          >
            {subheading ??
              `Unlock ${truncateForSubheading(itemTitle)} and get lessons entirely personalized to you.`}
          </p>
        </div>

        {allowSubscription && (
          <>
            <ul className="space-y-3" role="list">
              {(benefits ?? PRO_BENEFITS).map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#0E7E96]"
                    aria-hidden="true"
                  />
                  <span className="text-[16px] leading-snug">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA and price share one baseline — the price is a fact about
                the button beside it, not a separate stacked block. */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-4 pt-1">
              <Button
                size="lg"
                className="w-full bg-[#0B7C93] px-7 text-[16px] font-semibold text-white shadow-none hover:bg-[#09677B] focus-visible:ring-[#0B7C93] sm:w-auto"
                onClick={handleSubscribe}
              >
                Subscribe Now
              </Button>
              {/* Renders only once the region resolves — a paywall that
                  flashes the wrong currency is the exact failure regional
                  pricing exists to prevent. */}
              {resolved && (
                <p className="flex items-baseline gap-2">
                  {/* The largest element in the panel, deliberately. The
                      reference sets its price ABOVE the headline in size —
                      money stated confidently, not apologised for. */}
                  <span className="text-[37px] font-bold leading-none tabular-nums sm:text-[44px]">
                    {annualEquivalent}
                  </span>
                  <span className="text-[14px] text-[#0B1522]/55">
                    per month, billed annually
                  </span>
                </p>
              )}
            </div>

            {resolved && (
              <p className="text-[14px] text-[#0B1522]/55">
                or {monthlyRate} billed monthly &middot; {methodsLine(resolved)}
              </p>
            )}
          </>
        )}

        {hasSecondaryRails && (
          <div className="flex flex-wrap gap-2">
            {oneTimeAmount != null && (
              <Button variant="outline" size="sm" className="h-11 border-[#0B1522]/20 bg-white text-[#0B1522] hover:bg-[#0B1522]/[.04] hover:text-[#0B1522] focus-visible:ring-[#0B7C93] sm:h-9" onClick={buyOnce}>
                Buy once &middot;{" "}
                <span className="tabular-nums">
                  {formatPrice(oneTimeAmount, "USD")}
                </span>
              </Button>
            )}
            {showPaystack && (
              <Button variant="outline" size="sm" className="h-11 border-[#0B1522]/20 bg-white text-[#0B1522] hover:bg-[#0B1522]/[.04] hover:text-[#0B1522] focus-visible:ring-[#0B7C93] sm:h-9" onClick={payWithAsyncpay}>
                Pay with Paystack
              </Button>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-[#0B1522]/70",
            !isSheet && "flex-col items-start gap-y-2",
          )}
        >
          <span>Not ready to upgrade?</span>
          <button
            type="button"
            onClick={() => {
              analytics.track("payment_gate_tell_us_why", { itemTitle });
              setFeedbackOpen(true);
            }}
            className="rounded font-semibold text-[#0B7C93] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7C93]"
          >
            Tell us why
          </button>
          {/* Soft exits belong to the dismissible variant only. */}
          {!isSheet && (
            <>
              <button
                type="button"
                onClick={handleContinueFree}
                className="rounded font-medium text-[#0B1522] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7C93]"
              >
                Continue with the free plan
              </button>
              <Link
                href={routes.pricing(pathname ?? undefined)}
                className="rounded font-semibold text-[#0B7C93] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7C93]"
              >
                Compare all plans
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const sharedPanelProps = {
    ref: panelRef,
    role: "dialog" as const,
    "aria-modal": true,
    "aria-labelledby": "payment-gate-headline",
    "aria-describedby": "payment-gate-subheading",
    tabIndex: -1,
    onKeyDown,
  };

  const overlay = isSheet ? (
    <>
      {/* Scrim. Dimmed, NOT defocused — the content behind keeps its crisp
          edges and simply drops in contrast. A blurred version was explicitly
          rejected, so nothing here may grow a backdrop-filter.

          Full viewport, so the top nav is veiled along with the body, and
          rendered inside this same portal so the stacking is self-contained
          rather than at the mercy of ambient z-index on the host page.

          Decoration only: deliberately no onClick. This is a hard wall, so
          clicking the scrim must no more dismiss it than Escape does. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[99] bg-[#0E1F33]/60"
      />
      {/* Flush to the left, right and bottom edges, and fully opaque so the
          scrim never shows through the sheet itself.

          Height is content-driven within a 45vh floor and a 70vh ceiling. A
          hard 45vh clipped the footer as soon as a secondary rail was
          present, and a paywall whose "tell us why" link is scrolled out of
          sight is a worse wall than a slightly taller one. */}
      <div
        {...sharedPanelProps}
        className="fixed inset-x-0 bottom-0 z-[100] grid max-h-[88vh] min-h-[60vh] grid-cols-1 bg-white outline-none sm:max-h-[70vh] sm:min-h-[45vh] sm:grid-cols-[42fr_58fr]"
      >
        {mobileBrandBand}
        {leftPanel}
        {rightPanel}
      </div>
    </>
  ) : (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#0E1F33]/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        // Only a click that both starts and ends on the backdrop dismisses —
        // a drag that begins inside the panel and releases outside must not.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        {...sharedPanelProps}
        className="relative my-auto grid max-h-[85vh] w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-2xl outline-none sm:grid-cols-[42fr_58fr]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-md text-white/70 sm:h-auto sm:w-auto transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7C93] sm:p-1.5 sm:text-[#0B1522]/50 sm:hover:bg-[#0B1522]/[.06] sm:hover:text-[#0B1522]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        {mobileBrandBand}
        {leftPanel}
        {rightPanel}
      </div>
    </div>
  );

  return (
    <>
      {createPortal(overlay, document.body)}
      {/* The product's existing feedback pipe (it posts to Slack), reused
          with a "payment-gate" source rather than a second channel nobody
          watches. */}
      <PathFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        source="payment-gate"
        // Above the paywall's own z-[100]: this dialog is opened FROM the
        // paywall, so at the shared z-50 default it renders underneath it.
        className="z-[120]"
        overlayClassName="z-[110]"
        context={{ url: pathname ?? undefined }}
        trigger={<span className="hidden" />}
      />
    </>
  );
}
