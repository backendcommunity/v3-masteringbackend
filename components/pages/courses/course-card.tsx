"use client";

import { Bookmark, Clock, Play, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { stripHtmlTags } from "@/lib/html-utils";

export interface CourseCardData {
  /** real Course.id (uuid) — used for bookmarking */
  id?: string;
  slug: string;
  title: string | null;
  summary?: string | null;
  description?: string | null;
  level?: string | null;
  enrolled?: boolean;
  progress?: number;
  /** hours of content — shown in the footer when present */
  totalDuration?: number | string | null;
  /** course type → label (WORKSHOP / VIDEO / …) */
  type?: string | null;
  category?: { name?: string | null } | null;
}

interface CourseCardProps {
  course: CourseCardData;
  onViewDetails: (slug: string) => void;
  onContinue: (slug: string) => void;
  isSaved?: boolean;
  isSaving?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
}

const COURSE_LEVEL_STYLES: Record<string, { pill: string; dot: string }> = {
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

export function CourseCard({
  course,
  onViewDetails,
  onContinue,
  isSaved = false,
  isSaving = false,
  onToggleSave,
}: CourseCardProps) {
  const typeLabel =
    course.type === "WORKSHOP"
      ? "Workshop"
      : course.type === "VIDEO"
        ? "Course"
        : "Course";
  const levelStyle = COURSE_LEVEL_STYLES[course.level ?? ""] ?? {
    pill: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };

  return (
    <div
      onClick={() => onViewDetails(course.slug)}
      className="group bg-card rounded-2xl border border-border flex flex-col cursor-pointer hover:shadow-md hover:border-primary/30 transition-all p-5"
    >
      {/* Top row: type · category + bookmark */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
          <span className="text-muted-foreground font-medium truncate">
            {typeLabel}
          </span>
          {course.category?.name && (
            <>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-muted-foreground font-medium truncate">
                {course.category.name}
              </span>
            </>
          )}
        </div>
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(e);
            }}
            disabled={isSaving}
            className="shrink-0 p-0.5 -mt-0.5 rounded transition-colors hover:text-primary disabled:cursor-not-allowed"
            aria-label={isSaved ? "Remove bookmark" : "Bookmark"}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Bookmark
                className={cn(
                  "w-4 h-4 transition-colors",
                  isSaved
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/40",
                )}
              />
            )}
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-foreground text-[15px] mt-1 leading-snug line-clamp-2">
        {course.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-[13px] line-clamp-4 mt-2 leading-relaxed flex-1">
        {stripHtmlTags(course.summary ?? course.description ?? "")}
      </p>

      {/* Progress (enrolled only) */}
      {course.enrolled && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progress</span>
            <span className="font-semibold text-foreground">
              {Math.floor(course.progress ?? 0)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${course.progress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/50 flex items-center justify-between pt-3 mt-3">
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          {course.totalDuration ? (
            <>
              <Clock className="w-3.5 h-3.5" />
              {course.totalDuration} hr
            </>
          ) : (
            <span className="text-muted-foreground/70">Self-paced</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              levelStyle.pill,
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", levelStyle.dot)} />
            {course.level ?? "All levels"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              course.enrolled
                ? onContinue(course.slug)
                : onViewDetails(course.slug);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {course.enrolled ? (
              <Play className="w-2.5 h-2.5" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            )}
            {course.enrolled ? "Continue" : "Start"}
          </button>
        </div>
      </div>
    </div>
  );
}
