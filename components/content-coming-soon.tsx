"use client";
import { Clock, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Shown for any content flagged isWaiting (course / project / path / project30).
 * It is "coming soon" — no enrollment, just a waitlist link. The backend enroll
 * endpoints reject isWaiting content too, so this is the user-facing half.
 */
export function ContentComingSoon({
  title,
  summary,
  waitingLink,
  kindLabel = "content",
  backLabel = "Go Back",
  onBack,
  onWaitlistTrack,
}: {
  title?: string;
  summary?: string | null;
  waitingLink?: string | null;
  kindLabel?: string;
  backLabel?: string;
  onBack?: () => void;
  onWaitlistTrack?: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-5 rounded-full bg-primary/10">
            <Clock className="h-14 w-14 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
            Coming Soon
          </Badge>
          {title && (
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          )}
          {summary && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {summary}
            </p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          This {kindLabel} is not yet available for enrollment. We&apos;re working
          hard to bring it to you. Join the waitlist to be notified when it
          launches.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {waitingLink ? (
            <Button
              size="lg"
              onClick={() => {
                onWaitlistTrack?.();
                window.open(waitingLink, "_blank", "noopener,noreferrer");
              }}
            >
              <Star className="mr-2 h-4 w-4" />
              Join the Waitlist
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Contact us to join the waitlist
            </p>
          )}
          {onBack && (
            <Button variant="outline" size="lg" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
