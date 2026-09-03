"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { routes } from "@/lib/routes";
import { sanitizeRedirect } from "@/lib/safe-redirect";

/**
 * The chrome every logged-out-visitor-facing pricing surface wears.
 *
 * Shared by /pricing and /pricing/enterprise. Both are entry points a visitor
 * can land on cold — from an ad, a search result, or the onboarding nudge —
 * so both need the same "log in / get started / go to dashboard" affordances,
 * and a visitor moving between the two must not see the chrome change.
 *
 * It reads `?from=onboarding` and `?redirect=` itself rather than taking them
 * as props: they are properties of how the visitor ARRIVED, identical on both
 * routes, and threading them through every caller would invite one page to
 * forget one of them.
 */
export function MarketingHeader() {
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

  return (
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
  );
}
