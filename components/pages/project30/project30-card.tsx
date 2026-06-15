"use client";

import { Clock, Play, ChevronRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { stripHtmlTags } from "@/lib/html-utils";
import type { Project30 } from "@/lib/data";

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

interface Project30CardProps {
  project30: Project30;
  onNavigate: (slug: string) => void;
}

export function Project30Card({ project30, onNavigate }: Project30CardProps) {
  const categoryName =
    typeof project30.category === "string"
      ? project30.category
      : project30.category?.name ?? null;
  const levelStyle = LEVEL_STYLES[project30.level ?? ""] ?? {
    pill: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };
  const enrolled = !!project30.isEnrolled;
  const progress = project30.progress ?? 0;

  return (
    <div
      onClick={() => onNavigate(project30.slug)}
      className="group bg-card rounded-2xl border border-border flex flex-col cursor-pointer hover:shadow-md hover:border-primary/30 transition-all p-5"
    >
      {/* Top row: category + premium pill */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
          <span className="text-muted-foreground font-medium truncate">
            Ship
          </span>
          {categoryName && (
            <>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-muted-foreground font-medium truncate">
                {categoryName}
              </span>
            </>
          )}
        </div>
        {project30.isPremium && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
            <Crown className="w-3 h-3" />
            Premium
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-foreground text-[15px] mt-1 leading-snug line-clamp-2">
        {project30.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-[13px] line-clamp-4 mt-2 leading-relaxed flex-1">
        {stripHtmlTags(project30.description ?? "")}
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
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {project30.totalDays
            ? `${project30.totalDays} days`
            : project30.duration || "Self-paced"}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              levelStyle.pill,
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", levelStyle.dot)} />
            {project30.level ?? "All levels"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(project30.slug);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {enrolled ? (
              <Play className="w-2.5 h-2.5" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            )}
            {enrolled ? "Continue" : "Start"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Project30Card;
