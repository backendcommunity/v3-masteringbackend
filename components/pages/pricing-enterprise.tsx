"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LayoutTemplate,
  Layers,
  Minus,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarketingHeader } from "@/components/pricing/marketing-header";
import { TrustedByBand } from "@/components/pricing/trusted-by-band";
import {
  CompareMark,
  FeatureBadge,
  type CompareCell,
} from "@/components/pricing/compare";
import { useUser } from "@/hooks/use-user";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { withGeoOverride } from "@/lib/geo-override";
import { PRICING_EVENTS } from "@/lib/analytics-events";
import { COMING_SOON } from "@/lib/plan-features";
import { SALES_CONTACT_HREF } from "@/lib/sales-contact";
import {
  clampSeats,
  enterprisePerUserMonthlyDisplay,
  enterpriseTotal,
  formatPrice,
  resolveSeats,
  type PublicPricing,
} from "@/lib/pricing";
import { classifyPremiumTierStatus } from "@/lib/subscription-pricing";

interface PricingEnterpriseViewProps {
  pricing: PublicPricing;
}

type BillingCycle = "monthly" | "annual";

/**
 * ── What this page is for, and how it differs from /pricing ───────────────
 *
 * /pricing sells a SEAT to the person reading it. This page sells a
 * SUBSCRIPTION to someone buying on other people's behalf, and that buyer
 * asks three questions in order: what does this cost for my team, what do I
 * get that a handful of individual Pro subscriptions wouldn't give me, and
 * how do I roll it out. The page answers them in that order.
 *
 * Everything about the learning product itself stays on /pricing. Repeating
 * the full Free/Pro/Enterprise table here would bury the two rows a manager
 * is actually deciding between, so the comparison below is Pro vs Enterprise
 * only and links back for the rest.
 */

/**
 * What Enterprise adds ON TOP of Pro. Same five labels the /pricing card
 * carries, with programme building added — this page is where a manager's
 * inventory belongs, because whoever reads it has already decided they are
 * buying for a team.
 *
 * Career placement is deliberately NOT among them. It stays in the comparison
 * table below (and on /pricing), where it is enumerated rather than pitched:
 * six cards is what this grid holds, and hiring services already carries the
 * career story in the half a manager is buying.
 *
 * Labels are EXACT: COMING_SOON in lib/plan-features.ts is keyed by them, and
 * so are the comparison rows below. A reworded label here silently drops its
 * "Coming soon" chip and starts selling an unbuilt feature as shipped.
 */
const ENTERPRISE_HIGHLIGHTS: {
  label: string;
  icon: typeof LayoutDashboard;
  blurb: string;
}[] = [
  {
    // Leads deliberately: building the programme is the first thing a manager
    // does, and the two entries after it — assigning it, then reporting on it
    // — only mean anything once one exists.
    label: "Build learning programs",
    icon: Layers,
    blurb:
      "Put courses, projects, and mock interviews in the order you want. Your team follows one plan, built around the work you do.",
  },
  {
    label: "Admin dashboard",
    icon: LayoutDashboard,
    blurb:
      "Add people, remove people, give them a plan, and see how each seat is used. All in one place.",
  },
  {
    label: "Team performance reports",
    icon: BarChart3,
    blurb:
      "See what each person did, what they finished, and how they scored. Reviews start with facts.",
  },
  {
    // "team mentorship", not plain "1-on-1 mentorship": on a per-seat plan the
    // buyer is purchasing it for people other than themselves.
    //
    // The LABEL stays as it is because /pricing's Enterprise card and its
    // comparison table both carry it verbatim, and a manager comparing the two
    // pages must not find one feature under two names. The blurb is where the
    // mechanism gets named: internally this is a private cohort, and that is
    // the part an enterprise buyer is actually paying for.
    label: "1-on-1 team mentorship with industry experts",
    icon: Users,
    blurb:
      "We run it as a private cohort. Each person gets 1-on-1 time with senior engineers who have built and run systems at this size.",
  },
  {
    label: "Co-branded landing page",
    icon: LayoutTemplate,
    blurb:
      "Your logo on the training page your team uses. Good for the internal launch, and for people you invite.",
  },
  {
    label: "Hiring services",
    icon: Search,
    blurb:
      "Hire backend engineers from the same pool your team trains in.",
  },
];

/**
 * A genuine sequence — each step is impossible before the one above it — so
 * these are numbered. Nothing else on this page is.
 */
