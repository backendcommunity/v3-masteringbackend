"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { routes } from "@/lib/routes";
import type { AssignmentItem, AssignmentItemState, MyAssignment } from "@/lib/data";

const TYPE_LABELS: Record<AssignmentItem["type"], string> = {
  PATH: "Path",
  COURSE: "Course",
  PROJECT: "Project",
  MOCK_INTERVIEW: "Mock interview",
  CHAPTER: "Chapter",
  ARTICLE: "Article",
  VIDEO: "Video",
  TASK: "Task",
  QUIZ: "Quiz",
  EXERCISE: "Exercise",
  CUSTOM: "Custom",
};

const STATE_LABELS: Record<AssignmentItemState, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  UNAVAILABLE: "Unavailable",
};

function contentHref(item: AssignmentItem): string | null {
  if (!item.refId) return null;
  switch (item.type) {
    case "PATH":
    case "COURSE":
    case "PROJECT":
      // These three link by SLUG, not `refId` (a UUID) — `routes.pathDetail`/
      // `courseDetail`/`projectDetail` all take a slug (learning-path-detail.tsx
      // resolves `pathDetail`'s param via `getRoadmapBySlug`, despite the
      // route param being named `pathId`). No `item.slug` means either the
      // catalogue row is gone (state UNAVAILABLE, rendered separately and
      // never reaching here) or an older assignment predates this field —
      // either way, a link built from `refId` would be a 404 wearing a
      // link's clothes, which is worse than plain text. No link beats that.
      return item.slug
        ? item.type === "PATH"
          ? routes.pathDetail(item.slug)
          : item.type === "COURSE"
            ? routes.courseDetail(item.slug)
            : routes.projectDetail(item.slug)
        : null;
    case "MOCK_INTERVIEW":
      // `routes.mockInterviewDetail(id)` renders `MockInterviewSessionPage`
      // for a SESSION id — wrong shape entirely for a template id. The
      // route that actually accepts a template id is the booking route:
      // mock-interviews.tsx reads `?id=` as a template id, looks it up in
      // its own template list (falling back to a direct fetch), and opens
      // the booking flow for it. `refId` here already IS a template id
      // (assignable-search.ts's MOCK_INTERVIEW branch searches
      // MockInterviewTemplate), so this never needs a slug.
      return routes.mockInterviewBooking(item.refId);
    case "VIDEO":
    case "ARTICLE":
      // courseWatch's legacy-redirect route (app/courses/[slug]/watch/
      // [chapterId]/[videoId]) resolves the target step by matching its
      // third argument against the compiled course session's step `itemId`
      // — which is the video/article's own DB id, not its slug. Passing
      // `refId` here (rather than a slug this component doesn't have) lands
      // on the exact step. No link without courseSlug/chapterSlug — the
      // catalogue row backing this item may be gone (state UNAVAILABLE,
      // rendered separately) or its course/chapter may not resolve.
      return item.courseSlug && item.chapterSlug
        ? routes.courseWatch(item.courseSlug, item.chapterSlug, item.refId)
        : null;
    case "QUIZ":
      return item.courseSlug ? routes.courseQuiz(item.courseSlug, item.refId) : null;
    case "EXERCISE":
      return item.courseSlug ? routes.courseExercise(item.courseSlug, item.refId) : null;
    case "CHAPTER":
    case "TASK":
      // Deliberately unlinked, not an oversight: compileCourse only ever
      // emits VIDEO/ARTICLE/QUIZ/EXERCISE/PROJECT/MOCK_INTERVIEW steps into
      // the course session (see build-course-session.ts on the backend) — a
      // chapter is a grouping construct and a task hangs off another step,
      // so neither has a page of its own in the course workspace to send a
      // member to.
      return null;
    default:
      return null;
  }
}

interface AssignmentCardProps {
  assignment: MyAssignment;
  onToggle: (itemId: string, done: boolean) => Promise<void>;
}

/**
 * One assignment as the person it was given to sees it.
 *
 * Only CUSTOM items get a checkbox. A course, path, project or mock interview
 * is completed by doing it — its `state` is derived from progress that
 * already exists elsewhere, and a tick box on it would be a second,
 * competing record of the same fact. An UNAVAILABLE item is a retired
 * catalogue entry, not an incomplete one: no link, no state chip, and it
 * doesn't count against the person (the totals on `assignment` already
 * exclude it — this component just has to not contradict them).
 */
export function AssignmentCard({ assignment, onToggle }: AssignmentCardProps) {
  // Optimistic per-item overrides, keyed by item id. Absent means "trust the
  // server-provided state"; present means a tick is in flight, or one that
  // needs to be reverted because the save failed.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const handleToggle = async (itemId: string, next: boolean) => {
    setOverrides((prev) => ({ ...prev, [itemId]: next }));
    try {
      await onToggle(itemId, next);
    } catch {
      // A tick that silently fails is worse than one that visibly refuses —
      // put it back so the person doesn't believe they finished something
      // they haven't.
      setOverrides((prev) => ({ ...prev, [itemId]: !next }));
    }
  };

  const items = [...assignment.items].sort((a, b) => a.position - b.position);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{assignment.name}</CardTitle>
          {assignment.isOverdue && <Badge variant="destructive">Overdue</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {assignment.targetLabel} &middot; {assignment.done} of {assignment.total}
        </p>
        <p className="text-sm text-muted-foreground">
          {assignment.dueAt
            ? `Due ${new Date(assignment.dueAt).toLocaleDateString()}`
            : "No due date"}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const checked = overrides[item.id] ?? item.state === "DONE";
            const href = contentHref(item);

            return (
              <li key={item.id} className="flex items-center gap-3 py-3">
                {item.type === "CUSTOM" ? (
                  <>
                    <Checkbox
                      aria-label={item.text ?? "Custom"}
                      checked={checked}
                      onCheckedChange={(value) =>
                        handleToggle(item.id, value === true)
                      }
                    />
                    <span className="text-sm">{item.text}</span>
                  </>
                ) : item.state === "UNAVAILABLE" ? (
                  <span className="text-sm text-muted-foreground">
                    This content is no longer available
                  </span>
                ) : (
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {href ? (
                        <a
                          href={href}
                          className="block truncate text-sm font-medium text-primary hover:underline"
                        >
                          {item.title ?? TYPE_LABELS[item.type]}
                        </a>
                      ) : (
                        <span className="block truncate text-sm font-medium">
                          {item.title ?? TYPE_LABELS[item.type]}
                        </span>
                      )}
                      {item.parentLabel && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.parentLabel}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {STATE_LABELS[item.state]}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
