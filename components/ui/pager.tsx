"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * System pagination — listing pages never show page numbers.
 * Previous/Next only (see DESIGN_SYSTEM.md). For infinite-style lists use a
 * "Load more" button instead; never numbered pagination.
 */
export function Pager({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  className = "",
}: {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  if (!hasPrev && !hasNext) return null;
  const btn =
    "inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
  return (
    <div className={`flex items-center justify-center gap-3 mt-8 ${className}`}>
      <button onClick={onPrev} disabled={!hasPrev} className={btn}>
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>
      <button onClick={onNext} disabled={!hasNext} className={btn}>
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