const ROLLOUT_STEPS: { title: string; body: string }[] = [
  {
    title: "Pick your seat count",
    body: "Choose how many people at checkout. You see the total before you pay. The price per person is the same for 2 seats or 200.",
  },
  {
    title: "Invite your engineers",
    body: "Send invites from your dashboard. Each person who joins takes a seat and gets full access right away.",
  },
  {
    title: "Track progress, book mentorship",
    body: "Check the reports to see who is moving and who is stuck. Book 1-on-1 sessions for the people who need help.",
  },
];

/**
 * Pro vs Enterprise ONLY, and only where the two genuinely differ or where a
 * buyer would otherwise doubt that Enterprise includes something.
 *
 * ⚠️ These labels are DELIBERATELY plainer than /pricing's, which is written
 * for the engineer buying their own seat and can say "path step" and "code
 * review". This page is read by whoever signs for the team, so the same rows
 * are named in business words ("All paid courses and learning paths",
 * "Projects with expert feedback"). That divergence is a decision, not drift.
 *
 * The exceptions, which must stay spelled EXACTLY as they are: "Co-branded
 * landing page" and "Hiring services". COMING_SOON in lib/plan-features.ts is
 * keyed by those strings, so rewording one silently drops its "Coming soon"
 * chip and starts selling an unbuilt feature as shipped.
 */
const COMPARE_GROUPS: {
  name: string;
  rows: { label: string; pro: CompareCell; enterprise: CompareCell }[];
}[] = [
  {
    name: "Billing",
    rows: [
      { label: "Pay per person, from 2 seats", pro: "no", enterprise: "yes" },
      {
        label: "One bill for the whole team",
        pro: "no",
        enterprise: "yes",
      },
    ],
  },
  {
    name: "Learning",
    rows: [
      {
        label: "All paid courses and learning paths",
        pro: "yes",
        enterprise: "yes",
      },
      { label: "Projects with expert feedback", pro: "yes", enterprise: "yes" },
      {
        label: "Scored mock interviews",
        pro: "Unlimited",
        enterprise: "Unlimited",
      },
      // Session COUNT is identical on both tiers; LENGTH is the only thing
      // separating them, so it gets its own row rather than being implied.
      {
        label: "Mock interview length",
        pro: "Up to 30 min",
        enterprise: "Up to 60 min",
      },
      {
        label: "Bootcamps and certification exams",
        pro: "yes",
        enterprise: "yes",
      },
    ],
  },
  {
    name: "Team & enterprise",
    rows: [
      { label: "Build learning programs", pro: "no", enterprise: "yes" },
      { label: "Admin dashboard", pro: "no", enterprise: "yes" },
      { label: "Team performance reports", pro: "no", enterprise: "yes" },
      {
        label: "1-on-1 mentorship in a private cohort",
        pro: "no",
        enterprise: "yes",
      },
      {
        label: "Help placing your engineers in roles",
        pro: "no",
        enterprise: "yes",
      },
      { label: "Co-branded landing page", pro: "no", enterprise: "yes" },
      { label: "Hiring services", pro: "no", enterprise: "yes" },
    ],
  },
  {
    name: "Support",
    rows: [{ label: "Priority support", pro: "yes", enterprise: "yes" }],
  },
];

