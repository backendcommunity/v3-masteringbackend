/**
 * `contentHref` (assignment-card.tsx) is what turns an assignment item into
 * a link a member can click. Four of its ten branches were wrong until now:
 * COURSE, PROJECT and PATH linked by `refId` (a UUID) when the routes they
 * point at — `routes.courseDetail`/`projectDetail`/`pathDetail` — all
 * resolve a SLUG, and MOCK_INTERVIEW linked through `mockInterviewDetail`,
 * which renders a SESSION page, not a template-booking flow. There was no
 * test asserting anything about `href` before this file, which is exactly
 * how four broken links shipped and stayed shipped.
 *
 * Every case below renders the real `AssignmentCard` and asserts on the
 * actual `<a href>` (or its absence) rather than reaching into the
 * unexported `contentHref` function, so a regression has to survive contact
 * with the DOM to pass.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssignmentCard } from "../assignment-card";
import type { MyAssignment } from "@/lib/data";

function assignmentWith(item: Partial<MyAssignment["items"][number]> & { id: string; type: MyAssignment["items"][number]["type"] }): MyAssignment {
  return {
    id: "a1",
    name: "Backend Onboarding",
    dueAt: null,
    targetLabel: "Everyone",
    done: 0,
    total: 1,
    isOverdue: false,
    items: [
      {
        refId: null,
        text: null,
        title: "Some content",
        parentLabel: undefined,
        courseSlug: null,
        chapterSlug: null,
        slug: null,
        position: 0,
        state: "NOT_STARTED",
        ...item,
      } as MyAssignment["items"][number],
    ],
  };
}

async function noop() {}

describe("AssignmentCard content links", () => {
  it("COURSE links by slug, never by refId", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "COURSE", refId: "course-uuid", slug: "intro-to-postgres" })}
        onToggle={noop}
      />,
    );
    const link = screen.getByRole("link", { name: "Some content" });
    expect(link).toHaveAttribute("href", "/courses/intro-to-postgres");
    expect(link.getAttribute("href")).not.toContain("course-uuid");
  });

  it("COURSE with no slug renders unlinked text, not a link to an id", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "COURSE", refId: "course-uuid", slug: null })}
        onToggle={noop}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Some content")).toBeInTheDocument();
  });

  it("PROJECT links by slug, never by refId", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "PROJECT", refId: "project-uuid", slug: "url-shortener" })}
        onToggle={noop}
      />,
    );
    const link = screen.getByRole("link", { name: "Some content" });
    expect(link).toHaveAttribute("href", "/projects/url-shortener");
    expect(link.getAttribute("href")).not.toContain("project-uuid");
  });

  it("PROJECT with no slug renders unlinked", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "PROJECT", refId: "project-uuid", slug: null })}
        onToggle={noop}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("PATH links by slug, never by refId", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "PATH", refId: "path-uuid", slug: "backend-path" })}
        onToggle={noop}
      />,
    );
    const link = screen.getByRole("link", { name: "Some content" });
    expect(link).toHaveAttribute("href", "/paths/backend-path");
    expect(link.getAttribute("href")).not.toContain("path-uuid");
  });

  it("PATH with no slug renders unlinked", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "PATH", refId: "path-uuid", slug: null })}
        onToggle={noop}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("MOCK_INTERVIEW links through the booking route (template id), not mockInterviewDetail (session id)", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "MOCK_INTERVIEW", refId: "template-1" })}
        onToggle={noop}
      />,
    );
    const link = screen.getByRole("link", { name: "Some content" });
    expect(link).toHaveAttribute("href", "/mock-interviews/?id=template-1");
  });

  it("QUIZ is unchanged: courseSlug + refId, via courseQuiz", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "QUIZ", refId: "quiz-1", courseSlug: "postgres" })}
        onToggle={noop}
      />,
    );
    const link = screen.getByRole("link", { name: "Some content" });
    expect(link).toHaveAttribute("href", "/courses/postgres/quizzes/quiz-1");
  });

  it("EXERCISE is unchanged: courseSlug + refId, via courseExercise", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "EXERCISE", refId: "ex-1", courseSlug: "postgres" })}
        onToggle={noop}
      />,
    );
    const link = screen.getByRole("link", { name: "Some content" });
    expect(link).toHaveAttribute("href", "/courses/postgres/exercises/ex-1");
  });

  it("VIDEO is unchanged: courseSlug + chapterSlug + refId, via courseWatch", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({
          id: "i1", type: "VIDEO", refId: "video-1", courseSlug: "postgres", chapterSlug: "indexing",
        })}
        onToggle={noop}
      />,
    );
    const link = screen.getByRole("link", { name: "Some content" });
    expect(link).toHaveAttribute("href", "/courses/postgres/watch/indexing/video-1");
  });

  it("ARTICLE is unchanged: courseSlug + chapterSlug + refId, via courseWatch", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({
          id: "i1", type: "ARTICLE", refId: "article-1", courseSlug: "postgres", chapterSlug: "indexing",
        })}
        onToggle={noop}
      />,
    );
    const link = screen.getByRole("link", { name: "Some content" });
    expect(link).toHaveAttribute("href", "/courses/postgres/watch/indexing/article-1");
  });

  it("CHAPTER stays deliberately unlinked", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "CHAPTER", refId: "ch-1" })}
        onToggle={noop}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("TASK stays deliberately unlinked", () => {
    render(
      <AssignmentCard
        assignment={assignmentWith({ id: "i1", type: "TASK", refId: "task-1" })}
        onToggle={noop}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
