"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DeveloperPortfolioPage } from "@/components/pages/developer-portfolio";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { routes } from "@/lib/routes";
import type { PortfolioResponse } from "@/lib/portfolio-types";

interface PortfolioRouteClientProps {
  userId: string;
  initialData?: PortfolioResponse;
}

export function PortfolioRouteClient({
  userId,
  initialData,
}: PortfolioRouteClientProps) {
  const router = useRouter();
  const currentUser = useUser();
  const handleNavigate = (path: string) => router.push(path);

  // Owner = logged in AND viewing their own portfolio → full dashboard chrome.
  // Everyone else (logged out, or a logged-in user viewing someone else's) gets
  // the standalone recruiter page.
  const isOwner = Boolean(currentUser?.id && currentUser.id === userId);

  const portfolio = (
    <DeveloperPortfolioPage
      userId={userId}
      onNavigate={handleNavigate}
      initialData={initialData}
    />
  );

  if (isOwner) {
    return <DashboardLayout>{portfolio}</DashboardLayout>;
  }

  // Standalone recruiter view — no dashboard sidebar/nav.
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.push(routes.dashboard)}
            className="flex items-center gap-2"
            aria-label="MasteringBackend"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E1F33]">
              <img
                src="/logo.png"
                alt="MasteringBackend"
                className="h-6 w-6 object-contain"
              />
            </span>
            <span className="hidden text-sm font-bold tracking-tight sm:inline">
              MasteringBackend
            </span>
          </button>
          <Button size="sm" onClick={() => router.push(routes.dashboard)}>
            Build your portfolio
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{portfolio}</main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground">
          Portfolio powered by{" "}
          <button
            onClick={() => router.push(routes.dashboard)}
            className="font-semibold text-foreground hover:text-primary"
          >
            MasteringBackend
          </button>
        </p>
      </footer>
    </div>
  );
}
