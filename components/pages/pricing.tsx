"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Check, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useUser } from "@/hooks/use-user";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { sanitizeRedirect } from "@/lib/safe-redirect";
import { PRICING_EVENTS } from "@/lib/analytics-events";
import {
  enterprisePerUserMonthlyDisplay,
  formatPrice,
  monthlyEquivalent,
  type PublicEnterprisePricing,
  type PublicPricing,
} from "@/lib/pricing";
import { classifyPremiumTierStatus } from "@/lib/subscription-pricing";

interface PricingViewProps {
  pricing: PublicPricing;
}

type BillingCycle = "monthly" | "annual";

const FREE_FEATURES: { label: string; included: boolean }[] = [
  { label: "First steps of every path and course", included: true },
  { label: "Public portfolio and profile", included: true },
  { label: "XP, streaks, and the leaderboard", included: true },
  { label: "Premium path and course steps", included: false },
  { label: "AI mock interviews and reports", included: false },
  { label: "Verified certificates", included: false },
];

const PRO_FEATURES: string[] = [
  "Every path, course, and premium step",
  "All projects, with code review on each submission",
  "Unlimited coding exercises in the playground",
  "AI mock interviews with a scored report",
  "Verified, shareable certificates",
  "Priority support",
];

// What Enterprise adds ON TOP of Pro — deliberately not a repeat of
// PRO_FEATURES; the card leads with an "Everything in Pro, plus:" line (see
// the Enterprise card below) so this array lists only the delta. Mirrors
// what lib/data.ts's Enterprise plan record (source of /subscription/plans)
// already attributes to this tier: an included team allotment beyond which
// extra seats are billed separately, cohort-based bootcamps, certification
// exams, 1-on-1 mentorship, and career placement assistance.
const ENTERPRISE_FEATURES: string[] = [
  // Was "Team seats for up to 5 members ($10/seat after that)" — that
  // allotment-plus-overage model is gone. Enterprise is priced per user from
  // the first seat, so the feature line says what the buyer now controls.
  "A seat for every team member, priced per user",
  "Structured, cohort-based bootcamps",
  "Certification exams",
  "1-on-1 mentorship with industry experts",
  "Dedicated career placement assistance",
];

// Learners work at these companies — see the trusted-by band below the
// "Compare features" anchor. Same list as the marketing site's
// ALUMNI_COMPANIES (app/page.tsx in the landing-page repo); kept as a plain
// name list here since this page renders them as text wordmarks, not logos.
const TRUSTED_BY_COMPANIES: string[] = [
  "Kuda",
  "Paystack",
  "Cowrywise",
  "Flutterwave",
  "Andela",
  "Amazon",
  "Google",
  "Meta",
  "Netflix",
  "Shopify",
  "Stripe",
  "Uber",
];

type CompareCell = "yes" | "no" | string;

