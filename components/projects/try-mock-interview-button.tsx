"use client";

import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analytics } from "@/lib/analytics";
import { MOCK_INTERVIEW_EVENTS } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";

interface TryMockInterviewButtonProps {
  source: "nav" | "listing";
  className?: string;
}

export function TryMockInterviewButton({ source, className }: TryMockInterviewButtonProps) {
  const router = useRouter();

  const onClick = () => {
    analytics.track(MOCK_INTERVIEW_EVENTS.bannerCtaClicked, { source });
    router.push("/mock-interviews/demo?tour=offer");
  };

  const variant = source === "listing" ? "default" : "ghost";
  const surfaceClass =
    source === "nav"
      ? // keep brand text/icon on hover — the ghost variant's
        // hover:text-accent-foreground would otherwise recolor it
        "text-primary hover:bg-primary/10 hover:text-primary"
      : "shadow-sm shadow-primary/25";
  const badgeClass =
    source === "listing"
      ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
      : "bg-primary/15 text-primary hover:bg-primary/15 border-transparent";

  return (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      aria-label="Try a mock interview walkthrough"
      className={cn("gap-2 font-semibold", surfaceClass, className)}
    >
      <Mic aria-hidden="true" />
      <span>Try Mock Interview</span>
      <Badge variant="secondary" className={cn("ml-0.5", badgeClass)}>
        NEW
      </Badge>
    </Button>
  );
}
