"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JourneyGlyph } from "@/components/journey-glyph";
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
    // ── Blueprint hero (navy anchor · grow pillar) ──
    <div className="relative overflow-hidden bg-[#0E1F33] dark:bg-[#080F1A] text-white dark:ring-1 dark:ring-white/10">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={dismiss}
        className="absolute right-3 top-3 z-10 text-white/60 hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <JourneyGlyph
        stage="grow"
        className="absolute right-4 top-4 w-20 opacity-20 md:right-10 md:top-1/2 md:w-60 md:-translate-y-1/2 md:opacity-30"
      />
      <div className="relative px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Mic className="h-6 w-6 text-[#4AC5E8]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/15 text-white hover:bg-white/15">
                NEW
              </Badge>
              <div className="eyebrow-mono text-[#4AC5E8]">grow</div>
            </div>
            <h2 className="text-xl font-bold mt-1.5">Mock Interviews</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/[.78]">
              Practice a real interview with Kap AI. Get scored, get job-ready.
            </p>
          </div>
          <Button onClick={open} className="shrink-0 font-semibold shadow-sm sm:ml-auto">
            Try a Mock Interview
          </Button>
        </div>
      </div>
    </div>
  );
}
