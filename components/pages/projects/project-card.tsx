"use client";

import {
  ArrowRight,
  Award,
  Bookmark,
  Clock,
  Loader2,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { stripHtmlTags } from "@/lib/html-utils";

export interface ProjectCardData {
  /** real Project.id (uuid) — used for bookmarking */
  id: string;
  slug: string;
  title: string | null;
  description?: string | null;
  level: string;
  /** tech/domain — shown in the meta row when present (mirrors path/mock card) */
  category?: string | null;
  /** number of tasks in the project */
  tasks: number;
  /** duration label, e.g. "2 weeks" / "Self-paced" */
  duration?: string;
  enrolled: boolean;
  completed: boolean;
  progress: number;
}

interface ProjectCardProps {
  project: ProjectCardData;
  onSelect: () => void;
  isSaved?: boolean;
  isSaving?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
}

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

function LevelBadge({ level }: { level: string }) {
  const style = LEVEL_STYLES[level] ?? {
    pill: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        style.pill,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      {level}
    </span>
  );
}

export function ProjectCard({
  project,
  onSelect,
  isSaved = false,
  isSaving = false,
  onToggleSave,
}: ProjectCardProps) {
  const duration = project.duration || "Self-paced";

  const action = project.completed
    ? { label: "Review", Icon: Award, outline: true }
    : project.enrolled
      ? { label: "Continue", Icon: Play, outline: false }
      : { label: "Start", Icon: ArrowRight, outline: false };

  return (
    <div
      onClick={onSelect}
      className="group bg-card rounded-2xl border border-border flex flex-col cursor-pointer hover:shadow-md hover:border-primary/30 transition-all p-5"
    >
      {/* Top row: (category ·) tasks + bookmark */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
          <span className="text-muted-foreground font-medium truncate">
            Project
          </span>
          {project.category && (
            <>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-muted-foreground font-medium truncate">
                {project.category}
              </span>
            </>
          )}
          {project.tasks > 0 && (
            <>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-muted-foreground font-medium truncate">
                {project.tasks} {project.tasks === 1 ? "task" : "tasks"}
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
        {project.title}
      </h3>

      {/* Description */}
      {project.description && (
        <p className="text-muted-foreground text-[13px] line-clamp-4 mt-2 leading-relaxed flex-1">
          {stripHtmlTags(project.description)}
        </p>
      )}

      {/* Progress (enrolled only) */}
      {project.enrolled && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progress</span>
            <span
              className={cn(
                "font-semibold",
                project.completed
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground",
              )}
            >
              {project.progress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                project.completed ? "bg-emerald-500" : "bg-primary",
              )}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/50 flex items-center justify-between pt-3 mt-3">
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {duration}
        </span>
        <div className="flex items-center gap-1.5">
          <LevelBadge level={project.level} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors",
              action.outline
                ? "border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <action.Icon className="w-2.5 h-2.5" />
            {action.label}
          </button>
        </div>
      </div>
    </div>
  );
}
