"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analytics } from "@/lib/analytics";
import { PROJECT_EVENTS } from "@/lib/analytics-events";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Loader2, Play } from "lucide-react";
import { routes } from "@/lib/routes";

const SAMPLE_SLUG = "playground-demo";

interface TryPlaygroundButtonProps {
  source: "detail" | "detail-sidebar" | "listing" | "nav";
  /**
   * Target project to open. When omitted (listing/nav) the seeded SAMPLE is
   * used and the full auto-driven demo runs. On the project DETAIL page, pass
   * the current project's slug — the tour then runs as a GUIDE (highlight-only,
   * strict) on that real project, not the sample.
   */
  slug?: string;
  className?: string;
}

export function TryPlaygroundButton({
  source,
  slug,
  className,
}: TryPlaygroundButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const handleProjectEnrollment = useAppStore(
    (s) => s.handleProjectEnrollment,
  );

  const targetSlug = slug ?? SAMPLE_SLUG;

  const onClick = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    analytics.track(PROJECT_EVENTS.tryPlaygroundClicked, { source, slug: targetSlug });

    // Skip enrollment for demo mode (frontend-only, no DB project needed)
    if (targetSlug !== "playground-demo") {
      // Enrollment POSTs to the backend. For an already-enrolled user the backend
      // is expected to be idempotent, but if it surfaces an "already enrolled"
      // error we still want to drop the learner straight into the playground.
      try {
        await handleProjectEnrollment(targetSlug);
      } catch (error: any) {
        const message: string = String(
          error?.response?.data?.message ?? "",
        ).toLowerCase();
        const alreadyEnrolled =
          message.includes("already") || error?.response?.status === 409;
        if (!alreadyEnrolled) {
          toast.error("Couldn't start the playground. Please try again.");
          inFlight.current = false;
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    router.push(`${routes.projectPlayground(targetSlug)}?tour=offer`);
  };

  // Visual hierarchy by surface:
  // - listing: the primary brand CTA (solid) — this is the marketing entry point
  // - detail:  SECONDARY to "Start/Continue Building"; outline on the navy hero
  // - detail-sidebar: outline on card background (sidebar)
  // - nav:     compact, low-emphasis ghost
  const variant =
    source === "listing" ? "default" : source === "detail" || source === "detail-sidebar" ? "outline" : "ghost";
  const surfaceClass =
    source === "detail"
      ? "border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      : source === "detail-sidebar"
        ? "border-primary/40 text-primary hover:text-primary hover:bg-primary/10"
        : source === "nav"
          ? "text-primary hover:bg-primary/10"
          : "shadow-sm shadow-primary/25"; // listing (solid brand)
  const badgeClass =
    source === "listing"
      ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
      : "bg-primary/15 text-primary hover:bg-primary/15 border-transparent";
  const ariaLabel =
    source === "detail" || source === "detail-sidebar"
      ? "Open this project's playground and take a guided tour"
      : "Try the playground with a sample project";

  return (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      disabled={loading}
      aria-label={ariaLabel}
      className={cn("gap-2 font-semibold", surfaceClass, className)}
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Play aria-hidden="true" />
      )}
      <span>{loading ? "Starting…" : "Try Playground"}</span>
      <Badge variant="secondary" className={cn("ml-0.5", badgeClass)}>
        NEW
      </Badge>
    </Button>
  );
}
