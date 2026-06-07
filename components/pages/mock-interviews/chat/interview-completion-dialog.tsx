"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  X,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  MockInterviewTemplateCard,
  type MockInterviewTemplateCardData,
} from "../mock-interview-template-card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

type Template = MockInterviewTemplateCardData;

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
  // Track which templates/courses are bookmarked (id → true) and which are loading
  const [savedTemplates, setSavedTemplates] = useState<Record<string, boolean>>(
    {},
  );
  const [savedCourses, setSavedCourses] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  // Track which template is being started (id → true)
  const [startingId, setStartingId] = useState<string | null>(null);

  const PAGE_SIZE = 3;

  useEffect(() => {
    if (!open) return;
    analytics.track("chat_interview_completion_dialog_shown", {
      overall_score: overallScore,
      category: currentCategory,
    });

    store
      .getMockInterviewTemplates({ size: 9 })
      .then((res: any) => {
        const all: Template[] = res?.interviews ?? res ?? [];
        const withoutCurrent = all.filter((t) => t.id !== currentTemplateId);
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
    analytics.track("chat_interview_exit_to_interviews");
    router.push("/mock-interviews");
  };

  const handleStartTemplate = useCallback(
    async (templateId: string) => {
      if (startingId) return;
      setStartingId(templateId);
      try {
        const result = await store.scheduleInterviewFromTemplate(
          templateId,
          {},
        );
        if (!result?.interview?.id) {
          toast.error("Failed to start interview. Please try again.");
          return;
        }
        analytics.track("chat_interview_next_template_started", {
          template_id: templateId,
          is_same_category: currentCategory != null,
          from_score: overallScore,
        });
        onClose();
        router.push(`/mock-interviews/${result.interview.id}/chat`);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 402 || status === 403) {
          onClose();
          router.push("/subscription/plans");
        } else {
          toast.error(
            err?.response?.data?.message ?? "Failed to start interview.",
          );
        }
      } finally {
        setStartingId(null);
      }
    },
    [startingId, store, router, onClose],
  );

  const handleSaveTemplate = useCallback(
    async (e: React.MouseEvent, templateId: string) => {
      e.stopPropagation();
      if (savingId || savedTemplates[templateId]) return;
      setSavingId(templateId);
      try {
        await store.createBookmark({
          type: "MOCK_INTERVIEW",
          bookmarkType: "BOOKMARK",
          mockInterviewTemplateId: templateId,
        });
        setSavedTemplates((prev) => ({ ...prev, [templateId]: true }));
        analytics.track("chat_interview_template_bookmarked_from_completion", { template_id: templateId });
        toast.success("Interview saved to bookmarks.");
      } catch {
        toast.error("Failed to save. Please try again.");
      } finally {
        setSavingId(null);
      }
    },
    [savingId, savedTemplates, store],
  );

  const handleSaveCourse = useCallback(
    async (e: React.MouseEvent, courseId: string) => {
      e.stopPropagation();
      if (savingId || savedCourses[courseId]) return;
      setSavingId(courseId);
      try {
        await store.createBookmark({
          type: "COURSE",
          bookmarkType: "BOOKMARK",
          courseId,
        });
        setSavedCourses((prev) => ({ ...prev, [courseId]: true }));
        analytics.track("chat_interview_course_bookmarked_from_completion", { course_id: courseId });
        toast.success("Course saved to bookmarks.");
      } catch {
        toast.error("Failed to save. Please try again.");
      } finally {
        setSavingId(null);
      }
    },
    [savingId, savedCourses, store],
  );

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
                  ? `You scored ${overallScore}%. Here are recommended interviews and courses to keep building your ${currentCategory ?? "tech"} engineering skills.`
                  : `You've completed this session. Here are recommended interviews and courses to keep building your ${currentCategory ?? "tech"} engineering skills.`}
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
                      {currentCategory
                        ? ` ${currentCategory}?`
                        : " tech engineering?"}{" "}
                      Explore other Mock Interviews we offer and enhance your
                      skills!
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
                    <MockInterviewTemplateCard
                      key={t.id}
                      template={t}
                      compact
                      onSelect={() => handleStartTemplate(t.id)}
                      isSaved={savedTemplates[t.id] ?? false}
                      isSaving={savingId === t.id}
                      isStarting={startingId === t.id}
                      onToggleSave={(e) => handleSaveTemplate(e, t.id)}
                    />
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
                  {visibleCourses.map((c) => {
                    const isSaved = savedCourses[c.id] ?? false;
                    const isSaving = savingId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          analytics.track("chat_interview_course_clicked_from_completion", { course_id: c.id, slug: c.slug });
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
                          <button
                            onClick={(e) => handleSaveCourse(e, c.id)}
                            disabled={isSaved || !!savingId}
                            className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors disabled:cursor-not-allowed"
                            aria-label={isSaved ? "Saved" : "Save course"}
                          >
                            {isSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                className={cn(
                                  "w-3.5 h-3.5 transition-colors stroke-current",
                                  isSaved
                                    ? "text-primary fill-primary"
                                    : "fill-none text-muted-foreground/40",
                                )}
                                strokeWidth={2}
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            )}
                          </button>
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
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-border flex-shrink-0">
            <Button
              className="h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
              onClick={() => {
                analytics.track("chat_interview_unlock_full_access_clicked", { from_score: overallScore });
                router.push("/subscription/plans");
              }}
            >
              Unlock Full Access
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
