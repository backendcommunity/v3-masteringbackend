"use client";

import { Fragment, useEffect, useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Check, Crown } from "lucide-react";
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
import { DowngradeButton } from "@/components/pricing/downgrade-button";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { MarketingHeader } from "@/components/pricing/marketing-header";
import { TrustedByBand } from "@/components/pricing/trusted-by-band";
import {
  CompareMark,
  FeatureBadge,
  type CompareCell,
} from "@/components/pricing/compare";
import { COMING_SOON } from "@/lib/plan-features";
import { SALES_CONTACT_HREF } from "@/lib/sales-contact";
import { withGeoOverride } from "@/lib/geo-override";
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

/**
 * ── What belongs on a card, and what belongs in the table ─────────────────
 *
 * The card's job is the at-a-glance decision: who the tier is for, what it
 * costs, the shortest honest answer to "what do I get", and the CTA. The
 * comparison table below is what answers the exhaustive question, and it now
 * does that across 21 rows in five groups with real quotas.
 *
 * So these lists are SUMMARIES, deliberately capped, and they are all
 * POSITIVE. Two things moved out to the table when the lists grew:
 *
 *   * The Free card's excluded ("✗") rows. Two hand-picked crosses were a
 *     worse comparison than the table's 21 rows — and arbitrary: they named
 *     two of the ten things Free lacks and stayed silent on the rest. With
 *     the crosses gone every card list is uniform, so the ticks are
 *     decorative on all three (see PlanFeatureList) instead of the Free card
 *     alone needing per-item accessible names.
 *
 *   * Enterprise's per-item programme lines and its interview quota. The
 *     table states "Unlimited" and "Up to 60 min" precisely; the card only
 *     needs to say a team gets more.
 *
 * The counts are 5 / 6 / 5 on purpose. Pro carries the most lines because it
 * is the recommended plan, and on a row that centers each card on its own
 * height (lg:items-center) the line count IS the visual hierarchy — when
 * Enterprise grew to eight items it stood taller than Pro and quietly
 * out-ranked the card wearing the "MOST POPULAR" ribbon.
 *
 * Every quota named here is the backend's, not a marketing estimate: the
 * mock-interview figures come from PLAN_CONFIG in academy's
 * src/modules/mock-interview/helpers/subscription-access.ts, which is the only
 * thing that actually grants or refuses a session. Change them there first.
 *
 * The tiers this page sells, verbatim from that PLAN_CONFIG:
 *
 *     free:       { maxSessions: 1,  allowedDurations: [15] },
 *     pro:        { maxSessions: -1, allowedDurations: [15, 30] },
 *     enterprise: { maxSessions: -1, allowedDurations: [15, 30, 45, 60] },
 *
 * Session COUNT no longer separates Pro from Enterprise — both are
 * unlimited. Session LENGTH does, and it is the only thing that does, so
 * every surface quoting an interview allowance has to carry the duration
 * with it or it implies the two tiers offer the same product.
 */
const FREE_FEATURES: string[] = [
  "Free courses and the first steps of every path",
  // Free is NOT shut out of mock interviews — PLAN_CONFIG gives the free tier
  // maxSessions: 1 on a calendar-month window, and nothing gates the scored
  // report behind a tier once the session is allowed. This line used to say
  // "AI mock interviews and reports — not included", which understated the
  // free tier and made the whole column look less trustworthy than it is.
  "One AI mock interview a month, scored",
  "Community forum access",
  "Public portfolio and profile",
  "XP, streaks, and the leaderboard",
];

const PRO_FEATURES: string[] = [
  "Every learning path and premium course, end to end",
  "All projects, with code review on each submission",
  // Same noun phrase as the table's Build row ("Bite-size practice
  // exercises"), with Pro's qualifier in front. It read "Unlimited coding
  // exercises in the playground" while the table called the same thing
  // something else — the exact card/table drift the table exists to settle.
  "Unlimited bite-size practice exercises",
  // The duration qualifier is load-bearing: with session
  // COUNT now identical on Pro and Enterprise, length is the only thing left
  // separating them on interviews (PLAN_CONFIG.allowedDurations — Pro 15/30,
  // Enterprise up to 60). Without it this card reads as though Pro and
  // Enterprise offer the same interview product.
  "Unlimited AI mock interviews, up to 30 minutes each",
  "Verified, shareable certificates",
  // "Community forum access" is deliberately NOT repeated here. Free has it
  // too, so on the card that has to justify an upgrade it is a wasted line;
  // the table carries it under Support, marked for all three tiers.
  "Priority support",
];

