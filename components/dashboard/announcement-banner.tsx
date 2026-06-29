"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analytics } from "@/lib/analytics";
import { MOCK_INTERVIEW_EVENTS } from "@/lib/analytics-events";

const DISMISS_KEY = "mb_mockinterview_banner_dismissed";

function isDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Above-the-fold dashboard promo for the new Mock Interviews feature. CTA opens
 * the scripted walkthrough. Dismissible per browser via localStorage.
 */
export function AnnouncementBanner() {
  const router = useRouter();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isDismissed()) return;
    setHidden(false);
    analytics.track(MOCK_INTERVIEW_EVENTS.bannerViewed, { surface: "dashboard" });
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — just hide for this view */
    }
    analytics.track(MOCK_INTERVIEW_EVENTS.bannerDismissed);
    setHidden(true);
  };

  const open = () => {
    analytics.track(MOCK_INTERVIEW_EVENTS.bannerCtaClicked, { surface: "dashboard" });
    router.push("/mock-interviews/demo?tour=offer");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-5 sm:p-6">
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={dismiss}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/20">
          <Mic className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/15">
              NEW
            </Badge>
            <h2 className="font-bold">Mock Interviews</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Practice real interviews with Kap AI — get scored, get hired.
          </p>
        </div>
        <Button onClick={open} className="shrink-0 font-semibold shadow-sm shadow-primary/25 sm:ml-auto">
          Try a Mock Interview →
        </Button>
      </div>
    </div>
  );
}
