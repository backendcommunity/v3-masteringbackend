"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, X } from "lucide-react";
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
import {
  formatPrice,
  monthlyEquivalent,
  type PublicPricing,
} from "@/lib/pricing";

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

type CompareCell = "yes" | "no" | string;

const COMPARE_GROUPS: {
  name: string;
  rows: { label: string; free: CompareCell; pro: CompareCell }[];
}[] = [
  {
    name: "Learn",
    rows: [
      { label: "First steps of every path", free: "yes", pro: "yes" },
      { label: "Every path and course, end to end", free: "no", pro: "yes" },
      {
        label: "Coding exercises in the playground",
        free: "Limited",
        pro: "yes",
      },
    ],
  },
  {
    name: "Build",
    rows: [
      { label: "Guided projects", free: "Starter only", pro: "yes" },
      { label: "Code review on submissions", free: "no", pro: "yes" },
      { label: "Public portfolio", free: "yes", pro: "yes" },
    ],
  },
  {
    name: "Grow",
    rows: [
      { label: "AI mock interviews", free: "no", pro: "yes" },
      { label: "Scored interview reports", free: "no", pro: "yes" },
      { label: "Verified certificates", free: "no", pro: "yes" },
      { label: "XP, streaks, leaderboard", free: "yes", pro: "yes" },
    ],
  },
  {
    name: "Support",
    rows: [
      { label: "Community", free: "yes", pro: "yes" },
      { label: "Priority support", free: "no", pro: "yes" },
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

function CompareMark({ value }: { value: CompareCell }) {
  if (value === "yes") {
    return <Check className="mx-auto h-4 w-4 text-primary" aria-label="Included" />;
  }
  if (value === "no") {
    return (
      <X
        className="mx-auto h-4 w-4 text-muted-foreground/40"
        aria-label="Not included"
      />
    );
  }
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

export default function PricingView({ pricing }: PricingViewProps) {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const user = useUser();

  const checkoutHref = `/checkout?plan=pro&cycle=${cycle}`;
  const freeCtaIsCurrent = Boolean(user && !user.isPremium);

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
            <Button size="sm" asChild>
              <Link href={routes.dashboard}>Go to dashboard</Link>
            </Button>
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
          Go from writing endpoints to{" "}
          <span className="text-primary">designing systems</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-white/70">
          Paths, real projects with code review, and mock interviews that end
          in an offer — not another certificate for the pile.
        </p>

        {/* ── Plan cards ── */}
        <div className="mx-auto mt-14 grid max-w-[796px] grid-cols-1 justify-items-center gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="w-full max-w-[380px] rounded-2xl bg-card p-8 text-left text-card-foreground">
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

          {/* Pro */}
          <div className="relative w-full max-w-[380px] -translate-y-4 rounded-2xl border-2 border-primary bg-card p-8 text-left text-card-foreground shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]">
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

            <Button asChild className="my-6 w-full">
              <Link href={checkoutHref}>Go Pro</Link>
            </Button>

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
        </div>

        <a
          href="#compare"
          className="mb-20 mt-8 inline-block text-sm font-semibold text-white hover:text-primary"
        >
          Compare features&nbsp;&nbsp;↓
        </a>
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

          {/* ── Comparison table ── */}
          <section id="compare" className="py-2 pb-20">
            <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
              What you get on each plan
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[620px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-14 z-10 w-[44%] border-b border-border bg-muted/60 px-4 py-4 text-left align-top backdrop-blur">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th className="sticky top-14 z-10 border-b border-border bg-muted/60 px-4 py-4 text-center align-top backdrop-blur">
                      <div className="text-base font-bold">
                        Free
                      </div>
                      <div className="mb-3 mt-0.5 font-mono text-xs text-muted-foreground">
                        {formatPrice(0, pricing.currency)}
                      </div>
                      {freeCtaIsCurrent ? (
                        <span className="inline-block rounded-md bg-secondary px-3.5 py-1.5 text-xs font-bold text-secondary-foreground">
                          Current plan
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/auth/register">Get started</Link>
                        </Button>
                      )}
                    </th>
                    <th className="sticky top-14 z-10 border-b border-border bg-primary/5 px-4 py-4 text-center align-top backdrop-blur">
                      <div className="text-base font-bold text-primary">
                        Pro
                      </div>
                      <div className="mb-3 mt-0.5 font-mono text-xs text-muted-foreground">
                        {monthlyEquivalent(pricing, cycle)} /mo
                      </div>
                      <Button size="sm" asChild>
                        <Link href={checkoutHref}>Go Pro</Link>
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_GROUPS.map((group) => (
                    <Fragment key={group.name}>
                      <tr>
                        <th
                          colSpan={3}
                          className="bg-muted/30 px-4 pb-2 pt-7 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
                        >
                          {group.name}
                        </th>
                      </tr>
                      {group.rows.map((row) => (
                        <tr
                          key={row.label}
                          className="border-t border-border/60"
                        >
                          <th className="px-4 py-3 text-left font-normal">
                            {row.label}
                          </th>
                          <td className="px-4 py-3 text-center">
                            <CompareMark value={row.free} />
                          </td>
                          <td className="bg-primary/5 px-4 py-3 text-center">
                            <CompareMark value={row.pro} />
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
