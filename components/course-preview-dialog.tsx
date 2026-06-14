"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize";
import { ArrowRight, BookOpen, Lock, Play } from "lucide-react";
import { VimeoPlayer } from "@/components/ui/vimeo-player";
import { Chapter, Course } from "@/lib/data";

interface CoursePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onEnroll: () => void;
  course?: Course;
  // Start a free chapter (preview-enrolls + opens the workspace). Provided by
  // the detail page so the dialog reuses the same enrollment path.
  onPreviewChapter: (chapter: Chapter) => void;
}

export function CoursePreviewDialog({
  open,
  onClose,
  onEnroll,
  course,
  onPreviewChapter,
}: CoursePreviewDialogProps) {
  const chapters = course?.chapters ?? [];
  const freeChapters = chapters.filter((c) => !c.isPremium);
  const lockedChapters = chapters.filter((c) => c.isPremium).slice(0, 4);

  const startChapter = (chapter: Chapter) => {
    onClose();
    onPreviewChapter(chapter);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border border-border bg-background">
        <div className="h-1 w-full bg-primary" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-xl font-bold text-foreground leading-tight">
            {course?.title}
          </DialogTitle>
          {course?.summary && (
            <p
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.summary) }}
              className="text-sm text-muted-foreground mt-1 line-clamp-2"
            />
          )}
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Preview video (or banner fallback) */}
          {course?.preview ? (
            <div className="px-6 mt-5">
              <div className="rounded-xl overflow-hidden border border-primary/20">
                <VimeoPlayer video={{ video: course.preview as any }} />
              </div>
            </div>
          ) : course?.banner ? (
            <div className="px-6 mt-5">
              <div className="aspect-video rounded-xl overflow-hidden border border-border">
                <img
                  src={course.banner}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : null}

          {/* Free chapters */}
          {freeChapters.length > 0 && (
            <div className="px-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Free preview chapters
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {freeChapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => startChapter(chapter)}
                    className="w-full text-left rounded-xl p-4 border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                        <Play className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-primary">
                            Chapter
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                            Free
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {chapter.title}
                        </p>
                        {chapter.duration && (
                          <span className="text-xs text-muted-foreground">
                            {chapter.duration}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Locked chapters teaser */}
          {lockedChapters.length > 0 && (
            <div className="px-6 mt-4">
              <div className="space-y-2">
                {lockedChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="rounded-xl p-4 border border-border bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            Chapter
                          </span>
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Lock className="h-2.5 w-2.5" /> Enroll to unlock
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {chapter.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="px-6 py-5 mt-5 border-t border-border">
            <p className="text-xs text-center text-muted-foreground mb-3">
              Enroll to unlock all {chapters.length} chapters and the full
              curriculum
            </p>
            <Button
              className="w-full h-11 font-semibold text-sm text-white bg-primary hover:bg-[#0FA3C4]"
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
