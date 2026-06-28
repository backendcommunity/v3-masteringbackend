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

const SAMPLE_SLUG = "hello-api-sample";

interface TryPlaygroundButtonProps {
  source: "detail" | "listing" | "nav";
  className?: string;
}

export function TryPlaygroundButton({
  source,
  className,
}: TryPlaygroundButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const handleProjectEnrollment = useAppStore(
    (s) => s.handleProjectEnrollment,
  );

  const onClick = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    analytics.track(PROJECT_EVENTS.tryPlaygroundClicked, { source });

    // Enrollment POSTs to the backend. For an already-enrolled user the backend
    // is expected to be idempotent, but if it surfaces an "already enrolled"
    // error we still want to drop the learner straight into the playground.
    try {
      await handleProjectEnrollment(SAMPLE_SLUG);
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

    setLoading(false);
    router.push(`${routes.projectPlayground(SAMPLE_SLUG)}?tour=offer`);
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label="Try the playground with a sample project"
      className={cn("gap-2", className)}
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Play aria-hidden="true" />
      )}
      <span>{loading ? "Starting…" : "Try Playground"}</span>
      <Badge
        variant="secondary"
        className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
      >
        NEW
      </Badge>
    </Button>
  );
}
