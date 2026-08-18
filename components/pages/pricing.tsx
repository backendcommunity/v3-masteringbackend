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
import countriesList from "@/lib/countries.json";
import { analytics } from "@/lib/analytics";
import { sanitizeRedirect } from "@/lib/safe-redirect";
import { PRICING_EVENTS } from "@/lib/analytics-events";
import {
  ENTERPRISE_PRICING,
  formatPrice,
  monthlyEquivalent,
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
  "Team seats for up to 5 members ($10/seat after that)",
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
  rows: { label: string; free: CompareCell; pro: CompareCell; enterprise: CompareCell }[];
}[] = [
  {
    name: "Learn",
    rows: [
      { label: "First steps of every path", free: "yes", pro: "yes", enterprise: "yes" },
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
      { label: "Guided projects", free: "Starter only", pro: "yes", enterprise: "yes" },
      { label: "Code review on submissions", free: "no", pro: "yes", enterprise: "yes" },
      { label: "Public portfolio", free: "yes", pro: "yes", enterprise: "yes" },
    ],
  },
  {
    name: "Grow",
    rows: [
      { label: "AI mock interviews", free: "no", pro: "yes", enterprise: "yes" },
      { label: "Scored interview reports", free: "no", pro: "yes", enterprise: "yes" },
      { label: "Verified certificates", free: "no", pro: "yes", enterprise: "yes" },
      { label: "XP, streaks, leaderboard", free: "yes", pro: "yes", enterprise: "yes" },
    ],
  },
  {
    // Sourced from lib/data.ts's Enterprise plan record (the same data
    // /subscription/plans reads) — nothing here is claimed that isn't
    // already sold on that page. Every row here is genuinely exclusive to
    // Enterprise (neither Free nor Pro offers any of it), so Free/Pro cells
    // read "Enterprise Only" instead of a plain ✗ — more informative, and
    // truthful for every row in this group.
    name: "Team & enterprise",
    rows: [
      {
        label: "Team seats included",
        free: "Enterprise Only",
        pro: "Enterprise Only",
        enterprise: "5",
      },
      {
        label: "Additional seats",
        free: "Enterprise Only",
        pro: "Enterprise Only",
        enterprise: "$10/seat",
      },
      {
        label: "Structured, cohort-based bootcamps",
        free: "Enterprise Only",
        pro: "Enterprise Only",
        enterprise: "yes",
      },
      {
        label: "Certification exams",
        free: "Enterprise Only",
        pro: "Enterprise Only",
        enterprise: "yes",
      },
      {
        label: "1-on-1 mentorship with industry experts",
        free: "Enterprise Only",
        pro: "Enterprise Only",
        enterprise: "yes",
      },
      {
        label: "Dedicated career placement assistance",
        free: "Enterprise Only",
        pro: "Enterprise Only",
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

function countryName(code: string): string {
  if (!code) return "your region";
  const match = (countriesList as { name: string; code: string }[]).find(
    (c) => c.code.toUpperCase() === code.toUpperCase(),
  );
  return match?.name ?? code;
}

function resolvedLine(pricing: Pick<PublicPricing, "country" | "currency">): string {
  return `Prices shown in ${currencySymbol(pricing.currency)} for ${countryName(
    pricing.country,
  )}`;
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

  // Checkout used to derive its entire price and processor selection from
  // the region-resolved Pro pricing object alone, so it had no way to price
  // a second, differently-priced global plan — routing Enterprise through it
  // would have silently charged Enterprise buyers the regional Pro amount.
  // lib/checkout-plan-pricing.ts (see resolveCheckoutPrice) fixed that: a
  // non-Pro `?plan=` is now priced from that plan's OWN record, with no path
  // back to the regional numbers (25 tests, including a regression pin that
  // an Enterprise-shaped checkout never returns Pro's amount or price ID).
  // Enterprise can now sell end-to-end from this page, the same way Pro
  // does.
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
        <h1 className="mx-auto max-w-xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
          Learn the <span className="text-primary">engineering skills</span>{" "}
          you need to advance your career.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-white/70">
          Paths, real projects with code review, and mock interviews that end
          in an offer — not another certificate for the pile.
        </p>

        {/* ── Plan cards ──
            Joined into one panel at lg: a single outer border encloses all
            three, gap-0 + divide-x share the inner edges, and items-center
            (instead of the default grid stretch) lets each card keep its
            own natural height — Pro's is taller from its extra content, so
            it centers proud of Free/Enterprise on both edges without any
            manual margin/translate hack. Below lg the cards stay stacked
            and independently rounded, unchanged from before. */}
        <div className="mx-auto mt-14 grid max-w-[796px] grid-cols-1 items-start justify-items-center gap-6 lg:max-w-[1120px] lg:grid-cols-3 lg:items-center lg:justify-items-stretch lg:gap-0 lg:divide-x lg:divide-white/15 lg:rounded-2xl lg:border lg:border-white/15">
          {/* Free */}
          <div className="w-full max-w-[380px] rounded-2xl bg-card p-8 text-left text-card-foreground lg:max-w-none lg:rounded-none lg:rounded-l-2xl">
            <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Limited access
            </p>
            <h2 className="mb-5 text-2xl font-bold tracking-tight">
              Free
            </h2>
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
            <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Everything, unlocked
            </p>
            <h2 className="mb-5 text-2xl font-bold tracking-tight text-primary">
              Pro
            </h2>

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
            <p className="mt-3 flex items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground">
              <span className="h-1.5 w-1.5 flex-none rounded-full bg-primary" />
              {resolvedLine(pricing)}
            </p>

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
            <div className="mb-1 flex items-center justify-between">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                For teams &amp; businesses
              </p>
              <Crown className="h-4 w-4 text-[#EB5757]" aria-hidden="true" />
            </div>
            <h2 className="mb-5 text-2xl font-bold tracking-tight">
              Enterprise
            </h2>

            <div className="flex min-h-[62px] items-baseline gap-2.5">
              <span className="font-mono text-5xl font-bold tracking-tight">
                {monthlyEquivalent(ENTERPRISE_PRICING, cycle)}
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
            <p className="mt-3 flex items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground">
              <span className="h-1.5 w-1.5 flex-none rounded-full bg-muted-foreground/50" />
              Billed in USD everywhere — Enterprise pricing isn&apos;t
              region-adjusted
            </p>

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
            ) : (
              <Button asChild className="my-6 w-full" variant="outline">
                <Link href={enterpriseCtaHref}>
                  {isPro ? "Upgrade to Enterprise" : "Choose Enterprise"}
                </Link>
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
            repo). Text wordmarks, muted and evenly spaced — no logo
            assets exist for these companies. White-opacity tokens (not the
            muted-foreground theme token) because this band sits on the
            hero's fixed dark navy regardless of site theme. */}
        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 items-center gap-5 px-4 pb-16 sm:grid-cols-[auto_1fr] sm:gap-10">
          <p className="whitespace-nowrap text-sm font-semibold text-white/60">
            Our learners work at
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {TRUSTED_BY_COMPANIES.map((name) => (
              <span
                key={name}
                className="text-lg font-bold tracking-tight text-white/50 grayscale"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof + testimonial + comparison table ── */}
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

          <figure className="grid grid-cols-1 items-start gap-6 py-14 sm:grid-cols-[64px_1fr]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 text-xl font-bold text-white">
              AO
            </div>
            <div>
              <blockquote className="text-balance text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                &ldquo;I&apos;d done three courses and still froze on system
                design. The mock interviews were the first thing that showed
                me exactly where I was losing the room.&rdquo;
              </blockquote>
              <cite className="mt-3 block text-sm not-italic text-muted-foreground">
                Adaeze O. — Backend Engineer, Lagos
              </cite>
            </div>
          </figure>

          {/* ── Comparison table ── border-t replaces the trusted-by band's
              old border-b as the divider from the testimonial above, now
              that the band itself has moved into the dark hero section. */}
          <section id="compare" className="border-t border-border pb-20 pt-14">
            <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
              What you get on each plan
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                {/* Sticky header reads as its own bordered panel: a heavier
                    bottom border separates it from the body, and each cell
                    keeps a vertical border so the whole row frames like one
                    card sitting on top of the table. The Pro cell's bg-primary/5
                    here is the same tint every Pro body cell below uses, so
                    the tinted column reads continuously from header to
                    footer — see the tint-continuation cells in tbody. */}
                <thead>
                  <tr>
                    <th className="sticky top-14 z-20 w-[30%] border-b-2 border-border bg-card px-4 py-5 text-left align-top backdrop-blur">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th className="sticky top-14 z-20 border-b-2 border-l border-border bg-card px-4 py-5 text-center align-top backdrop-blur">
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
                        <Button size="sm" variant="outline" asChild className="w-full">
                          <Link href="/auth/register">Get started</Link>
                        </Button>
                      )}
                    </th>
                    <th className="sticky top-14 z-20 border-b-2 border-l border-primary/30 bg-primary/5 px-4 py-5 text-center align-top backdrop-blur">
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
                    <th className="sticky top-14 z-20 border-b-2 border-l border-border bg-card px-4 py-5 text-center align-top backdrop-blur">
                      <div className="text-xl font-extrabold tracking-tight">
                        Enterprise
                      </div>
                      <div className="mb-4 mt-1 text-xs text-muted-foreground">
                        {tablePriceLine(ENTERPRISE_PRICING, cycle)}
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
                      ) : (
                        <Button size="sm" variant="outline" asChild className="w-full">
                          <Link href={enterpriseCtaHref}>
                            {isPro ? "Upgrade" : "Choose Enterprise"}
                          </Link>
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
                          <td className="border-t border-dashed border-primary/30 bg-primary/5 px-4 py-2" />
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
                        <tr key={row.label} className="border-t border-border/60">
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
                <AccordionContent
                  forceMount
                  className="px-4 text-white/70"
                >
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