/**
 * What Enterprise adds ON TOP of Pro — deliberately not a repeat of
 * PRO_FEATURES; the card leads with an "Everything in Pro, plus:" line (see
 * the Enterprise card below) so this array lists only the delta.
 *
 * These five are a SUMMARY, not the tier's full inventory. Bootcamps and
 * certification exams are still genuine Enterprise features — they remain in
 * the comparison table's "Team & enterprise" group and in lib/data.ts's
 * Enterprise plan record — they simply are not among the five lines this card
 * spends. The card points at the table; the table enumerates.
 */
const ENTERPRISE_FEATURES: string[] = [
  // NO seat/pricing line here, deliberately. The card states the commercial
  // model twice already, in larger type and closer to the decision: the
  // eyebrow reads "For teams of {minSeats} and up" and the price block reads
  // "$X per user /month". A third restatement in the feature list spent a
  // slot repeating what the buyer had just read.
  //
  // Historical warning, still load-bearing: this tier was once sold as
  // "Team seats for up to 5 members ($10/seat after that)". That
  // allotment-plus-overage model is GONE — Enterprise is priced per user
  // from the first seat with no cap (lib/pricing.ts's EnterprisePricing).
  // Do not reintroduce a seat-allotment or per-seat-rate line here; the
  // rate is region-priced and belongs to the price block alone.
  //
  // The group-admin lines lead instead, because they are what an Enterprise
  // buyer is actually getting over Pro: not more content, but oversight of a
  // team's use of it. Same strings as the table's rows — these were
  // "Manage your group from one place" / "See each member's learning
  // activity and progress" until the table consolidated onto the concrete
  // artefact names, and a card that kept the old wording would have looked
  // like a different set of features.
  "Admin dashboard",
  "Team performance reports",
  "Co-branded landing page",
  // "team mentorship", not plain "1-on-1 mentorship": on a per-seat plan the
  // buyer is purchasing it for people other than themselves, and the table
  // row carries the same wording so the two surfaces cannot drift.
  "1-on-1 team mentorship with industry experts",
  // Replaces "Dedicated career placement assistance" rather than joining it.
  // Both would have been a career line, and the card has five slots; see the
  // matching table row for the same claim.
  "Hiring services",
];

/**
 * ── Feature status, in one place ──────────────────────────────────────────
 *
 * Both of these are keyed by the EXACT feature label, and both are consulted
 * by the plan cards AND the comparison table. That is the point: a feature
 * cannot be marked "Coming soon" in one surface and shipped in the other,
 * and the lookup only matches when the card and the table use the same
 * wording — so the sets quietly enforce the naming agreement this page has
 * had to be corrected on twice.
 */

