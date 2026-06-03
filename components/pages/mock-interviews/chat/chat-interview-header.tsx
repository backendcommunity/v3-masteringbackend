"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Clock,
  Star,
  BarChart2,
  Info,
  Timer,
} from "lucide-react";
import Image from "next/image";
import { ChatInterviewTemplate } from "@/lib/store";

interface ChatInterviewHeaderProps {
  template: ChatInterviewTemplate;
  onEndInterview: () => void;
  isComplete?: boolean;
  startedAt?: string | null;
}

function useCountdown(durationMinutes: number, startedAt: string | null | undefined, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!startedAt) return durationMinutes * 60;
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationMinutes * 60 - elapsed);
  });
  const expiredRef = useRef(false);
  const onExpireStable = useCallback(onExpire, [onExpire]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpireStable();
    }
  }, [secondsLeft, onExpireStable]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  return { display: `${mm}:${ss}`, secondsLeft };
}

const HELP_ITEMS = [
  {
    value: "chat",
    icon: MessageSquare,
    title: "Chat",
    content:
      "Type your answers in the chat box. Press Enter or click Send to submit each response. Kap AI will ask follow-up questions based on your answers.",
  },
  {
    value: "timer",
    icon: Timer,
    title: "Timer Functionality",
    content:
      "The countdown timer shows your remaining interview time. When time expires the session ends automatically. A warning appears at 5 minutes and 1 minute remaining.",
  },
  {
    value: "feedback",
    icon: Star,
    title: "Feedback",
    content:
      "After the interview ends, click 'Get your feedback' to receive a detailed performance report. Per-answer analysis will also be revealed in the chat.",
  },
  {
    value: "rating",
    icon: BarChart2,
    title: "Rating",
    content:
      "Each of your answers receives an individual score. The overall rating is calculated from your technical accuracy, communication clarity, and problem-solving approach.",
  },
];

export function ChatInterviewHeader({
  template,
  onEndInterview,
  isComplete,
  startedAt,
}: ChatInterviewHeaderProps) {
  const { display, secondsLeft } = useCountdown(
    template.duration || 30,
    startedAt,
    onEndInterview,
  );

  const timerColor =
    secondsLeft < 60
      ? "text-red-500"
      : secondsLeft < 5 * 60
        ? "text-amber-500"
        : "text-foreground";

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      {/* Left: title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 relative">
          <Image
            src="/blue-icon-logo.png"
            alt="Mastering Backend"
            fill
            className="object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {template.name || template.position || "Mock Interview"}
          </p>
          {(template.position || template.company) && (
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {[template.position, template.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Center: timer */}
      {!isComplete && (
        <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
          <Clock className={cn("w-3.5 h-3.5", timerColor)} />
          <span
            className={cn(
              "text-sm font-mono font-semibold tabular-nums",
              timerColor,
              secondsLeft < 60 && "animate-pulse",
            )}
          >
            {display}
          </span>
        </div>
      )}

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Help sidebar */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Info className="w-4 h-4" />
              <span className="sr-only">Help</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] sm:w-[320px] p-0 flex flex-col">
            <SheetHeader className="px-4 py-3 border-b border-border">
              <SheetTitle className="text-sm">Interview Help</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <Accordion type="single" collapsible defaultValue="chat">
                {HELP_ITEMS.map(({ value, icon: Icon, title, content }) => (
                  <AccordionItem key={value} value={value}>
                    <AccordionTrigger className="text-sm py-3 hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        {title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        {content}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Pro tip:</span>{" "}
                  This help panel is always available during your interview.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* End interview */}
        {isComplete ? (
          <Button variant="destructive" size="sm" className="h-8 text-xs px-3 opacity-50" disabled>
            Interview Ended
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-8 text-xs px-3">
                End Interview
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End interview?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to end the interview now? Your progress will be saved and you can still get your feedback report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onEndInterview}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  End Interview
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </header>
  );
}