const COMPARE_GROUPS: {
  name: string;
  rows: {
    label: string;
    free: CompareCell;
    pro: CompareCell;
    enterprise: CompareCell;
  }[];
}[] = [
  {
    name: "Learn",
    rows: [
      {
        label: "First steps of every path",
        free: "yes",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Every path and course, end to end",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Coding exercises in the playground",
        free: "Limited",
        pro: "yes",
        enterprise: "yes",
      },
    ],
  },
  {
    name: "Build",
    rows: [
      {
        label: "Guided projects",
        free: "Starter only",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Code review on submissions",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
      { label: "Public portfolio", free: "yes", pro: "yes", enterprise: "yes" },
    ],
  },
  {
    name: "Grow",
    rows: [
      {
        label: "AI mock interviews",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Scored interview reports",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Verified certificates",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "XP, streaks, leaderboard",
        free: "yes",
        pro: "yes",
        enterprise: "yes",
      },
    ],
  },
  {
    // Sourced from lib/data.ts's Enterprise plan record (the same data
    // /subscription/plans reads) — nothing here is claimed that isn't
    // already sold on that page. Every row here is genuinely exclusive to
    // Enterprise (neither Free nor Pro offers any of it), so Free/Pro cells
    // carry the same muted mark every other excluded feature uses. They used
    // to spell out "Enterprise Only", which said nothing the column heading
    // doesn't already say and broke the scan-down rhythm of the marks
    // column.
    name: "Team & enterprise",
    rows: [
      // Per-user pricing replaced the old "5 included, $10/seat after"
      // model, so there is no allotment to state and no overage rate — the
      // seat count IS the price. The single row that remains says the one
      // thing a buyer needs from this table; the exact per-seat figure is on
      // the column header above, region-priced, and would only drift if
      // restated here.
      {
        label: "Per-user pricing, from 2 seats",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
      {
        label: "Structured, cohort-based bootcamps",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
      {
        label: "Certification exams",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
      {
        label: "1-on-1 mentorship with industry experts",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
      {
        label: "Dedicated career placement assistance",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
    ],
  },
  {
    name: "Support",
    rows: [
      { label: "Community", free: "yes", pro: "yes", enterprise: "yes" },
      { label: "Priority support", free: "no", pro: "yes", enterprise: "yes" },
    ],
  },
];

function currencySymbol(currency: "NGN" | "USD"): string {
  return currency === "NGN" ? "₦" : "$";
}

// Table-header price line — "Free", "₦8,333 /month billed annually",
// "$83.33 /month billed annually". Shared by the Pro and Enterprise header
// cells so both read identically save for the amount.
function tablePriceLine(
  planPricing: Pick<PublicPricing, "monthly" | "annual" | "currency">,
  cycle: BillingCycle,
): string {
  return `${monthlyEquivalent(planPricing, cycle)} /month${
    cycle === "annual" ? " billed annually" : ""
  }`;
}

/**
 * Where a team goes when they cannot buy per-seat online.
 *
 * There is no contact/support route in lib/routes.ts (checked — the routes
 * table has dashboard, courses, billing, subscription, XP store and auth, and
 * nothing sales- or contact-shaped), and no /contact page exists under app/.
 * So this is a mailto to the address the site already publishes as its own
 * (lib/seo.ts's organization email) rather than an invented route that would
 * 404. Replace with a real route the moment one exists.
 *
 * The subject line is pre-filled so the reply lands with context instead of
 * an empty "Enterprise" thread.
 */
const SALES_CONTACT_HREF = `mailto:hi@masteringbackend.com?subject=${encodeURIComponent(
  "Enterprise plan — team pricing",
)}`;

/**
 * Enterprise's line in the comparison-table header. Must read the same as the
 * card's price block, because a buyer who scrolls from one to the other and
 * sees two different numbers stops trusting both — hence the shared
 * per-user-monthly formatter and the identical "per user" qualifier.
 */
function enterpriseTablePriceLine(
  enterprise: PublicEnterprisePricing,
  cycle: BillingCycle,
): string {
  return `${enterprisePerUserMonthlyDisplay(enterprise, cycle)} per user /month${
    cycle === "annual" ? " billed annually" : ""
  }`;
}

function CompareMark({ value }: { value: CompareCell }) {
  if (value === "yes") {
    return (
      <Check
        className="mx-auto h-5 w-5 text-primary"
        strokeWidth={3}
        aria-label="Included"
      />
    );
  }
  if (value === "no") {
    return (
      <X
        className="mx-auto h-5 w-5 text-muted-foreground/40"
        aria-label="Not included"
      />
    );
  }
  return (
    <span className="text-sm font-medium text-muted-foreground">{value}</span>
  );
}

export default function PricingView({ pricing }: PricingViewProps) {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  // Testimonial avatar: try the real headshot first, fall back to the "MO"
  // initials chip if the asset is missing or fails to load (next/image's
  // `unoptimized` mode still fires a native `error` event on a 404, so this
  // catches the file-not-there case cleanly — no need to check existence
  // ahead of time).
  const [avatarPhotoFailed, setAvatarPhotoFailed] = useState(false);
  const user = useUser();
  const searchParams = useSearchParams();
  const fromOnboarding = searchParams?.get("from") === "onboarding";
  // Onboarding forwards its own `redirect` (the learner's just-enrolled
  // lesson, or an OAuth existing-user / deep-link destination — see
  // onboarding-flow.tsx and dashboard-layout.tsx) through the upsell so
  // skipping doesn't erase it.
  //
  // MUST stay sanitised: this value is rendered as an <a href>, not passed to
  // router.push, so `?redirect=javascript:alert(1)` would be a
  // script-executing link. sanitizeRedirect accepts same-origin relative
  // paths only and falls back to the dashboard for everything else.
  const freePlanHref = sanitizeRedirect(searchParams?.get("redirect"));

  useEffect(() => {
    analytics.track(PRICING_EVENTS.viewed, {
      tier: pricing.tier,
      country: pricing.country,
      cycle,
    });
    // Fire once per page view, on the cycle the page loaded with — toggling
    // the switch afterward shouldn't re-fire "viewed".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkoutHref = `/checkout?plan=pro&cycle=${cycle}`;
  const freeCtaIsCurrent = Boolean(user && !user.isPremium);
  // A subscriber must never be offered a SECOND subscription. Onboarding now
  // routes everyone through this page, so a grandfathered Pro user lands here
  // routinely — same guard subscription-plans.tsx already applies to its own
  // cards (see classifyFreeCardCta / classifyGrandfathered). /checkout carries
  // the matching guard so a bookmarked or hand-typed URL is covered too.
  //
  // tierStatus distinguishes Pro from Enterprise subscribers (see
  // classifyPremiumTierStatus) now that this page sells both — an Enterprise
  // subscriber must not see the Pro card's "You're on Pro" badge, and a Pro
  // subscriber must not see a second "current plan" badge on the Enterprise
  // card, just a sensible upgrade path.
  const tierStatus = classifyPremiumTierStatus(
    user?.isPremium,
    user?.subscription?.name ?? user?.subscription?.plan?.name,
  );
  const isPro = tierStatus === "pro";
  const isEnterprise = tierStatus === "enterprise";

  // Enterprise is region-priced too, and now PER USER — the figures arrive
  // on the same region-resolved object Pro's do (see lib/pricing.ts's nested
  // `enterprise`), so a Nigerian sees ₦15,000/user and a US visitor $25/user
  // from one source of truth rather than a static mirror that could drift
  // from what checkout charges.
  const enterprise = pricing.enterprise;

  // The whole regional branch, in one place: can this visitor's region be
  // charged per seat at all?
  //
  // `selfServe` is decided once, on the backend, from whether that region's
  // payment provider accepts a seat quantity (see enterpriseSelfServe() in
  // academy's src/extensions/payment/pricing/tiers.ts — it names the SDK that
  // cannot and why). This component holds NO country list and NO tier
  // comparison; it reads the flag. When the limitation lifts, the backend
  // flips one boolean and this page becomes self-serve everywhere with no
  // edit here.
  //
  // What changes when it is false: the CTA goes to sales instead of
  // checkout. The PRICE is still shown — the per-user rate is the same real
  // ₦15,000 either way, and hiding it would make the card useless to exactly
  // the buyers it is for.
  const enterpriseSelfServe = enterprise.selfServe;

  // Card, CTA, features — nothing else. Team size is a checkout-time
  // decision now: the buyer picks their seat count on /checkout, where the
  // total is computed and shown before they pay (see checkout.tsx's
  // SeatSelector). This card only ever quotes the per-user rate, so no seat
  // count travels on the link — checkout defaults to the plan's minimum and
  // lets the buyer change it there.
  const enterpriseCtaHref = `/checkout?plan=enterprise&cycle=${cycle}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal standalone header — this page must work for logged-out visitors */}
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href={routes.dashboard} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0E1F33]">
              <Image
                src="/main-logo.png"
                alt="Mastering Backend"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="hidden text-sm font-bold tracking-tight sm:inline">
              MasteringBackend
            </span>
          </Link>
          {user ? (
            fromOnboarding ? (
              // Sticky header keeps this reachable without scrolling on any
              // viewport, including a 667px-tall mobile screen — the free
              // tier is one tap away, this is a nudge, not a wall. Outline
              // (not ghost) so it reads as a deliberate choice, not ambient
              // chrome, at a glance.
              <Button size="sm" variant="outline" asChild>
                <Link href={freePlanHref}>Continue with the free plan</Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href={routes.dashboard}>Go to dashboard</Link>
              </Button>
            )
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#0e1f33] px-4 pb-0 pt-20 text-center text-white">
        {/* A page title, not a billboard — the reference sets this line at
            roughly 2rem on desktop and never larger, so the size now tops
            out at text-[2rem] instead of climbing to text-5xl / 2.75rem as
            it used to (48px at lg, 44px at 1920 — a display size that
            swallowed the plan cards beneath it). One straight line from xl:
            up, where 2rem needs ~980px and any xl viewport has that to
            spare; below xl the headline wraps normally (text-balance) like
            any stacked headline. The accent span is untouched: same size as
            the rest of the line, only coloured. */}
        <h1 className="mx-auto max-w-xl text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight sm:max-w-2xl sm:text-3xl lg:max-w-3xl lg:text-[2rem] xl:max-w-none xl:whitespace-nowrap">
          Learn the <span className="text-primary">Engineering Skills</span> you
          need to advance your career.
        </h1>

        {/* ── Plan cards ──
            Joined into one panel at lg: gap-0 butts the three cards edge to
            edge and Free/Enterprise round only their outer corners, so the
            trio reads as one white panel sitting on the dark ground. There
            is deliberately NO enclosing outline — the reference has none,
            and the outer border this used to carry (lg:rounded-2xl
            lg:border lg:border-white/15) drew a second, larger rectangle
            around the cards that the eye read as a stray frame. The cards
            are opaque bg-card, so their own edges are all the definition
            the grouping needs.

            items-center (instead of the default grid stretch) lets each
            card keep its own natural height — Pro's is taller from its
            extra content, so it centers proud of Free/Enterprise on both
            edges without any manual margin/translate hack. Below lg the
            cards stay stacked and independently rounded. */}
        <div className="mx-auto mt-14 grid max-w-[796px] grid-cols-1 items-start justify-items-center gap-6 lg:max-w-[1120px] lg:grid-cols-3 lg:items-center lg:justify-items-stretch lg:gap-0">
          {/* Free */}
          <div className="w-full max-w-[380px] rounded-2xl bg-card p-8 text-left text-card-foreground lg:max-w-none lg:rounded-none lg:rounded-l-2xl">
            {/* Name first, eyebrow beneath — the reference's order. Default
                ink; Free carries no accent colour. */}
            <h2 className="text-2xl font-bold tracking-tight">Free</h2>
            <p className="mb-5 mt-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Limited access
            </p>
            <div className="flex min-h-[62px] items-baseline">
              <span className="text-5xl font-extrabold tracking-tight">
                Free
              </span>
            </div>
            <p className="mt-3 font-mono text-[11.5px] text-muted-foreground">
              Forever. No card.
            </p>

            {freeCtaIsCurrent ? (
              <Button
                disabled
                variant="secondary"
                className="my-6 w-full cursor-not-allowed"
              >
                <Check className="h-4 w-4" /> Current plan
              </Button>
            ) : (
              <Button asChild className="my-6 w-full" variant="outline">
                <Link href="/auth/register">Get started</Link>
              </Button>
            )}

            <ul className="grid gap-3">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f.label}
                  className={cn(
                    "grid grid-cols-[20px_1fr] items-start gap-2.5 text-sm leading-relaxed",
                    !f.included && "text-muted-foreground",
                  )}
                >
                  {f.included ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/40" />
                  )}
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro — deliberately NOT stretched to the row via its own
              rounded-2xl/border-2/shadow stack, which is what reads as
              "lifted out of the panel": it sits on top of (and slightly
              overlaps) the shared divider between Free and Enterprise. */}
          <div className="relative z-10 w-full max-w-[380px] rounded-2xl border-2 border-primary bg-card p-8 text-left text-card-foreground shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)] lg:max-w-none">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-3.5 py-1 font-mono text-[11px] font-bold tracking-widest text-primary-foreground">
              MOST POPULAR
            </span>

            {/* Savings pill + billing toggle, top of card, directly under
                the ribbon — recommended-card-only placement per the
                reference. Everything else (name, eyebrow, price) follows
                below it. */}
            <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/10">
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                Save 2 months with Yearly
              </span>
              <Switch
                checked={cycle === "annual"}
                onCheckedChange={(checked) =>
                  setCycle(checked ? "annual" : "monthly")
                }
                aria-label="Bill yearly"
              />
            </div>

            {/* Name first, eyebrow beneath. Pro is the recommended plan, so
                its name carries the brand accent (primary). */}
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              Pro
            </h2>
            <p className="mb-5 mt-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Everything, unlocked
            </p>

            <div className="flex min-h-[62px] items-baseline gap-2.5">
              <span className="font-mono text-5xl font-bold tracking-tight">
                {monthlyEquivalent(pricing, cycle)}
              </span>
              <span className="text-sm leading-tight text-muted-foreground">
                /month
                {cycle === "annual" && (
                  <>
                    <br />
                    billed annually
                  </>
                )}
              </span>
            </div>
            {isPro ? (
              <div className="my-6 space-y-2">
                <div className="w-full rounded-md bg-secondary px-4 py-2.5 text-center text-sm font-bold text-secondary-foreground">
                  You&apos;re on Pro
                </div>
                <Link
                  href={routes.subscriptionManagement}
                  className="block text-center text-xs font-semibold text-primary hover:underline"
                >
                  Manage your subscription
                </Link>
              </div>
            ) : isEnterprise ? (
              <div className="my-6 space-y-2">
                <div className="w-full rounded-md bg-secondary px-4 py-2.5 text-center text-sm font-bold text-secondary-foreground">
                  Included in your Enterprise plan
                </div>
                <Link
                  href={routes.subscriptionManagement}
                  className="block text-center text-xs font-semibold text-primary hover:underline"
                >
                  Manage your subscription
                </Link>
              </div>
            ) : (
              <Button asChild className="my-6 w-full">
                <Link href={checkoutHref}>Go Pro</Link>
              </Button>
            )}

            <ul className="grid gap-3">
              {PRO_FEATURES.map((label) => (
                <li
                  key={label}
                  className="grid grid-cols-[20px_1fr] items-start gap-2.5 text-sm leading-relaxed"
                >
                  <Check className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise — no "Best Value" ribbon: that claim belongs to Pro
              ("Most Popular") alone, Enterprise doesn't carry it. */}
          <div className="relative w-full max-w-[380px] rounded-2xl border border-border bg-card p-8 text-left text-card-foreground lg:max-w-none lg:rounded-none lg:rounded-r-2xl lg:border-none">
            {/* Name first, eyebrow beneath. Enterprise gets a distinct
                secondary accent — reusing the same coral/red already on this
                card's Crown badge (#EB5757) rather than inventing a new hex
                value, so the name and the "premium tier" badge read as one
                deliberate colour choice instead of two unrelated ones. */}
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-[#EB5757]">
                Enterprise
              </h2>
              <Crown className="h-4 w-4 text-[#EB5757]" aria-hidden="true" />
            </div>
            {/* Eyebrow states the minimum team size, from the API's own
                minSeats — the card's headline constraint, and the first
                thing that tells a solo buyer this plan is not for them. */}
            <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              For teams of {enterprise.minSeats} and up
            </p>

            {/* Price block. The "per user" qualifier is deliberately NOT
                subordinate to "/month": it sits on the first line of the
                stack, at the same weight as the interval, because a per-seat
                figure read as a team total is the single most expensive
                misunderstanding this card can cause. */}
            <div className="flex min-h-[62px] items-baseline gap-2.5">
              <span className="font-mono text-5xl font-bold tracking-tight">
                {enterprisePerUserMonthlyDisplay(enterprise, cycle)}
              </span>
              <span className="text-sm font-semibold leading-tight text-foreground">
                per user
                <br />
                <span className="font-normal text-muted-foreground">
                  /month
                  {cycle === "annual" && (
                    <>
                      <br />
                      billed annually
                    </>
                  )}
                </span>
              </span>
            </div>

            {/* No seat selector, no total, no informational filler here —
                the reference's team card is price, CTA, features, nothing
                else. Team size is now a checkout-time decision: the
                self-serve CTA below sends the buyer to /checkout, where
                they pick their seat count and see the computed total before
                paying (see checkout.tsx's SeatSelector). The sales-led CTA
                (mailto) needs no total here either — a human quotes it. */}

            {isEnterprise ? (
              <div className="my-6 space-y-2">
                <div className="w-full rounded-md bg-secondary px-4 py-2.5 text-center text-sm font-bold text-secondary-foreground">
                  You&apos;re on Enterprise
                </div>
                <Link
                  href={routes.subscriptionManagement}
                  className="block text-center text-xs font-semibold text-primary hover:underline"
                >
                  Manage your subscription
                </Link>
              </div>
            ) : enterpriseSelfServe ? (
              // Outline, never solid — Pro keeps the one solid primary button
              // on this page, and two solid CTAs side by side would make the
              // recommended plan indistinguishable from the upsell.
              <Button asChild className="my-6 w-full" variant="outline">
                <Link href={enterpriseCtaHref}>
                  {isPro ? "Upgrade to Enterprise" : "Choose Enterprise"}
                </Link>
              </Button>
            ) : (
              // Labelled for what it actually does. Not "Choose Enterprise" /
              // "Get started", which would promise a checkout that cannot
              // charge this team correctly.
              <Button asChild className="my-6 w-full" variant="outline">
                <a href={SALES_CONTACT_HREF}>Talk to sales</a>
              </Button>
            )}

            <p className="mb-3 text-sm font-semibold">
              Everything in Pro, plus:
            </p>
            <ul className="grid gap-3">
              {ENTERPRISE_FEATURES.map((label) => (
                <li
                  key={label}
                  className="grid grid-cols-[20px_1fr] items-start gap-2.5 text-sm leading-relaxed"
                >
                  <Check className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a
          href="#compare"
          className="mt-8 inline-block text-sm font-semibold text-white hover:text-primary"
        >
          Compare features&nbsp;&nbsp;↓
        </a>

        {/* ── Trusted-by band ── closing part of the dark hero/cards block,
            same as the reference — not a light-ground element.
            "Our learners work at" — not "trusted by", which would claim a
            customer relationship with these companies. What's true is
            narrower: this is where people who learned here are employed,
            same framing the marketing site uses for this exact company
            list (see app/page.tsx's ALUMNI_COMPANIES in the landing-page
            repo). Two-column layout after the DataCamp reference: heading
            large and bold on the left, a 4-per-row grid of large white
            wordmarks on the right (no logo assets exist for these
            companies, so type size/weight carries the presence a real
            logo would). White (not white/opacity) because this band sits
            on the hero's fixed dark navy regardless of site theme. */}
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

        {/* ── Testimonial ── real quote pulled verbatim from the login
            screen (components/auth/auth-shell.tsx). Redesigned side-by-side
            (avatar left, quote right) after DataCamp's pricing-page
            testimonial: a large circular avatar given presence by a
            solid-colour circle offset behind it, an oversized opening quote
            mark, the quotation set large, and the attribution beneath it.
            The avatar renders Maxmillian's real headshot
            (public/maxmillian-ogbuabor.png) circular-cropped inside the same
            offset-circle treatment; the "MO" initials chip is a genuine
            fallback (missing asset / load error), not a placeholder we
            forgot to swap out.

            Position: INSIDE the dark hero block, directly beneath the
            trusted-by band — the reference flow is plan cards → "Compare
            features ↓" → trusted-by → testimonial → comparison table → FAQ.
            It used to sit after the table on the light band.

            Styling follows that move: this ground is a FIXED navy in both
            light and dark theme, so the quote and attribution use
            white-opacity values, not the foreground / muted-foreground
            theme tokens they carried on the light band — those tokens
            resolve to near-black in light theme and the quote would vanish
            here. Same reasoning the trusted-by band above already spells
            out. The cyan avatar is the brand primary and reads on navy
            unchanged. No new colour introduced — the offset backing circle
            is the same brand cyan at low opacity. */}
        <div className="border-t border-white/10 pb-20 pt-16 sm:pt-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 px-4 sm:flex-row sm:items-center sm:gap-14">
            {/* Avatar — layered offset-circle treatment, scaled well past
                the login screen's 52px chip so it carries real weight next
                to the quote. */}
            <div className="relative flex-none">
              <div
                aria-hidden="true"
                className="absolute -bottom-5 -right-5 h-32 w-32 rounded-full bg-[#13AECE]/25 sm:h-40 sm:w-40"
              />
              {avatarPhotoFailed ? (
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#13AECE] bg-[#13AECE]/[0.18] text-4xl font-bold text-[#13AECE] sm:h-40 sm:w-40 sm:text-5xl">
                  MO
                </div>
              ) : (
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[#13AECE] sm:h-40 sm:w-40">
                  <Image
                    src="/maxmillian-ogbuabor.png"
                    alt="Maxmillian Ogbuabor, Full-Stack Developer"
                    fill
                    sizes="(min-width: 640px) 160px, 128px"
                    className="object-cover"
                    onError={() => setAvatarPhotoFailed(true)}
                  />
                </div>
              )}
            </div>

            {/* Quote — oversized opening mark, quotation held to a readable
                measure (~45-60 characters per line), attribution beneath. */}
            <div className="max-w-2xl text-center sm:text-left">
              <svg
                aria-hidden="true"
                width="40"
                height="32"
                viewBox="0 0 44 36"
                fill="none"
                className="mx-auto mb-3 sm:mx-0"
              >
                <path
                  d="M0 36V20C0 9 6.5 1.8 18 0L20 6C13.5 7.6 10 11.4 10 17H18V36H0ZM24 36V20C24 9 30.5 1.8 42 0L44 6C37.5 7.6 34 11.4 34 17H42V36H24Z"
                  fill="#13AECE"
                  fillOpacity="0.55"
                />
              </svg>
              <blockquote className="max-w-md text-xl font-semibold leading-relaxed tracking-tight text-white sm:max-w-lg sm:text-2xl">
                Immediately after I finished my program at MasteringBackend,
                I landed a gig to build a full-stack application for an
                NGO, and everything I learned about building a
                production-ready application I apply here.
              </blockquote>
              <div className="mt-6">
                <div className="text-base font-bold text-white">
                  Maxmillian Ogbuabor
                </div>
                <div className="text-sm text-white/60">
                  Full-Stack Developer · Remote
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof + comparison table ── */}
      <div className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 border-b border-border py-14 sm:grid-cols-3">
            <div>
              <div className="font-mono text-3xl font-bold tracking-tight text-primary">
                12,400+
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                engineers learning on MasteringBackend right now
              </p>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold tracking-tight text-primary">
                340+
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                projects submitted and reviewed every month
              </p>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold tracking-tight text-primary">
                4.8/5
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                average rating across paths and bootcamps
              </p>
            </div>
          </div>

          {/* ── Comparison table ── border-t replaces the trusted-by band's
              old border-b as the divider from the stats row above, now
              that the band itself has moved into the dark hero section. */}
          <section id="compare" className="border-t border-border pb-20 pt-14">
            <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
              What you get on each plan
            </h2>
            {/* One bordered panel, one ground. bg-card on the wrapper matters
                for more than looks: the section behind it is bg-muted/30, and
                the header cells used to paint their own bg-card while the body
                cells stayed transparent — so the Pro column's bg-primary/5
                composited over white in the header and over muted grey in the
                body, and visibly changed shade halfway down. With the whole
                panel on bg-card, one tint value yields one colour top to
                bottom. overflow-x-auto keeps the 820px min-width table
                scrolling inside this box on mobile rather than widening the
                page. */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                {/* Header row: plan name, compact price line, CTA — and
                    nothing above them. It is deliberately NOT pinned any
                    more. Pinning these cells (position:sticky, offset under
                    the site header, raised z-index) was the single cause of
                    two defects: while pinned the cells shifted out of their
                    own row and left an empty band above the plan names, and
                    their raised stacking order painted straight over the
                    first group heading below, clipping "Learn" down to an
                    orphaned fragment of its cyan rule. A ~130px-tall header
                    parked under a 56px site header also ate a third of a
                    short viewport. The reference's header simply sits at the
                    top of the panel, so this one does too.

                    No vertical rules either: the single unbroken border-b-2
                    under the row separates header from body, and the Pro
                    column's tint — which starts here and never stops — is
                    what marks the recommended column out. */}
                <thead>
                  <tr>
                    <th className="w-[30%] border-b-2 border-border px-4 py-5 text-left align-top">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th className="border-b-2 border-border px-4 py-5 text-center align-top">
                      <div className="text-xl font-extrabold tracking-tight">
                        Free
                      </div>
                      <div className="mb-4 mt-1 text-xs text-muted-foreground">
                        Free
                      </div>
                      {freeCtaIsCurrent ? (
                        <Button
                          disabled
                          size="sm"
                          variant="secondary"
                          className="w-full cursor-not-allowed"
                        >
                          <Check className="h-3.5 w-3.5" /> Current plan
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="w-full"
                        >
                          <Link href="/auth/register">Get started</Link>
                        </Button>
                      )}
                    </th>
                    <th className="border-b-2 border-border bg-primary/5 px-4 py-5 text-center align-top">
                      <div className="text-xl font-extrabold tracking-tight text-primary">
                        Pro
                      </div>
                      <div className="mb-4 mt-1 text-xs text-muted-foreground">
                        {tablePriceLine(pricing, cycle)}
                      </div>
                      {isPro ? (
                        <div className="space-y-1.5">
                          <div className="w-full rounded-md bg-secondary px-3 py-2 text-center text-xs font-bold text-secondary-foreground">
                            You&apos;re on Pro
                          </div>
                          <Link
                            href={routes.subscriptionManagement}
                            className="block text-center text-xs font-semibold text-primary hover:underline"
                          >
                            Manage subscription
                          </Link>
                        </div>
                      ) : isEnterprise ? (
                        <div className="w-full rounded-md bg-secondary px-3 py-2 text-center text-xs font-bold text-secondary-foreground">
                          Included in Enterprise
                        </div>
                      ) : (
                        <Button size="sm" asChild className="w-full">
                          <Link href={checkoutHref}>Go Pro</Link>
                        </Button>
                      )}
                    </th>
                    <th className="border-b-2 border-border px-4 py-5 text-center align-top">
                      <div className="text-xl font-extrabold tracking-tight">
                        Enterprise
                      </div>
                      {/* Matches the card's price block word for word —
                          per-user rate, same monthly-equivalent treatment,
                          same "billed annually" suffix. */}
                      <div className="mb-4 mt-1 text-xs text-muted-foreground">
                        {enterpriseTablePriceLine(enterprise, cycle)}
                      </div>
                      {isEnterprise ? (
                        <div className="space-y-1.5">
                          <div className="w-full rounded-md bg-secondary px-3 py-2 text-center text-xs font-bold text-secondary-foreground">
                            You&apos;re on Enterprise
                          </div>
                          <Link
                            href={routes.subscriptionManagement}
                            className="block text-center text-xs font-semibold text-primary hover:underline"
                          >
                            Manage subscription
                          </Link>
                        </div>
                      ) : enterpriseSelfServe ? (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="w-full"
                        >
                          <Link href={enterpriseCtaHref}>
                            {isPro ? "Upgrade" : "Choose Enterprise"}
                          </Link>
                        </Button>
                      ) : (
                        // Same sales-led branch as the card above, off the
                        // same `selfServe` flag — the table must not offer a
                        // checkout the card just declined to offer.
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="w-full"
                        >
                          <a href={SALES_CONTACT_HREF}>Talk to sales</a>
                        </Button>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_GROUPS.map((group, groupIndex) => (
                    <Fragment key={group.name}>
                      {/* Dashed full-width separator between groups (not
                          before the first one) — split into per-column
                          cells, each carrying its own border-dashed
                          segment, purely so the Pro column's tint isn't
                          interrupted by crossing a single spanning cell. */}
                      {groupIndex > 0 && (
                        <tr aria-hidden="true">
                          <td className="border-t border-dashed border-border px-4 py-2" />
                          <td className="border-t border-dashed border-border px-4 py-2" />
                          <td className="border-t border-dashed border-border bg-primary/5 px-4 py-2" />
                          <td className="border-t border-dashed border-border px-4 py-2" />
                        </tr>
                      )}
                      {/* Group heading: left-aligned, bold, with a short
                          rule under the heading text only (not the full
                          table width — that's the dashed separator's job).
                          Split into per-column cells for the same tint-
                          continuity reason as the separator row above. */}
                      <tr>
                        <th
                          className={cn(
                            "px-4 pb-3 text-left align-bottom",
                            groupIndex === 0 ? "pt-8" : "pt-7",
                          )}
                        >
                          <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                            {group.name}
                          </span>
                          <span className="mt-2 block h-0.5 w-8 rounded-full bg-primary" />
                        </th>
                        <td className={groupIndex === 0 ? "pt-8" : "pt-7"} />
                        <td
                          className={cn(
                            "bg-primary/5",
                            groupIndex === 0 ? "pt-8" : "pt-7",
                          )}
                        />
                        <td className={groupIndex === 0 ? "pt-8" : "pt-7"} />
                      </tr>
                      {group.rows.map((row) => (
                        <tr
                          key={row.label}
                          className="border-t border-border/60"
                        >
                          <th className="px-4 py-5 text-left text-sm font-normal">
                            {row.label}
                          </th>
                          <td className="px-4 py-5 text-center">
                            <CompareMark value={row.free} />
                          </td>
                          <td className="bg-primary/5 px-4 py-5 text-center">
                            <CompareMark value={row.pro} />
                          </td>
                          <td className="px-4 py-5 text-center">
                            <CompareMark value={row.enterprise} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* ── FAQ ── */}
      <section className="bg-[#0e1f33] px-4 py-20 text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Questions
          </h2>
          <Accordion type="single" collapsible defaultValue="item-0">
            {[
              {
                q: "What's the difference between Free and Pro?",
                a: "Free gets you the first steps of every path, a public portfolio, and the full XP and leaderboard system. Pro unlocks every premium step, all projects with code review, unlimited playground exercises, AI mock interviews, and verified certificates.",
              },
              {
                q: "How will I be charged?",
                a: `Pro is ${formatPrice(pricing.monthly, pricing.currency)} per month, or ${formatPrice(
                  pricing.annual,
                  pricing.currency,
                )} per year — two months free. You are charged in ${currencySymbol(
                  pricing.currency,
                )}, and your card is billed automatically each cycle until you cancel.`,
              },
              {
                q: "Can I cancel any time?",
                a: "Yes. Cancel from subscription settings and you keep Pro access until the end of the period you've already paid for. Nothing is charged after that.",
              },
              {
                q: "Do I keep my progress if I cancel?",
                a: "Your progress, XP, portfolio, and certificates all stay on your account. Premium steps lock again, and everything unlocks exactly where you left it if you come back.",
              },
              {
                q: "Is there a student discount?",
                a: "Not a separate one. Regional pricing already puts Pro near the student price in most of the countries where our learners are.",
              },
            ].map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`item-${i}`}
                className="mb-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-2"
              >
                <AccordionTrigger className="px-4 text-left text-white hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                {/* forceMount: keeps the answer text (incl. the raw monthly/annual
                    price) in the server-rendered HTML even while collapsed —
                    without it, Radix unmounts closed content entirely and the
                    price never reaches crawlers or a curl of the page. */}
                <AccordionContent forceMount className="px-4 text-white/70">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
