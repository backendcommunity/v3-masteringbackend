"use client";

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronLeft, HelpCircle, PhoneOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface InterviewHeaderProps {
  interviewTitle?: string;
  interviewType?: string;
  currentQuestion?: number;
  totalQuestions?: number;
  timeRemaining: number; // in seconds
  isConnected?: boolean;
  connectionStatus?: "connected" | "connecting" | "failed";
  onBack?: () => void;
  onEndInterview?: () => void;
  className?: string;
  // Optional help content (e.g. interview tips) shown in a header popover.
  help?: ReactNode;
}

export function InterviewHeader({
  interviewTitle,
  interviewType,
  timeRemaining,
  onBack,
  onEndInterview,
  className,
  help,
}: InterviewHeaderProps) {
  const [pulseTime, setPulseTime] = useState(false);

  useEffect(() => {
    setPulseTime(timeRemaining <= 60);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const timeColor =
    timeRemaining <= 60
      ? "text-red-500"
      : timeRemaining <= 300
        ? "text-amber-500"
        : "text-foreground";

  return (
    <TooltipProvider delayDuration={200}>
      <header
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10",
          className,
        )}
      >
        {/* Left: brand + title */}
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exit interview</TooltipContent>
            </Tooltip>
          )}
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
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {interviewTitle || "Mock Interview"}
            </p>
            {interviewType && (
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {interviewType}
              </p>
            )}
          </div>
        </div>

        {/* Center: timer */}
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          <Clock className={cn("w-3.5 h-3.5", timeColor)} />
          <span
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              timeColor,
              pulseTime && "animate-pulse",
            )}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Right: help + end */}
        <div className="flex items-center gap-2">
          {interviewType && (
            <Badge variant="outline" className="hidden md:inline-flex">
              {interviewType}
            </Badge>
          )}
          {help && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Tips"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="sr-only">Tips</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="max-h-[70vh] w-[320px] overflow-y-auto p-4"
              >
                {help}
              </PopoverContent>
            </Popover>
          )}
          {onEndInterview && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onEndInterview}
              className="h-8 gap-1.5 px-3"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">End Interview</span>
            </Button>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
