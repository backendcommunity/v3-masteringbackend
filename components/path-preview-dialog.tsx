"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Brain,
  Code2,
  FolderOpen,
  ArrowRight,
  Lock,
  Sparkles,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { VimeoPlayer } from "@/components/ui/vimeo-player";

interface FreeItem {
  id: string;
  type: "quiz" | "exercise" | "project";
  title: string;
  topicId: string;
  meta?: { slug?: string; difficulty?: string; passingScore?: number };
}

interface PathPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onEnroll: () => void;
  roadmap: any;
  topics: any[];
  pathId: string;
  freePreviewCourseId: string | null;
  onNavigate?: (route: string) => void;
}

export function PathPreviewDialog({
  open,
  onClose,
  onEnroll,
  roadmap,
  topics,
  pathId,
  freePreviewCourseId,
  onNavigate,
}: PathPreviewDialogProps) {
  // Free courses across all topics
  const freeCourses: Array<any & { topicId: string }> = [];
  topics.forEach((topic) => {
    (topic.courses || []).forEach((courseItem: any) => {
      const course = courseItem.course || courseItem;
      if (!course.isPremium || course.id === freePreviewCourseId) {
        freeCourses.push({ ...course, topicId: topic.id });
      }
    });
  });

  // Locked preview items (1 per topic max for quizzes, exercises, projects)
  const freeItems: FreeItem[] = [];
  topics.forEach((topic) => {
    (topic.quizzes || []).slice(0, 1).forEach((q: any) => {
      const quiz = q.quiz || q;
      if (!quiz.isPremium)
        freeItems.push({
          id: quiz.id,
          type: "quiz",
          title: quiz.title,
          topicId: topic.id,
          meta: { passingScore: quiz.passingScore },
        });
    });
    (topic.exercises || []).slice(0, 1).forEach((e: any) => {
      const ex = e.exercise || e;
      if (!ex.isPremium)
        freeItems.push({
          id: ex.id,
          type: "exercise",
          title: ex.title,
          topicId: topic.id,
          meta: { difficulty: ex.difficulty },
        });
    });
    (topic.projects || []).slice(0, 1).forEach((p: any) => {
      const project = p.project || p;
      if (!project.isPremium)
        freeItems.push({
          id: project.id,
          type: "project",
          title: project.title,
          topicId: topic.id,
          meta: { slug: project.slug, difficulty: project.difficulty },
        });
    });
  });

  const navigate = (route: string) => {
    onClose();
    onNavigate?.(route);
  };

  const itemConfig = {
    quiz: {
      icon: Brain,
      color: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      label: "Quiz",
    },
    exercise: {
      icon: Code2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      label: "Coding Exercise",
    },
    project: {
      icon: FolderOpen,
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      label: "Project",
    },
  };

  const hasFreeContent = freeCourses.length > 0 || freeItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border border-border bg-background">
        {/* Branded top bar */}
        <div className="h-1 w-full bg-[#13AECE]" />

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-0">
          {/* <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#13AECE]/10">
              <Sparkles className="h-3.5 w-3.5 text-[#13AECE]" />
            </div>
          </div> */}
          <DialogTitle className="text-xl font-bold text-foreground leading-tight">
            {roadmap?.title}
          </DialogTitle>
          {roadmap?.summary && (
            <p
              dangerouslySetInnerHTML={{ __html: roadmap.summary }}
              className="text-sm text-muted-foreground mt-1 line-clamp-2"
            ></p>
          )}
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Vimeo Player */}
          {roadmap?.preview && (
            <div className="px-6 mt-5">
              <div className="rounded-xl overflow-hidden border border-[#13AECE]/20">
                <VimeoPlayer video={{ video: roadmap.preview }} />
              </div>
            </div>
          )}

          {/* Free Content Section */}
          {hasFreeContent && (
            <div className="px-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  What's included free
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2">
                {/* Free Courses */}
                {freeCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() =>
                      navigate(
                        routes.pathCoursePreview(
                          pathId,
                          course.topicId,
                          course.slug,
                        ),
                      )
                    }
                    className="w-full text-left rounded-xl p-4 border border-[#13AECE]/20 bg-[#13AECE]/5 hover:bg-[#13AECE]/10 hover:border-[#13AECE]/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#13AECE]/10 flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-[#13AECE]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-[#13AECE]">
                            Video Course
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                            Free
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {course.chapters && (
                            <span className="text-xs text-muted-foreground">
                              {course.chapters.length} chapters
                            </span>
                          )}
                          {course.totalDuration && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(course.totalDuration / 60)}h
                            </span>
                          )}
                          {course.level && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {course.level}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#13AECE] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}

                {/* Locked Preview Items */}
                {freeItems.map((item) => {
                  const cfg = itemConfig[item.type];
                  const IconComponent = cfg.icon;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-4 border border-border bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                        >
                          <IconComponent className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-xs font-medium ${cfg.color}`}
                            >
                              {cfg.label}
                            </span>
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Lock className="h-2.5 w-2.5" /> Enroll to unlock
                            </span>
                          </div>
                          <p className="font-semibold text-sm text-foreground truncate">
                            {item.title}
                          </p>
                          {item.meta?.difficulty && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {item.meta.difficulty}
                            </span>
                          )}
                          {item.meta?.passingScore && (
                            <span className="text-xs text-muted-foreground">
                              Passing: {item.meta.passingScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA Footer */}
          <div className="px-6 py-5 mt-5 border-t border-border">
            <p className="text-xs text-center text-muted-foreground mb-3">
              Enroll to unlock all {topics.length} topics and the full
              curriculum
            </p>
            <Button
              className="w-full h-11 font-semibold text-sm text-white bg-[#13AECE] hover:bg-[#0FA3C4]"
              onClick={onEnroll}
            >
              Get Full Access
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
