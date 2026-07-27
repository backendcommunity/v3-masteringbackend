"use client";

import { Bookmark, Building2, Clock, Loader2, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MockInterviewTemplateCardData {
  id: string;
  name: string | null;
  position?: string | null;
  company?: string | null;
  category?: string | null;
  style?: string | null;
  format?: string | null;
  difficulty: string;
  duration: number;
  description?: string | null;
  summary?: string | null;
}

interface MockInterviewTemplateCardProps {
  template: MockInterviewTemplateCardData;
  onSelect: () => void;
  isSaved?: boolean;
  isSaving?: boolean;
  isStarting?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  /** When set, renders a CTA button in the footer that calls onSelect */
  actionLabel?: string;
  /** Compact layout — tighter padding, smaller text. Used in completion dialog. */
  compact?: boolean;
}


const DIFFICULTY_STYLES: Record<string, { pill: string; dot: string }> = {
  Easy: {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Medium: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  Hard: {
    pill: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300",
    dot: "bg-red-500",
  },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const style = DIFFICULTY_STYLES[difficulty] ?? {
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
      {difficulty}
    </span>
  );
}

export function MockInterviewTemplateCard({
  template,
  onSelect,
  isSaved = false,
  isSaving = false,
  isStarting = false,
  onToggleSave,
  onDelete,
  actionLabel,
  compact = false,
}: MockInterviewTemplateCardProps) {
  const label =
    template.name ||
    (template.position && template.company
      ? `${template.position} at ${template.company}`
      : template.position ?? template.company ?? "Mock Interview");

  // Style (question genre) is redundant when it duplicates the category — hide it.
  const showStyle =
    !!template.style &&
    template.style.trim().toLowerCase() !==
      (template.category ?? "").trim().toLowerCase();

  return (
    <div
      onClick={isStarting ? undefined : onSelect}
      className={cn(
        "group bg-card rounded-2xl border border-border flex flex-col cursor-pointer hover:shadow-md hover:border-primary/30 transition-all",
        compact ? "p-3.5 space-y-2" : "p-5",
        isStarting && "opacity-60 cursor-not-allowed",
      )}
    >
      {/* Top row: company · category · style (question genre) + bookmark/delete */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {template.company && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary font-semibold shrink-0",
                compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5",
              )}
              title={template.company}
            >
              <Building2 className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
              <span className="truncate max-w-[110px]">{template.company}</span>
            </span>
          )}
          {template.category && (
            <span className={cn("text-muted-foreground font-medium truncate", compact ? "text-[10px]" : "text-[11px]")}>
              {template.category}
            </span>
          )}
          {template.category && showStyle && (
            <span className={cn("text-muted-foreground/40 shrink-0", compact ? "text-[10px]" : "text-[11px]")}>·</span>
          )}
          {showStyle && (
            <span className={cn("text-muted-foreground font-medium truncate", compact ? "text-[10px]" : "text-[11px]")}>
              {template.style}
            </span>
          )}
          {!template.company && !template.category && !template.style && (
            <span className={cn("text-muted-foreground font-medium", compact ? "text-[10px]" : "text-[11px]")}>
              Interview
            </span>
          )}
        </div>
        {onDelete ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(e); }}
            className="shrink-0 p-0.5 -mt-0.5 rounded transition-colors text-muted-foreground/40 hover:text-destructive"
            aria-label="Delete template"
          >
            <Trash2 className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          </button>
        ) : onToggleSave && (
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
              <Loader2 className={cn("animate-spin text-muted-foreground", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
            ) : (
              <Bookmark
                className={cn(
                  "transition-colors",
                  compact ? "w-3.5 h-3.5" : "w-4 h-4",
                  isSaved ? "fill-primary text-primary" : "text-muted-foreground/40",
                )}
              />
            )}
          </button>
        )}
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-bold text-foreground leading-snug line-clamp-2",
          compact ? "text-sm mt-0" : "text-base mt-1",
        )}
      >
        {label}
      </h3>

      {/* Description */}
      {(template.description || template.summary) && (
        <p
          className={cn(
            "text-muted-foreground leading-relaxed flex-1",
            compact ? "text-[11px] line-clamp-3" : "text-sm line-clamp-4 mt-2",
          )}
        >
          {template.description || template.summary}
        </p>
      )}

      {/* Footer */}
      <div
        className={cn(
          "border-t border-border/50 flex items-center justify-between",
          compact ? "pt-1.5 mt-auto" : "pt-3 mt-3",
        )}
      >
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          {isStarting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          {template.duration} min
        </span>
        <div className="flex items-center gap-1.5">
          <DifficultyBadge difficulty={template.difficulty} />
          {actionLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Play className="w-2.5 h-2.5" />
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