export default function PricingEnterpriseView({
  pricing,
}: PricingEnterpriseViewProps) {
  const enterprise = pricing.enterprise;
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const user = useUser();
  const searchParams = useSearchParams();

  // Seeded from `?seats=` when it arrives already valid (a shared quote link,
  // or a back-nav from checkout), and from the plan's own minimum otherwise —
  // the same rule /checkout's seat selector uses, so a buyer who moves
  // between the two never sees the number change under them.
  const [seats, setSeats] = useState<number>(
    () =>
      resolveSeats(searchParams?.get("seats"), enterprise) ??
      enterprise.minSeats,
  );

  useEffect(() => {
    analytics.track(PRICING_EVENTS.enterpriseViewed, {
      tier: pricing.tier,
      country: pricing.country,
      cycle,
      seats,
    });
    // Fires once per visit, deliberately — this is a page-view event, not a
    // state-change one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tierStatus = classifyPremiumTierStatus(
    user?.isPremium,
    user?.subscription?.name ?? user?.subscription?.plan?.name,
  );
  const isEnterprise = tierStatus === "enterprise";

  // The seat count rides along to checkout, which seeds its own selector from
  // it — so the number the buyer quoted themselves here is the number they
  // are asked to confirm there.
  const checkoutHref = withGeoOverride(
    `/checkout?plan=enterprise&cycle=${cycle}&seats=${seats}`,
    searchParams,
  );

  const perUserMonthly = enterprisePerUserMonthlyDisplay(enterprise, cycle);
  // What the card is actually charged, on the cycle chosen: seats x per-user
  // price for that interval. enterpriseTotal does the seat clamping and the
  // integer-minor-unit maths, so a fractional or below-minimum seat count
  // cannot produce a total here that checkout would refuse.
  const chargedTotal = enterpriseTotal(enterprise, cycle, seats);

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* ── Hero ── the decision, above the fold: what it is, and what it
          costs for THIS team. Everything below is evidence for it. */}
      <section className="bg-[#0e1f33] px-4 pt-16 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 pb-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              MasteringBackend for teams
            </p>
            <h1 className="mt-3.5 max-w-2xl text-balance text-[1.75rem] font-black leading-[1.12] tracking-tight sm:text-3xl lg:text-[2.25rem]">
              Put your whole engineering team on{" "}
              <span className="text-primary">one plan</span>, and see who is
              actually levelling up.
            </h1>
            <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-white/75">
              Your team gets every course, learning path, and hands-on project
              we offer. You get a training plan built for your team, reports on
              who is doing the work, and expert coaching for the people who
              need it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#seats">See your team&apos;s price</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <a href={SALES_CONTACT_HREF}>Talk to sales</a>
              </Button>
            </div>

            {/* Three facts a buyer would otherwise have to email to ask. */}
            <dl className="mt-9 grid grid-cols-1 gap-6 border-t border-white/10 pt-7 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-2xl font-bold tabular-nums">
                  {enterprise.minSeats}
                </dt>
                <dd className="mt-1 text-[13px] leading-snug text-white/60">
                  The smallest team we sell to. No upper limit, and the price
                  per person never changes.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-2xl font-bold tabular-nums">
                  2 months
                </dt>
                <dd className="mt-1 text-[13px] leading-snug text-white/60">
                  Free when you pay yearly. You pay for 10 months and get 12.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-2xl font-bold tabular-nums">
                  1 invoice
                </dt>
                <dd className="mt-1 text-[13px] leading-snug text-white/60">
                  One bill for the whole team, in your local currency.
                </dd>
              </div>
            </dl>
          </div>

          {/* ── Seat calculator ── the page's one interactive surface. Cycle
              and seats in; per-user price, team total and the right CTA out. */}
          <div
            id="seats"
            className="scroll-mt-20 rounded-2xl bg-card p-6 text-left text-card-foreground shadow-2xl sm:p-8"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-[#EB5757]">
                Enterprise
              </h2>
              <span className="inline-block flex-none whitespace-nowrap rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                Per user
              </span>
            </div>
            <p className="mb-6 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              For teams of {enterprise.minSeats} and up
            </p>

            {/* Billing cycle. A segmented control rather than /pricing's
                switch: this card is the only thing on the page it reprices,
                and two labelled buttons state both prices' existence without
                the visitor having to flip one to discover the other. */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-muted-foreground">
                Billing
              </span>
              <div
                className="inline-flex rounded-xl border border-border bg-background p-1"
                role="group"
                aria-label="Billing cycle"
              >
                {(["monthly", "annual"] as BillingCycle[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={cycle === value}
                    onClick={() => setCycle(value)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors",
                      cycle === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {value === "monthly" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>
            </div>

            {/* Team size. clampSeats is the single gate — typing, stepping and
                the URL seed all pass through it, so no path can put a seat
                count in state that checkout would then reject. */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <label
                htmlFor="enterprise-seat-count"
                className="text-[13px] font-bold text-muted-foreground"
              >
                Team size
              </label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={seats <= enterprise.minSeats}
                  onClick={() => setSeats(clampSeats(seats - 1, enterprise))}
                  aria-label="Remove a seat"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  id="enterprise-seat-count"
                  inputMode="numeric"
                  value={seats}
                  aria-describedby="enterprise-seat-hint"
                  onChange={(event) =>
                    setSeats(
                      clampSeats(
                        Number(event.target.value.replace(/[^0-9]/g, "")),
                        enterprise,
                      ),
                    )
                  }
                  className="h-9 w-[72px] rounded-md border border-border bg-background text-center font-mono text-[15px] font-bold tabular-nums text-foreground"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSeats(clampSeats(seats + 1, enterprise))}
                  aria-label="Add a seat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p
              id="enterprise-seat-hint"
              className="mt-2 text-xs text-muted-foreground"
            >
              {seats <= enterprise.minSeats
                ? `You need at least ${enterprise.minSeats} seats. One person should buy Pro instead.`
                : "No limit on seats. The price per person stays the same."}
            </p>

            {/* Price block. "per user" sits on the first line at the same
                weight as the interval, not subordinate to it: a per-seat
                figure read as a team total is the single most expensive
                misunderstanding this card can cause. */}
            <div className="mt-6 flex min-h-[80px] items-baseline gap-2.5 border-t border-border pt-6">
              <span className="font-mono text-5xl font-bold tracking-tight tabular-nums">
                {perUserMonthly}
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

            {chargedTotal !== null && (
              <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  Team of {seats.toLocaleString()}, billed{" "}
                  {cycle === "annual" ? "yearly" : "monthly"}
                </span>
                <span className="font-mono font-bold tabular-nums text-foreground">
                  {formatPrice(chargedTotal, enterprise.currency)}
                </span>
              </div>
            )}

            {isEnterprise ? (
              <div className="mt-6 space-y-2">
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
            ) : enterprise.selfServe ? (
              <Button asChild className="mt-6 w-full">
                <Link href={checkoutHref}>Start your team</Link>
              </Button>
            ) : (
              // Labelled for what it actually does. Not "Start your team",
              // which would promise a checkout that cannot charge this team
              // correctly — this region's provider takes no seat quantity.
              <Button asChild variant="outline" className="mt-6 w-full">
                <a href={SALES_CONTACT_HREF}>Talk to sales</a>
              </Button>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {enterprise.selfServe
                ? "Pick your number of seats at checkout. You see the total before you pay."
                : "Card payments here cannot bill per person, so we set the plan up with you."}
            </p>
          </div>
        </div>

        <TrustedByBand />
      </section>

      {/* ── Why teams buy it ── the missing half of the old page: it opened
          on a price and then listed features, which answers "what is it" for
          someone already sold. A buyer spending a team's budget is answering
          "what problem does this close", and has to answer it to a finance
          approver afterwards. Problem-led, and deliberately plain text rather
          than a third card grid, so it reads as an argument and not as more
          inventory. */}
      <section className="px-4 pt-16 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Why teams buy it
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
Three problems this plan solves.
            </h2>
          </div>
          <div className="mt-9 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            <div>
              <h3 className="text-base font-bold leading-snug">
                New people learn without using up your senior team
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                Give them a plan to follow instead of running another training
                session. Your senior staff stay on their own work.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold leading-snug">
                You can see who is doing the work
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                Reports show what each person finished and how they scored. You
                run reviews on facts, not guesses. You renew on numbers, not a
                feeling.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold leading-snug">
                Your team practices, not just watches
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                Every plan ends in real projects, timed tasks, and scored mock
                interviews. Your team learns by doing the work once.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What a manager gets ── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Everything in Pro, plus
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              What your team gets.
            </h2>
            <p className="mt-3.5 text-[1.0625rem] text-muted-foreground">
              Enterprise is not extra content. Every Pro seat already has all
              of it. Enterprise adds the tools to run it. Build the plan, see
              who is doing it, and get expert help for your people.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENTERPRISE_HIGHLIGHTS.map(({ label, icon: Icon, blurb }) => (
              <article
                key={label}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EB5757]/10 text-[#EB5757]">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <h3 className="text-base font-bold leading-snug">
                  {label}
                  {COMING_SOON.has(label) && <FeatureBadge />}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {blurb}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rollout ── */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Rolling it out
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
Three steps to get your team started.
            </h2>
          </div>
          <ol className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
            {ROLLOUT_STEPS.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  "border-t-2 pt-5",
                  index === 0 ? "border-primary" : "border-border",
                )}
              >
                <span className="font-mono text-xs font-bold tracking-[0.12em] text-primary">
                  STEP {index + 1}
                </span>
                <h3 className="mt-2 text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Pro vs Enterprise ── */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Pro vs Enterprise
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
The same product, bought for a team.
            </h2>
            <p className="mt-3.5 text-[1.0625rem] text-muted-foreground">
              Everything in Pro is in Enterprise. This table shows only what is
              different. For the full Free, Pro, and Enterprise list, see the{" "}
              <Link
                href={routes.pricing()}
                className="font-semibold text-primary hover:underline"
              >
                individual pricing page
              </Link>
              .
            </p>
          </div>

          {/* Its own horizontal scroller: the page body must never scroll
              sideways on a narrow viewport just because a table is wide. */}
          <div className="mt-9 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <caption className="px-5 pt-5 text-left text-[13px] text-muted-foreground">
                Enterprise includes everything in Pro, for every seat.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-5 py-3.5 text-sm font-bold">
                    Feature
                  </th>
                  <th
                    scope="col"
                    className="w-[150px] px-5 py-3.5 text-center text-sm font-bold"
                  >
                    Pro
                  </th>
                  <th
                    scope="col"
                    className="w-[150px] px-5 py-3.5 text-center text-sm font-bold text-[#EB5757]"
                  >
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_GROUPS.map((group) => (
                  <Fragment key={group.name}>
                    <tr className="border-b border-border">
                      <th
                        scope="colgroup"
                        colSpan={3}
                        className="bg-muted/50 px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        {group.name}
                      </th>
                    </tr>
                    {group.rows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-b border-border last:border-0"
                      >
                        <th
                          scope="row"
                          className="px-5 py-3.5 text-sm font-medium"
                        >
                          {row.label}
                          {COMING_SOON.has(row.label) && <FeatureBadge />}
                        </th>
                        <td className="px-5 py-3.5 text-center">
                          <CompareMark value={row.pro} />
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <CompareMark value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── the questions a team asks that a solo buyer never does. */}
      <section className="bg-[#0e1f33] px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-7 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Questions from teams
          </h2>
          <Accordion type="single" collapsible defaultValue="item-0">
            {[
              {
                q: "What is the smallest team you sell to?",
                a: `${enterprise.minSeats} seats. For one person, Pro costs less and does the same job. Checkout blocks orders below ${enterprise.minSeats} seats.`,
              },
              {
                q: "How is the team charged?",
                a: `Per person, per month, on one bill. That is ${formatPrice(
                  enterprise.monthlyPerUser,
                  enterprise.currency,
                )} per person each month, or ${formatPrice(
                  enterprise.annualPerUser,
                  enterprise.currency,
                )} per person for a year. Pay yearly and you pay for 10 months but get 12. Your price depends on the country you pay from.`,
              },
              {
                // Confirmed by the product team: seat count is editable on a
                // live subscription. Kept to what is true today and no further
                // — no proration mechanics are promised here, because the flow
                // is due a pass after the landing page ships and a promise
                // written now would be the thing that has to be walked back.
                q: "Can we change the number of seats later?",
                a: "Yes. Add or remove seats after you buy, as your team grows or shrinks. You are billed for the new number from then on.",
              },
              {
                // The flagship capability, and the one a buyer cannot picture
                // from a three-word feature label. It goes second, right after
                // the commercial terms, because "what am I actually assigning
                // my team" is the question that decides the purchase.
                q: "What does a program look like?",
                a: "It is a list you build from what is already on the platform: courses, learning paths, projects, practice tasks, and mock interviews. You set the order, give it to your team, and their progress shows up in your reports.",
              },
              {
                q: "How does mentorship work for a team?",
                a: "We run it as a private cohort. Your team gets 1-on-1 sessions with senior engineers. The sessions are for your team only, and they follow the plan you set.",
              },
              {
                q: "Does every seat get everything in Pro?",
                a: "Yes. Every person gets all paid courses and paths, projects with feedback, unlimited practice, unlimited mock interviews of up to 60 minutes, certificates, bootcamps, and exams.",
              },
              {
                q: 'Why does my region say "Talk to sales" instead of a checkout button?',
                a: "Some payment providers cannot charge per person online. When that happens, we set the plan up with you, so your team is billed the right amount.",
              },
              {
                q: "What happens to our engineers' work if we cancel?",
                a: "You keep access until the end of the time you paid for. After that, paid lessons lock again. Each person keeps their progress, points, portfolio, and certificates, and picks up where they stopped if you come back.",
              },
            ].map((item, index) => (
              <AccordionItem
                key={item.q}
                value={`item-${index}`}
                className="mb-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-2"
              >
                <AccordionTrigger className="px-4 text-left text-white hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                {/* forceMount: keeps the answer text (including the raw
                    per-user prices) in the server-rendered HTML even while
                    collapsed — without it, Radix unmounts closed content
                    entirely and the price never reaches crawlers or a curl. */}
                <AccordionContent forceMount className="px-4 text-white/70">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Closing CTA ── same two actions as the hero. A manager who read
          the whole page should not have to scroll back up to act. */}
      <section className="bg-[#0a1728] px-4 py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to price it for your team?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/70">
            Pick your seat count and start today. Or tell us your team size and
            we will send you a quote.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="#seats">See your team&apos;s price</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a href={SALES_CONTACT_HREF}>Talk to sales</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
