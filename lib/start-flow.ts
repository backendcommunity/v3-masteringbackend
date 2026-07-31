import { routes } from "@/lib/routes";
import { toast } from "sonner";

export type StartItemType = "course" | "project" | "path";

export interface StartItemArgs {
  type: StartItemType;
  slug: string;
  /** Item id — required to enroll a course (courseId). */
  id?: string;
  enrolled: boolean;
  completed?: boolean;
  /** user.isPremium — pro/enterprise (or trial with access). */
  isPremiumUser: boolean;
  store: any;
  onNavigate: (path: string) => void;
  /** Optional optimistic UI hook fired after a successful enroll. */
  onEnrolled?: () => void;
}

const detailRoute = (type: StartItemType, slug: string): string => {
  switch (type) {
    case "course":
      return routes.courseDetail(slug);
    case "project":
      return routes.projectDetail(slug);
    case "path":
      return routes.pathDetail(slug);
  }
};

async function routeToValue(a: StartItemArgs): Promise<void> {
  if (a.type === "path") {
    a.onNavigate(
      a.completed ? routes.pathDetail(a.slug) : routes.pathWorkspace(a.slug),
    );
    return;
  }
  if (a.type === "project") {
    a.onNavigate(
      a.completed ? routes.projectDetail(a.slug) : `/projects/${a.slug}/tasks`,
    );
    return;
  }
  // course — first value point is the first lesson; the listing card doesn't
  // carry chapters, so resolve them from the detail payload, then deep-link.
  try {
    const course = await a.store.getCourse(a.slug);
    const chapter = course?.chapters?.[0];
    const video = chapter?.videos?.[0];
    if (chapter && video) {
      a.onNavigate(routes.courseWatch(a.slug, chapter.slug, video.slug));
      return;
    }
    if (chapter) {
      a.onNavigate(routes.courseWatch(a.slug, chapter.slug));
      return;
    }
  } catch {
    // fall through to detail
  }
  a.onNavigate(routes.courseDetail(a.slug));
}

async function enroll(a: StartItemArgs): Promise<void> {
  if (a.type === "course") {
    if (a.id) await a.store.handleCourseEnrollment(a.id);
    return;
  }
  if (a.type === "project") {
    await a.store.handleProjectEnrollment(a.slug);
    return;
  }
  await a.store.enrollInRoadmap(a.slug);
}

/**
 * Unified "Start" behaviour for every card across the platform:
 *  - already enrolled  → straight to the first value point (resume).
 *  - free user         → item detail page.
 *  - pro / enterprise  → auto-enroll, then land at the first value point.
 */
export async function startItem(a: StartItemArgs): Promise<void> {
  if (a.enrolled) {
    await routeToValue(a);
    return;
  }

  if (!a.isPremiumUser) {
    a.onNavigate(detailRoute(a.type, a.slug));
    return;
  }

  // pro / enterprise, not yet enrolled → enroll then drop them into value.
  try {
    await enroll(a);
    a.onEnrolled?.();
    toast.success("Enrolled — taking you to your first lesson…");
  } catch {
    // Enrollment frequently 409s when a webhook already enrolled the user —
    // proceed to the value point regardless (mirrors the detail-page flow).
  }
  await routeToValue(a);
}
