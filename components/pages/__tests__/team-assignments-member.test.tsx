/**
 * A plain member is half this feature's audience — they are the people being
 * assigned things. Sub-project 3a shipped a member view that showed nothing
 * because everything sat behind canManage while the API served the data
 * happily, so these tests pin the MEMBER path specifically.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TeamAssignmentsPage } from "../team-assignments";

const mockGetMyTeams = vi.fn();
const mockGetMyAssignments = vi.fn();
const mockGetTeamAssignments = vi.fn();
const mockSetItemDone = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getMyAssignments: mockGetMyAssignments,
    getTeamAssignments: mockGetTeamAssignments,
    getTeamAssignmentDetail: vi.fn(),
    createTeamAssignment: vi.fn(),
    updateTeamAssignment: vi.fn(),
    deleteTeamAssignment: vi.fn(),
    setTeamAssignmentItems: vi.fn(),
    setAssignmentItemDone: mockSetItemDone,
    getTeamGroups: vi.fn(),
    getTeamMembers: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const MEMBER_TEAM = { id: "t1", name: "Acme", ownerId: "o1", role: "MEMBER" as const };

const ASSIGNMENT = {
  id: "a1",
  name: "Backend Onboarding",
  dueAt: "2026-09-30T00:00:00.000Z",
  targetLabel: "Platform",
  done: 1,
  total: 3,
  isOverdue: false,
  items: [
    { id: "i1", type: "COURSE", refId: "c1", text: null, position: 0, state: "DONE" },
    { id: "i2", type: "CUSTOM", refId: null, text: "Read the runbook", position: 1, state: "NOT_STARTED" },
    { id: "i3", type: "PROJECT", refId: "p1", text: null, position: 2, state: "IN_PROGRESS" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([MEMBER_TEAM]);
  mockGetMyAssignments.mockResolvedValue([ASSIGNMENT]);
  mockGetTeamAssignments.mockRejectedValue(
    Object.assign(new Error("Forbidden"), { status: 403 }),
  );
  mockSetItemDone.mockResolvedValue(undefined);
});

describe("a member's Assignments tab", () => {
  it("shows what they were given", async () => {
    render(<TeamAssignmentsPage />);
    await screen.findByText("Backend Onboarding");
    expect(screen.getByText(/1 of 3/)).toBeInTheDocument();
    expect(screen.getByText("Read the runbook")).toBeInTheDocument();
  });

  it("never calls the manager endpoint for a plain member", async () => {
    render(<TeamAssignmentsPage />);
    await screen.findByText("Backend Onboarding");
    // Not merely "handles the 403" — it must not ask in the first place.
    expect(mockGetTeamAssignments).not.toHaveBeenCalled();
  });

  it("lets them tick a task", async () => {
    render(<TeamAssignmentsPage />);
    await screen.findByText("Read the runbook");

    fireEvent.click(screen.getByRole("checkbox", { name: /read the runbook/i }));

    await waitFor(() =>
      expect(mockSetItemDone).toHaveBeenCalledWith("t1", "a1", "i2", true),
    );
  });

  it("gives a content item no tick box, because those are derived", async () => {
    render(<TeamAssignmentsPage />);
    await screen.findByText("Backend Onboarding");
    // Exactly one checkbox: the CUSTOM item. The course and project are completed by
    // doing them, and a tick would be a second representation.
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("puts the tick back if the save fails, rather than lying about it", async () => {
    // A pre-rejected promise, not `mockRejectedValueOnce` awaited eagerly —
    // the point of this test is the ORDER: optimistic-tick-then-revert, not
    // just "ends up unchecked". The item starts NOT_STARTED, so asserting
    // only the end state can't tell "the tick never happened" apart from
    // "it happened and was correctly reverted" — this failed silently
    // before, passing at t=0 with no assertion in between.
    mockSetItemDone.mockRejectedValue(new Error("network"));
    render(<TeamAssignmentsPage />);
    await screen.findByText("Read the runbook");

    const box = screen.getByRole("checkbox", { name: /read the runbook/i });
    expect(box).not.toBeChecked();
    fireEvent.click(box);

    // The optimistic tick happens synchronously in AssignmentCard's
    // `handleToggle`, before `onToggle` (and the rejection inside it) is
    // even awaited — so this must be true immediately, before the revert
    // below has any chance to run.
    expect(box).toBeChecked();

    await waitFor(() => expect(box).not.toBeChecked());
  });

  it("marks an overdue assignment", async () => {
    mockGetMyAssignments.mockResolvedValue([{ ...ASSIGNMENT, isOverdue: true }]);
    render(<TeamAssignmentsPage />);
    expect(await screen.findByText(/overdue/i)).toBeInTheDocument();
  });

  it("says so plainly when nothing has been assigned", async () => {
    mockGetMyAssignments.mockResolvedValue([]);
    render(<TeamAssignmentsPage />);
    expect(await screen.findByText(/nothing assigned/i)).toBeInTheDocument();
  });

  it("renders each content item's breadcrumb beneath its title, and nothing extra when it's absent", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "i1",
            type: "COURSE",
            refId: "c1",
            text: null,
            title: "Introduction",
            parentLabel: "PostgreSQL · Chapter 3: Indexes",
            position: 0,
            state: "DONE",
          },
          {
            id: "i4",
            type: "PROJECT",
            refId: "p2",
            text: null,
            title: "Build a CLI",
            position: 1,
            state: "NOT_STARTED",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);

    await screen.findByText("Introduction");
    expect(screen.getByText("PostgreSQL · Chapter 3: Indexes")).toBeInTheDocument();

    // "Build a CLI" has no parentLabel — its title renders with no breadcrumb
    // beneath it. Asserted structurally, not just by the title's presence: the
    // title sits alone in its wrapper div when there's no breadcrumb sibling,
    // and gains a second child the moment one renders (see the "Introduction"
    // item above, whose wrapper has two). This is what actually distinguishes
    // "the breadcrumb-less item rendered nothing extra" from "the breadcrumb-
    // less item's title happens to appear somewhere on the page" — the latter
    // would still pass even if a stray breadcrumb node were rendered next to
    // it, since findByText only proves the title text exists, not that it's
    // alone.
    const cliTitle = await screen.findByText("Build a CLI");
    expect(cliTitle.parentElement?.children).toHaveLength(1);
  });

  it("shows a CUSTOM item's text with no breadcrumb — it has no parent", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "i2",
            type: "CUSTOM",
            refId: null,
            text: "Read the runbook",
            parentLabel: "Should never render",
            position: 0,
            state: "NOT_STARTED",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);

    await screen.findByText("Read the runbook");
    expect(screen.queryByText("Should never render")).not.toBeInTheDocument();
  });

  it("shows no breadcrumb on an unavailable item, even though it carries a parentLabel", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "i9",
            type: "COURSE",
            refId: "gone",
            text: null,
            title: null,
            parentLabel: "Should never render",
            position: 0,
            state: "UNAVAILABLE",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);

    await screen.findByText(/no longer available/i);
    expect(screen.queryByText("Should never render")).not.toBeInTheDocument();
  });

  it("treats an empty parentLabel the same as an absent one — no breadcrumb renders", async () => {
    // The brief says "nothing extra when it is absent or empty". The card's
    // guard is a falsy check (`item.parentLabel && …`), so "" already takes
    // the same branch as undefined — but nothing exercised that value before
    // this test. A guard rewritten as `item.parentLabel !== undefined` would
    // keep every other case working and only break this one, silently.
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "i5",
            type: "COURSE",
            refId: "c5",
            text: null,
            title: "Deploying to Production",
            parentLabel: "",
            position: 0,
            state: "NOT_STARTED",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);

    const title = await screen.findByText("Deploying to Production");
    // Same structural check as the "absent" case above: an empty parentLabel
    // must not add a sibling breadcrumb node, even an empty one.
    expect(title.parentElement?.children).toHaveLength(1);
  });

  /**
   * IMPORTANT from the final review: six of eleven assignable types
   * (CHAPTER, ARTICLE, VIDEO, TASK, QUIZ, EXERCISE) fell through
   * contentHref's switch to `null` — the six types this feature exists to
   * add were the six a member couldn't open. No test asserted anything about
   * `href` before, so the gap shipped silently. This block pins the real
   * destination for each of the six, and the two (CHAPTER, TASK) that are
   * deliberately left unlinked because neither is a navigable step in the
   * course workspace.
   */
  it("links a video through courseWatch, using courseSlug/chapterSlug and its own refId as the step needle", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "iv", type: "VIDEO", refId: "v1", text: null, position: 0, state: "NOT_STARTED",
            title: "EXPLAIN ANALYZE", courseSlug: "postgresql", chapterSlug: "indexes",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);
    const link = await screen.findByRole("link", { name: "EXPLAIN ANALYZE" });
    expect(link).toHaveAttribute("href", "/courses/postgresql/watch/indexes/v1");
  });

  it("links an article the same way as a video", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "ia", type: "ARTICLE", refId: "a1", text: null, position: 0, state: "NOT_STARTED",
            title: "Query planning", courseSlug: "postgresql", chapterSlug: "indexes",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);
    const link = await screen.findByRole("link", { name: "Query planning" });
    expect(link).toHaveAttribute("href", "/courses/postgresql/watch/indexes/a1");
  });

  it("links a quiz to its standalone course-quiz page, off courseSlug alone", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "iq", type: "QUIZ", refId: "q1", text: null, position: 0, state: "NOT_STARTED",
            title: "Indexing quiz", courseSlug: "postgresql",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);
    const link = await screen.findByRole("link", { name: "Indexing quiz" });
    expect(link).toHaveAttribute("href", "/courses/postgresql/quizzes/q1");
  });

  it("links an exercise to its standalone course-exercise page, off courseSlug alone", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "ie", type: "EXERCISE", refId: "e1", text: null, position: 0, state: "NOT_STARTED",
            title: "Write the query", courseSlug: "postgresql",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);
    const link = await screen.findByRole("link", { name: "Write the query" });
    expect(link).toHaveAttribute("href", "/courses/postgresql/exercises/e1");
  });

  it("leaves a chapter unlinked on purpose — it is not a step in the course workspace", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "ic", type: "CHAPTER", refId: "ch1", text: null, position: 0, state: "NOT_STARTED",
            title: "Indexes", courseSlug: "postgresql", chapterSlug: "indexes",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);
    await screen.findByText("Indexes");
    expect(screen.queryByRole("link", { name: "Indexes" })).not.toBeInTheDocument();
  });

  it("leaves a task unlinked on purpose — it hangs off another step, it is not one", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          {
            id: "it", type: "TASK", refId: "t1", text: null, position: 0, state: "NOT_STARTED",
            title: "Add an index",
          },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);
    await screen.findByText("Add an index");
    expect(screen.queryByRole("link", { name: "Add an index" })).not.toBeInTheDocument();
  });

  it("leaves a video unlinked when courseSlug/chapterSlug didn't resolve, rather than building a broken href", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        items: [
          { id: "iv2", type: "VIDEO", refId: "v2", text: null, position: 0, state: "NOT_STARTED", title: "Orphan video" },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);
    await screen.findByText("Orphan video");
    expect(screen.queryByRole("link", { name: "Orphan video" })).not.toBeInTheDocument();
  });

  it("shows an unavailable item as unavailable rather than as incomplete", async () => {
    mockGetMyAssignments.mockResolvedValue([
      {
        ...ASSIGNMENT,
        done: 0,
        total: 1,
        items: [
          { id: "i9", type: "COURSE", refId: "gone", text: null, position: 0, state: "UNAVAILABLE" },
          { id: "i2", type: "CUSTOM", refId: null, text: "Read the runbook", position: 1, state: "NOT_STARTED" },
        ],
      },
    ]);
    render(<TeamAssignmentsPage />);
    expect(await screen.findByText(/no longer available/i)).toBeInTheDocument();
    // And it is not counted against them — total is 1, the task.
    expect(screen.getByText(/0 of 1/)).toBeInTheDocument();
  });
});
