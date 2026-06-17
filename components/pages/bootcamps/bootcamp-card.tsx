"use client";

import { Clock, Users, ArrowRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { stripHtmlTags } from "@/lib/html-utils";
import type { Bootcamp } from "@/lib/data";

const LEVEL_STYLES: Record<string, { pill: string; dot: string }> = {
  Beginner: {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Intermediate: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  Advanced: {
    pill: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300",
    dot: "bg-red-500",
  },
};

interface BootcampCardProps {
  bootcamp: Bootcamp;
  onNavigate: (id: string) => void;
}

function formatStart(value: string | Date | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BootcampCard({ bootcamp, onNavigate }: BootcampCardProps) {
  const levelStyle = LEVEL_STYLES[bootcamp.level ?? ""] ?? {
    pill: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };
  const enrolled = !!bootcamp.enrolled;
  const progress = bootcamp.userCohort?.progress ?? 0;
  const start = formatStart(bootcamp.startDate ?? bootcamp.cohort?.startsAt);
  const spotsLeft = bootcamp.spotsLeft;

  return (
    <div
      onClick={() => onNavigate(bootcamp.id)}
      className="group bg-card rounded-2xl border border-border flex flex-col cursor-pointer hover:shadow-md hover:border-primary/30 transition-all p-5"
    >
      {/* Top row: label + start date */}
      <div className="flex items-start justify-between gap-1 text-[11px]">
        <span className="text-muted-foreground font-medium truncate">
          Bootcamp
        </span>
        {start && (
          <span className="shrink-0 text-muted-foreground font-medium">
            Starts {start}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-foreground text-[15px] mt-1 leading-snug line-clamp-2">
        {bootcamp.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-[13px] line-clamp-4 mt-2 leading-relaxed flex-1">
        {stripHtmlTags(bootcamp.description ?? "")}
      </p>

      {/* Progress (enrolled only) */}
      {enrolled && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progress</span>
            <span className="font-semibold text-foreground">
              {Math.floor(progress)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/50 flex items-center justify-between pt-3 mt-3">
        <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
          {bootcamp.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {bootcamp.duration}
            </span>
          )}
          {!enrolled && typeof spotsLeft === "number" && spotsLeft > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {spotsLeft} spots
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {bootcamp.level && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                levelStyle.pill,
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", levelStyle.dot)} />
              {bootcamp.level}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(bootcamp.id);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {enrolled ? (
              <Play className="w-2.5 h-2.5" />
            ) : (
              <ArrowRight className="w-2.5 h-2.5" />
            )}
            {enrolled ? "Access" : "View"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BootcampCard;