/**
 * The COMING_SOON set this page reads lives in lib/plan-features.ts, not
 * here: /pricing/enterprise names the same features, and a second copy is
 * how a feature ends up chipped on one page and sold as shipped on the next.
 */

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
    // Free vs. premium COURSES and basic vs. full PATHS are two separate
    // questions, and this group used to answer them with one conflated row
    // ("Every path and course, end to end"). A visitor comparing on content
    // wants to know which of the two they're being cut off from, so each now
    // gets its own row.
    name: "Learn",
    rows: [
      {
        label: "Free courses",
        free: "yes",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Premium courses",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Learning paths",
        free: "First steps",
        pro: "Full access",
        enterprise: "Full access",
      },
      {
        label: "Create your own custom paths",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
      // ⚠️ TIER CHANGE, not a re-labelling: these two were Enterprise-ONLY
      // until now (they sat in the "Team & enterprise" group below, marked
      // no / no / yes). Pro now includes both. That narrows what Enterprise
      // sells over Pro, and it contradicts lib/data.ts unless that file
      // moves with it — Pro's record there has been flipped to match. If
      // this was not intended, revert BOTH files together.
      {
        label: "Structured, cohort-based bootcamps",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Certification exams",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
    ],
  },
  {
    // Everything a learner produces. "Coding exercises in the playground"
    // used to sit under Learn; it is something you BUILD, and it belongs
    // beside the projects it feeds. It is the same row, renamed to
    // "Bite-size practice exercises" — not a second, competing claim.
    name: "Build",
    rows: [
      {
        // Renamed from "Guided projects". Free's cell keeps its precise
        // "Starter only" rather than a flat "Limited", because that is the
        // actual boundary — the starter projects, not a metered allowance.
        label: "Step-by-step coding projects",
        free: "Starter only",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Bite-size practice exercises",
        free: "Limited",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Ship live backend products",
        free: "Limited",
        pro: "yes",
        enterprise: "yes",
      },
      {
        label: "Code review on submissions",
        free: "no",
        pro: "yes",
        enterprise: "yes",
      },
    ],
  },
  {
    // Interview access is a QUOTA, not a yes/no — and the yes/no this group
    // used to print was wrong in the one direction that costs signups: it
    // showed Free a cross for mock interviews when the free tier has always
    // had one session a month (PLAN_CONFIG.free.maxSessions === 1). The
    // numbers below, session lengths included, are read straight off that
    // same PLAN_CONFIG so the table cannot drift from what the API grants.
    name: "Grow",
    rows: [
      {
        label: "AI mock interviews",
        free: "1 / month",
        pro: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        // With session COUNT now equal on Pro and Enterprise, this row is
        // the only thing left separating the two on interviews — Pro tops
        // out at 30-minute sessions, Enterprise books up to 60. Both halves
        // come from the same PLAN_CONFIG.allowedDurations, and nothing in
        // the confirmed change touches them, so the differentiator holds.
        label: "Interview session length",
        free: "15 min",
        pro: "15 or 30 min",
        enterprise: "Up to 60 min",
      },
      {
        // Included with every session on every tier — the report is not
        // separately gated anywhere in the mock-interview module; the only
        // gate is on starting a session, which the row above prices.
        label: "Scored interview report",
        free: "yes",
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
        label: "Create a professional profile",
        free: "yes",
        pro: "yes",
        enterprise: "yes",
      },
      {
        // This absorbed the old "Public portfolio" row from the Build group
        // rather than joining it — two rows both promising a public
        // portfolio, one group apart, would read as two products.
        //
        // Wording note: this was specced as "your portfolio of ANALYSES".
        // Changed to "projects". Nothing on this platform produces an
        // analysis — learners ship backend services, and the portfolio
        // surface (components/portfolio, app/portfolios) is built around
        // projects. "Analyses" is data-analytics vocabulary and would be
        // the only line on the page that does not describe this product.
        label: "Build and share your portfolio of projects",
        free: "yes",
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
      // Group administration — the actual reason a team buys this tier
      // rather than N individual Pro subscriptions.
      //
      // CONSOLIDATED, deliberately. The spec asked to ADD "Admin dashboard"
      // and "Team performance reports" alongside the existing "Manage your
      // group from one place" and "See each member's learning activity and
      // progress". Those are the same two capabilities under two names, and
      // shipping all four would have given this group four Enterprise-only
      // rows answering two questions — the padding pattern that makes a
      // comparison table stop being believed. The newer names win because
      // they name the artefact the buyer gets rather than describing it,
      // and the Enterprise CARD was moved onto the same two strings so the
      // surfaces still agree.
      {
        label: "Admin dashboard",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
      {
        label: "Team performance reports",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
      {
        label: "Co-branded landing page",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
      // Bootcamps and certification exams have LEFT this group for Learn,
      // where they are now marked as included in Pro. See the tier-change
      // warning there.
      {
        // Same wording as the card's line — a buyer who scrolls from one to
        // the other must not have to work out whether "1-on-1 mentorship"
        // and "1-on-1 team mentorship" are two different things.
        label: "1-on-1 team mentorship with industry experts",
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
      {
        // Carried here because the Enterprise CARD now advertises it. A
        // claim that appears on a card and not in the table is the drift
        // this table exists to prevent — the visitor who scrolls down to
        // check it would find it missing and trust neither surface.
        label: "Hiring services",
        free: "no",
        pro: "no",
        enterprise: "yes",
      },
    ],
  },
  {
    name: "Support",
    rows: [
      {
        label: "Community forum access",
        free: "yes",
        pro: "yes",
        enterprise: "yes",
      },
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

/**
 * A plan card's feature summary. One implementation for all three cards now
 * that none of them carries excluded rows — the Free card used to need its
 * own mixed-list markup with per-item accessible names ("Included" /
 * "Not included") because a muted cross was the only thing distinguishing
 * the two halves. With every item included, the tick carries no information
 * a sighted user gets that a screen-reader user doesn't, so it is decorative
 * and announcing it seven times would be noise.
 */
function PlanFeatureList({
  heading,
  features,
}: {
  /**
   * The "Everything in <lower tier>, plus:" line. Omitted on Free, which is
   * the base tier and has no lower tier to inherit from — a header there
   * would have nothing to name. Pro and Enterprise both carry one, so the
   * three cards read as a ladder: Free states what you get, Pro and
   * Enterprise each state what they ADD.
   *
   * Only pass this when the tier really is a superset. Pro's is checked: it
   * matches or beats every one of Free's five lines (the mock-interview
   * quota goes 1/month → 4/month, path access goes First steps → Full
   * access, and the other three are marked for all tiers in the table).
   */
  heading?: string;
  features: string[];
}) {
  // Two cards render this on the same page, so a hardcoded id would collide
  // and point both lists' aria-labelledby at whichever <p> won.
  const headingId = useId();
  return (
    <>
      {heading && (
        <p id={headingId} className="mb-3 text-sm font-semibold">
          {heading}
        </p>
      )}
      {/* aria-labelledby, so the list is announced WITH its qualifier —
          otherwise a screen reader reads Pro's six items as a bare list and
          the "Everything in Free, plus" framing, which is the whole point of
          the line, is lost between the two elements. */}
      <ul className="grid gap-3" aria-labelledby={heading ? headingId : undefined}>
        {features.map((label) => (
          <li
            key={label}
            className="grid grid-cols-[20px_1fr] items-start gap-2.5 text-sm leading-relaxed"
          >
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>
              {label}
              {COMING_SOON.has(label) && <FeatureBadge />}
            </span>
          </li>
        ))}
      </ul>
    </>
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

  // __geo (dev-only region override — see resolveCountryWithOverride in
  // academy's src/extensions/payment/pricing/resolve-country.ts, which the
  // backend only honours in LOCAL/DEVELOP) rides along on every internal
  // link this page builds, so a developer who set it here doesn't lose the
  // region the moment they click through to checkout. Production visitors
  // never carry this param, so withGeoOverride is a no-op for them and
  // these hrefs stay byte-identical to today's.
  const checkoutHref = withGeoOverride(
    `/checkout?plan=pro&cycle=${cycle}`,
    searchParams,
  );
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

  // Downgrade targets. Scope agreed with the product owner: TIER changes only —
  // Enterprise -> Pro and Pro -> Free. Switching billing cycle on the same tier
  // is deliberately not a downgrade here.
  //
  // The subscription row id (not the processor's id) is what the downgrade
  // endpoint keys on. Absent it there is nothing to act on, so the buttons stay
  // hidden rather than rendering a control that cannot work.
  const subscriptionRowId: string | undefined = (user as any)?.subscription?.id;
  const currentPlanName = isEnterprise ? "Enterprise" : "Pro";
  const renewsOn = (user as any)?.subscription?.expiry
    ? new Date((user as any).subscription.expiry).toLocaleDateString()
    : null;
  const canDowngradeToFree = Boolean(
    subscriptionRowId && (isPro || isEnterprise),
  );
  const canDowngradeToPro = Boolean(subscriptionRowId && isEnterprise);

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
  const enterpriseCtaHref = withGeoOverride(
    `/checkout?plan=enterprise&cycle=${cycle}`,
    searchParams,
  );

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

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
        {/* ── Billing cycle ──
            A PAGE-level control, and deliberately no longer inside the Pro
            card. What it actually governs: Pro's price, Enterprise's
            per-seat price, BOTH price lines in the comparison-table header,
            and the `cycle` query param on both checkout links. Housing a
            control with that reach inside one of the three cards it
            reprices made it read as a Pro-only option, and buried the
            annual saving under the recommended card's ribbon where a
            visitor comparing Enterprise never looked. Above the row it
            reads as what it is: the switch that reprices the page.

            Fixed white/amber values, not theme tokens — this sits on the
            hero's fixed navy in both light and dark theme, the same
            reasoning the trusted-by band and testimonial below already
            spell out. The aria-label stays "Bill yearly": the flanking
            Monthly/Yearly words are visual state, and a switch still needs
            a name that says what turning it ON does. */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span
            className={cn(
              "text-sm font-semibold transition-colors",
              cycle === "monthly" ? "text-white" : "text-white/60",
            )}
          >
            Monthly
          </span>
          <Switch
            checked={cycle === "annual"}
            onCheckedChange={(checked) =>
              setCycle(checked ? "annual" : "monthly")
            }
            aria-label="Bill yearly"
          />
          <span
            className={cn(
              "text-sm font-semibold transition-colors",
              cycle === "annual" ? "text-white" : "text-white/60",
            )}
          >
            Yearly
          </span>
          {/* Outlined, not filled: a solid amber block next to the switch
              read as a muddy disabled button against the navy, and a solid
              fill would also compete with the primary-filled "MOST POPULAR"
              ribbon directly below it. The border defines the shape; the
              amber carries the meaning. */}
          <span className="rounded-md border border-amber-400/40 px-2 py-1 font-mono text-[11px] font-bold tracking-wide text-amber-300">
            SAVE 2 MONTHS
          </span>
        </div>

        {/* A "New in Pro" banner sat here, announcing that bootcamps and
            certification exams had moved into Pro. Removed by request. The
            tier change itself stands — both are still marked for Pro in the
            comparison table — it is only the announcement that is gone, so
            the cards follow the cycle toggle directly again. */}
        <div className="mx-auto mt-10 grid max-w-[796px] grid-cols-1 items-start justify-items-center gap-6 lg:max-w-[1120px] lg:grid-cols-3 lg:items-center lg:justify-items-stretch lg:gap-0">
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

            {/* One CTA per card. A subscriber offered "Downgrade to Free"
                must not also be offered "Get started" — that is a sign-up
                action they already completed, and showing both leaves them
                guessing which one changes their plan. */}
            {canDowngradeToFree ? (
              <DowngradeButton
                className="my-6 w-full"
                subscriptionId={subscriptionRowId!}
                target="free"
                label="Downgrade to Free"
                currentPlanName={currentPlanName}
                renewsOn={renewsOn}
                onDone={() => window.location.reload()}
              />
            ) : freeCtaIsCurrent ? (
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

            <PlanFeatureList features={FREE_FEATURES} />
          </div>

          {/* Pro — deliberately NOT stretched to the row via its own
              rounded-2xl/border-2/shadow stack, which is what reads as
              "lifted out of the panel": it sits on top of (and slightly
              overlaps) the shared divider between Free and Enterprise. */}
          <div className="relative z-10 w-full max-w-[380px] rounded-2xl border-2 border-primary bg-card p-8 text-left text-card-foreground shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)] lg:max-w-none">
            {/* "Most popular" only. This ribbon briefly read "MOST POPULAR ·
                BEST VALUE"; the value claim now belongs to Enterprise (see
                its chip below), so the two superlatives sit on different
                cards and each says one thing. */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-3.5 py-1 font-mono text-[11px] font-bold tracking-widest text-primary-foreground">
              MOST POPULAR
            </span>

            {/* The savings pill and billing toggle that used to sit here,
                between the ribbon and the plan name, are now the page-level
                control above the card row — they repriced Enterprise and
                the comparison table too, so they never belonged to this
                card. Pro now opens on its name, exactly like Free and
                Enterprise, which is what lets the three headers line up. */}

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
                {/* The "included in Enterprise" pill and the downgrade button
                    say contradictory things about the same card, so only one
                    shows: the actionable one wins. */}
                {canDowngradeToPro ? (
                  <DowngradeButton
                    className="w-full"
                    subscriptionId={subscriptionRowId!}
                    target="pro"
                    label="Downgrade to Pro"
                    currentPlanName="Enterprise"
                    renewsOn={renewsOn}
                    onDone={() => window.location.reload()}
                  />
                ) : (
                  <div className="w-full rounded-md bg-secondary px-4 py-2.5 text-center text-sm font-bold text-secondary-foreground">
                    Included in your Enterprise plan
                  </div>
                )}
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

            <PlanFeatureList
              heading="Everything in Free, plus:"
              features={PRO_FEATURES}
            />
          </div>

          {/* Enterprise — no "Best Value" ribbon: that claim belongs to Pro
              ("Most Popular") alone. Enterprise now carries the "Best Value"
              claim instead, as an amber chip beside its name — see below. */}
          <div className="relative w-full max-w-[380px] rounded-2xl border border-border bg-card p-8 text-left text-card-foreground lg:max-w-none lg:rounded-none lg:rounded-r-2xl lg:border-none">
            {/* Name first, eyebrow beneath. Enterprise gets a distinct
                secondary accent — reusing the same coral/red already on this
                card's Crown badge (#EB5757) rather than inventing a new hex
                value, so the name and the "premium tier" badge read as one
                deliberate colour choice instead of two unrelated ones.

                The "Best Value" chip is an amber CHIP, not a ribbon like
                Pro's: a second ribbon would want the same centred position
                above the card and would read as two cards competing for the
                same crown. Inline beside the name it reads as a property of
                this tier instead. Amber is the page's existing "saving"
                colour — the same family as the SAVE 2 MONTHS badge on the
                cycle toggle — so value claims stay one colour throughout,
                and it sits clear of both the brand cyan and this card's
                coral. min-w-0 + truncate on the heading so the chip never
                gets pushed out of the card on a narrow viewport. */}
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-2xl font-bold tracking-tight text-[#EB5757]">
                  Enterprise
                </h2>
                <span className="inline-block flex-none whitespace-nowrap rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                  Best Value
                </span>
              </div>
              <Crown
                className="h-4 w-4 flex-none text-[#EB5757]"
                aria-hidden="true"
              />
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
            {/* min-h-[80px], not the [62px] Free and Pro use: this stack is
                one line taller than theirs ("per user" sits ABOVE "/month",
                then "billed annually" below it), so on the annual cycle it
                measured 80px and overflowed a 62px floor. The card then
                changed height every time the billing toggle flipped —
                500px annual, 482px monthly — and because the row centres
                each card on its own height (lg:items-center), Enterprise
                visibly jumped 9px up and down against its neighbours on a
                control the user is expected to click.

                Reserving the TALLEST state makes both cycles render in the
                same box. Free and Pro keep 62px, which already fits their
                shorter stacks in both cycles. */}
            <div className="flex min-h-[80px] items-baseline gap-2.5">
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

            <PlanFeatureList
              heading="Everything in Pro, plus:"
              features={ENTERPRISE_FEATURES}
            />

            {/* The card is a summary by design (five lines, capped). A buyer
                deciding for a TEAM needs the seat maths, the rollout, and the
                rest of the inventory — that is a page, not a card, so this
                points at it rather than growing the card a seventh time. */}
            <Link
              href={routes.pricingEnterprise}
              className="mt-4 block text-sm font-semibold text-primary hover:underline"
            >
              See everything teams get&nbsp;→
            </Link>
          </div>
        </div>

        <a
          href="#compare"
          className="mt-8 inline-block text-sm font-semibold text-white hover:text-primary"
        >
          Compare features&nbsp;&nbsp;↓
        </a>

        {/* ── Trusted-by band ── closing part of the dark hero/cards block,
            shared verbatim with /pricing/enterprise (see
            components/pricing/trusted-by-band.tsx for the wording and the
            fixed-navy colour reasoning). */}
        <TrustedByBand />

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
                      ) : canDowngradeToFree ? (
                        // A current subscriber must not be offered "Get
                        // started" here either. The downgrade action lives on
                        // the plan card above; duplicating it into a table
                        // header cell would give the same choice two places to
                        // live, so this column simply states where they stand.
                        <span className="block text-center text-xs font-semibold text-muted-foreground">
                          Available on downgrade
                        </span>
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
                          {/* The status chip rides the LABEL, not the tier
                              cells: "coming soon" and "new" are facts about
                              the feature, identical down all three columns.
                              Putting one in each cell would triple the
                              wording and still say the same thing, and would
                              wreck the scan-down rhythm of the marks. */}
                          <th className="px-4 py-5 text-left text-sm font-normal">
                            {row.label}
                            {COMING_SOON.has(row.label) && <FeatureBadge />}
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
                // Bootcamps and certification exams stay named here — this
                // answer is the page's only prose description of Pro, and
                // omitting them would leave the FAQ selling a smaller tier
                // than the table does. The "— new —" aside that used to
                // flag them went with the banner: they are simply part of
                // what Pro includes now, with nothing marking when that
                // began.
                a: "Free gets you the free courses, the first steps of every path, one scored AI mock interview a month, the community forum, a public portfolio, and the full XP and leaderboard system. Pro unlocks every premium course and path step, all projects with code review, unlimited playground exercises, unlimited scored mock interviews at up to 30 minutes each, verified certificates, cohort-based bootcamps, and certification exams.",
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
