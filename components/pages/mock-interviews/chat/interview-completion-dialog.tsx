"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X, Clock, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

interface Template {
  id: string;
  name: string;
  position: string | null;
  company: string | null;
  difficulty: string;
  duration: number;
  category: string | null;
  description: string | null;
}

interface InterviewCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  currentTemplateId?: string;
  currentCategory?: string | null;
  overallScore?: number | null;
}

const DIFF_COLOR: Record<string, string> = {
  Easy: "text-green-600 bg-green-50 dark:bg-green-900/20",
  Medium: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  Hard: "text-red-600 bg-red-50 dark:bg-red-900/20",
};

export function InterviewCompletionDialog({
  open,
  onClose,
  currentTemplateId,
  currentCategory,
  overallScore,
}: InterviewCompletionDialogProps) {
  const router = useRouter();
  const store = useAppStore();
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (!open) return;
    store
      .getMockInterviewTemplates({ size: 6 })
      .then((res: any) => {
        const all: Template[] = res?.data ?? res ?? [];
        // Show related templates, exclude current
        const filtered = all.filter((t) => t.id !== currentTemplateId).slice(0, 3);
        setTemplates(filtered);
      })
      .catch(() => {});
  }, [open, currentTemplateId]);

  if (!open) return null;

  const scoreColor =
    overallScore == null
      ? "text-foreground"
      : overallScore >= 70
        ? "text-green-500"
        : overallScore >= 50
          ? "text-amber-500"
          : "text-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">Interview Complete!</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {overallScore != null ? (
                <>Your overall score: <span className={cn("font-bold", scoreColor)}>{overallScore}%</span> — great effort!</>
              ) : (
                "Your results are being generated. Check back in the results panel."
              )}
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Recommended interviews */}
          {templates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Recommended Mock Interviews</p>
                  <p className="text-xs text-muted-foreground">Keep practising — consistency builds confidence</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { router.push(`/mock-interviews/${t.id}`); onClose(); }}
                    className="text-left rounded-xl border border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", DIFF_COLOR[t.difficulty] ?? "text-muted-foreground bg-muted")}>
                        {t.difficulty}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                      {t.name || t.position}
                    </p>
                    {t.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                      <Clock className="w-3 h-3" />
                      {t.duration} min
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-muted/10">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 relative">
              <Image src="/blue-icon-logo.png" alt="MB" fill className="object-contain" />
            </div>
            <span className="text-xs text-muted-foreground">Mastering Backend</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
              Stay in room
            </Button>
            <Button
              size="sm"
              onClick={() => { router.push("/mock-interviews"); }}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              Exit room
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
