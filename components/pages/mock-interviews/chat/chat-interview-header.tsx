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
  BarChart2,
  Info,
  Timer,
  Code2,
  PenTool,
} from "lucide-react";
import { analytics } from "@/lib/analytics";
import Image from "next/image";
import { ChatInterviewTemplate } from "@/lib/store";

interface ChatInterviewHeaderProps {
  template: ChatInterviewTemplate;
  onEndInterview: () => void;
  onTimerExpired?: () => void;
  onExitRoom?: () => void;
  isComplete?: boolean;
  resultsReady?: boolean;
  startedAt?: string | null;
}

function useCountdown(
  durationMinutes: number,
  startedAt: string | null | undefined,
  onExpire: () => void,
) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!startedAt) return durationMinutes * 60;
    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000,
    );
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
    title: "Answering Questions",
    content:
      "Kap AI asks questions one at a time. Type your answer in the input at the bottom and press Enter or click Send. Your progress (e.g. 2 / 5 responses) is shown above the input. Kap may ask follow-ups — just keep responding naturally.",
  },
  {
    value: "code",
    icon: Code2,
    title: "Code Editor",
    content:
      "On desktop, use the Code Editor panel on the right to write code solutions. Pick your language, write your code, then click 'Submit to Kap' — your code is sent directly into the chat for Kap to evaluate.",
  },
  {
    value: "whiteboard",
    icon: PenTool,
    title: "Whiteboard",
    content:
      "Switch to the Whiteboard tab (desktop only) to sketch system diagrams or architecture drawings. Click 'Submit to Kap' to share your diagram in the conversation.",
  },
  {
    value: "timer",
    icon: Timer,
    title: "Timer",
    content:
      "The countdown shows remaining interview time. It turns amber at 5 minutes and red at 1 minute remaining. When it hits zero the session ends automatically — equivalent to clicking 'End Interview'.",
  },
  {
    value: "feedback",
    icon: BarChart2,
    title: "Feedback & Score",
    content:
      "Your performance report generates automatically once the interview ends (requires at least 3 answered questions). It shows an overall score, subscores for Technical / Communication / Problem Solving, and per-question feedback revealed inline in the chat.",
  },
];

export function ChatInterviewHeader({
  template,
  onEndInterview,
  onTimerExpired,
  onExitRoom,
  isComplete,
  resultsReady,
  startedAt,
}: ChatInterviewHeaderProps) {
  const warned5minRef = useRef(false);
  const warned1minRef = useRef(false);

  const handleTimerExpire = useCallback(() => {
    onTimerExpired?.();
    onEndInterview();
  }, [onTimerExpired, onEndInterview]);

  const { display, secondsLeft } = useCountdown(
    template.duration || 30,
    startedAt,
    handleTimerExpire,
  );

  useEffect(() => {
    if (isComplete) return;
    if (secondsLeft < 300 && secondsLeft > 0 && !warned5minRef.current) {
      warned5minRef.current = true;
      analytics.track("chat_interview_timer_warning", { template_id: template.id, minutes_remaining: 5 });
    }
    if (secondsLeft < 60 && secondsLeft > 0 && !warned1minRef.current) {
      warned1minRef.current = true;
      analytics.track("chat_interview_timer_warning", { template_id: template.id, minutes_remaining: 1 });
    }
  }, [secondsLeft, isComplete, template.id]);

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
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
          <Image
            src="/blue-icon-logo.png"
            alt="Mastering Backend"
            width={26}
            height={26}
            className="object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {template.name || template.position || "Mock Interview"}
          </p>
          {(template.position || template.company) && (
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {[template.position, template.company]
                .filter(Boolean)
                .join(" · ")}
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
        <Sheet onOpenChange={(open) => { if (open) analytics.track("chat_interview_help_opened", { template_id: template.id }); }}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Info className="w-4 h-4" />
              <span className="sr-only">Help</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[320px] sm:w-[320px] p-0 flex flex-col"
          >
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
                  <span className="font-semibold text-foreground">
                    Pro tip:
                  </span>{" "}
                  This help panel is always available during your interview.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* End interview / Exit room */}
        {isComplete ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-3 opacity-50 cursor-default"
              disabled
            >
              Interview Ended
            </Button>
            {resultsReady && onExitRoom && (
              <Button
                size="sm"
                className="h-8 text-xs px-3 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => {
                  analytics.track("chat_interview_exit_room_clicked", { template_id: template.id });
                  onExitRoom();
                }}
              >
                Exit Room
              </Button>
            )}
          </div>
        ) : (
          <AlertDialog onOpenChange={(open) => { if (open) analytics.track("chat_interview_end_clicked", { template_id: template.id }); }}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs px-3"
              >
                End Interview
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End interview?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to end the interview now? Your progress
                  will be saved and you can still get your feedback report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    analytics.track("chat_interview_end_confirmed", { template_id: template.id });
                    onEndInterview();
                  }}
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
