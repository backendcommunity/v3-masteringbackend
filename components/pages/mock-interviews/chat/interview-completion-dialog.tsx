"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn, onNavigate } from "@/lib/utils";
import {
  X,
  Clock,
  Bookmark,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { MockInterviewPaymentDialog } from "../mock-interview-payment-dialog";

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

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  category?: { name?: string } | null;
  level?: string;
}

interface InterviewCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  currentTemplateId?: string;
  currentCategory?: string | null;
  overallScore?: number | null;
}

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
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [templatePage, setTemplatePage] = useState(0);
  const [coursePage, setCoursePage] = useState(0);
  const [showPayment, setShowPayment] = useState(false);

  const PAGE_SIZE = 3;

  useEffect(() => {
    if (!open) return;

    store
      .getMockInterviewTemplates({ size: 9 })
      .then((res: any) => {
        const all: Template[] = res?.interviews ?? res ?? [];
        console.log("Fetched templates for completion dialog:", all);
        const withoutCurrent = all.filter((t) => t.id !== currentTemplateId);
        // Prefer same category; fall back to all popular
        const related = currentCategory
          ? withoutCurrent.filter((t) => t.category === currentCategory)
          : [];
        setTemplates(
          (related.length >= 3 ? related : withoutCurrent).slice(0, 9),
        );
      })
      .catch(() => {});

    store
      .getCourses({} as any)
      .then((res: any) => {
        const all: CourseItem[] = Array.isArray(res) ? res : (res?.data ?? []);
        setCourses(all.slice(0, 9));
      })
      .catch(() => {});
  }, [open, currentTemplateId, currentCategory]);

  const handleExit = () => {
    router.push("/mock-interviews");
  };

  if (!open) return null;

  const templatePages = Math.ceil(templates.length / PAGE_SIZE);
  const coursePages = Math.ceil(courses.length / PAGE_SIZE);
  const visibleTemplates = templates.slice(
    templatePage * PAGE_SIZE,
    templatePage * PAGE_SIZE + PAGE_SIZE,
  );
  const visibleCourses = courses.slice(
    coursePage * PAGE_SIZE,
    coursePage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
          {/* Close — exits the room */}
          <button
            onClick={handleExit}
            className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Exit room"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3 px-6 pt-6 pb-5 border-b border-border flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h2 className="text-base font-bold text-foreground leading-tight">
                {overallScore != null
                  ? overallScore >= 70
                    ? "Great performance!"
                    : overallScore >= 50
                      ? "Good effort — keep going."
                      : "Room to grow — keep practising."
                  : "Interview Complete!"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {overallScore != null
                  ? `You scored ${overallScore}%. Here are recommended interviews and courses to keep building your tech engineering skills.`
                  : "You've completed this session. Here are recommended interviews and courses to keep building your tech engineering skills."}
              </p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {/* Recommended interviews */}
            {templates.length > 0 && (
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Recommended Mock Interviews
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Interested in learning more about
                      {currentCategory ? ` ${currentCategory}?` : "?"} Explore
                      other Mock Interviews we offer and enhance your skills!
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => setTemplatePage((p) => Math.max(0, p - 1))}
                      disabled={templatePage === 0}
                      className={cn(
                        "w-7 h-7 rounded-full border border-border flex items-center justify-center transition-colors",
                        templatePage === 0
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-muted",
                      )}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setTemplatePage((p) =>
                          Math.min(templatePages - 1, p + 1),
                        )
                      }
                      disabled={templatePage >= templatePages - 1}
                      className={cn(
                        "w-7 h-7 rounded-full border border-border flex items-center justify-center transition-colors",
                        templatePage >= templatePages - 1
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-muted",
                      )}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {visibleTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        router.push(`/mock-interviews/${t.id}`);
                        onClose();
                      }}
                      className="text-left rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/30 transition-all p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-muted-foreground font-medium truncate">
                          {t.category ?? t.difficulty}
                        </span>
                        <Bookmark className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                      </div>
                      <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                        {t.name || t.position}
                      </p>
                      {t.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                        <Clock className="w-3 h-3" />
                        {t.duration} min
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended courses */}
            {courses.length > 0 && (
              <div className="px-6 pb-5 pt-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Recommended Courses
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Don&apos;t stop learning. Here are the courses we
                      recommend you take after this Mock Interview.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => setCoursePage((p) => Math.max(0, p - 1))}
                      disabled={coursePage === 0}
                      className={cn(
                        "w-7 h-7 rounded-full border border-border flex items-center justify-center transition-colors",
                        coursePage === 0
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-muted",
                      )}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setCoursePage((p) => Math.min(coursePages - 1, p + 1))
                      }
                      disabled={coursePage >= coursePages - 1}
                      className={cn(
                        "w-7 h-7 rounded-full border border-border flex items-center justify-center transition-colors",
                        coursePage >= coursePages - 1
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-muted",
                      )}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {visibleCourses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        router.push(`/courses/${c.slug}`);
                        onClose();
                      }}
                      className="text-left rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/30 transition-all p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          <BookOpen className="w-2.5 h-2.5" />
                          Course
                        </span>
                        <Bookmark className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                      </div>
                      <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                        {c.title}
                      </p>
                      {c.level && (
                        <p className="text-[11px] text-muted-foreground">
                          {c.level}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-border flex-shrink-0">
            <Button
              className="h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
              onClick={() => setShowPayment(true)}
            >
              Unlock Full Access
            </Button>
          </div>
        </div>
      </div>

      <MockInterviewPaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onNavigate={(url) => onNavigate(url)}
      />
    </>
  );
}
