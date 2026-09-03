/**
 * The manager's per-person completion grid — the surface that answers "who
 * is behind, and on what". Two defects fixed alongside the catalogue-title
 * work on the backend (Task 10b):
 *
 *  1. Column headers labelled every content item by its bare type
 *     ("Course", "Course", "Project"), which defeats the "on what" half of
 *     the question exactly the way the member card did before titles were
 *     resolved. Headers now prefer the resolved `title`, and read as
 *     "Unavailable" — not as a type — when the catalogue row backing an
 *     item is gone, using the same determination `assignment-card.tsx` uses
 *     (derived from `state`, not inferred from a null title).
 *  2. An assignment can target a group nobody is currently in — reachable,
 *     not an error, the same "0 of 0" `summarise` reports elsewhere — and
 *     the table used to render a header row over a genuinely empty body,
 *     which reads as broken. An empty audience now gets a short, explicit
 *     empty state instead.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AssignmentDetailDialog } from "../assignment-detail-dialog";

const mockGetTeamAssignmentDetail = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getTeamAssignmentDetail: mockGetTeamAssignmentDetail,
  }),
}));

const DETAIL_WITH_TITLES = {
  id: "a1",
  name: "Backend Onboarding",
  dueAt: null,
  targetType: "TEAM" as const,
  items: [
    { id: "i1", type: "COURSE" as const, refId: "c1", text: null, title: "Intro to Postgres", position: 0 },
    { id: "i2", type: "CUSTOM" as const, refId: null, text: "Read the runbook", title: null, position: 1 },
    { id: "i3", type: "COURSE" as const, refId: "deleted", text: null, title: null, position: 2 },
  ],
  people: [
    {
      teamMemberId: "m1",
      userId: "u1",
      name: "Ada Lovelace",
      email: "ada@acme.com",
      avatar: null,
      done: 1,
      total: 2,
      isOverdue: false,
      states: { i1: "DONE", i2: "NOT_STARTED", i3: "UNAVAILABLE" },
    },
  ],
};

// Two VIDEO items share the title "Introduction" — only their `parentLabel`
// breadcrumbs ("PostgreSQL · Chapter 3: Indexes" vs. "Docker · Chapter 1:
// Setup") tell them apart in the column header. j4 is UNAVAILABLE but
// carries a `parentLabel` anyway, to prove the header never renders a
// breadcrumb for a retired item even when one is present on the data.
const DETAIL_WITH_BREADCRUMBS = {
  id: "a2",
  name: "Backend Onboarding",
  dueAt: null,
  targetType: "TEAM" as const,
  items: [
    {
      id: "j1",
      type: "VIDEO" as const,
      refId: "v1",
      text: null,
      title: "Introduction",
      parentLabel: "PostgreSQL · Chapter 3: Indexes",
      position: 0,
    },
    {
      id: "j2",
      type: "VIDEO" as const,
      refId: "v2",
      text: null,
      title: "Introduction",
      parentLabel: "Docker · Chapter 1: Setup",
      position: 1,
    },
    {
      id: "j3",
      type: "CUSTOM" as const,
      refId: null,
      text: "Read the runbook",
      title: null,
      position: 2,
    },
    {
      id: "j4",
      type: "COURSE" as const,
      refId: "deleted",
      text: null,
      title: null,
      parentLabel: "Should never render",
      position: 3,
    },
  ],
  people: [
    {
      teamMemberId: "m1",
      userId: "u1",
      name: "Ada Lovelace",
      email: "ada@acme.com",
      avatar: null,
      done: 1,
      total: 3,
      isOverdue: false,
      states: { j1: "DONE", j2: "NOT_STARTED", j3: "NOT_STARTED", j4: "UNAVAILABLE" },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTeamAssignmentDetail.mockResolvedValue(DETAIL_WITH_TITLES);
});

describe("AssignmentDetailDialog", () => {
  it("labels a content column with its resolved title, not its bare type", async () => {
    render(
      <AssignmentDetailDialog teamId="t1" assignmentId="a1" onOpenChange={() => {}} />,
    );

    expect(await screen.findByText("Intro to Postgres")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Course" })).not.toBeInTheDocument();
  });

  it("labels a retired item's column Unavailable, not its type", async () => {
    render(
      <AssignmentDetailDialog teamId="t1" assignmentId="a1" onOpenChange={() => {}} />,
    );

    await screen.findByText("Intro to Postgres");
    // Column header reads Unavailable...
    expect(screen.getByRole("columnheader", { name: "Unavailable" })).toBeInTheDocument();
    // ...and so does the person's cell for that item, distinctly.
    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
  });

  it("still labels a CUSTOM column with its own text", async () => {
    render(
      <AssignmentDetailDialog teamId="t1" assignmentId="a1" onOpenChange={() => {}} />,
    );
    expect(await screen.findByText("Read the runbook")).toBeInTheDocument();
  });

  it("shows an explicit empty state when nobody is in the audience, instead of a bare header row", async () => {
    mockGetTeamAssignmentDetail.mockResolvedValue({ ...DETAIL_WITH_TITLES, people: [] });
    render(
      <AssignmentDetailDialog teamId="t1" assignmentId="a1" onOpenChange={() => {}} />,
    );

    expect(await screen.findByText(/nobody is in this assignment.s audience yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the full grid normally once the audience is non-empty", async () => {
    render(
      <AssignmentDetailDialog teamId="t1" assignmentId="a1" onOpenChange={() => {}} />,
    );
    await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a1"));
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("distinguishes two same-titled columns by their breadcrumb", async () => {
    mockGetTeamAssignmentDetail.mockResolvedValue(DETAIL_WITH_BREADCRUMBS);
    render(
      <AssignmentDetailDialog teamId="t1" assignmentId="a2" onOpenChange={() => {}} />,
    );

    expect(await screen.findAllByText("Introduction")).toHaveLength(2);
    expect(screen.getByText("PostgreSQL · Chapter 3: Indexes")).toBeInTheDocument();
    expect(screen.getByText("Docker · Chapter 1: Setup")).toBeInTheDocument();
  });

  it("shows a CUSTOM column's text with no breadcrumb — it has no parent", async () => {
    mockGetTeamAssignmentDetail.mockResolvedValue(DETAIL_WITH_BREADCRUMBS);
    render(
      <AssignmentDetailDialog teamId="t1" assignmentId="a2" onOpenChange={() => {}} />,
    );

    const header = await screen.findByRole("columnheader", { name: "Read the runbook" });
    expect(header).toBeInTheDocument();
  });

  it("shows no breadcrumb on an Unavailable column, even though the item carries a parentLabel", async () => {
    mockGetTeamAssignmentDetail.mockResolvedValue(DETAIL_WITH_BREADCRUMBS);
    render(
      <AssignmentDetailDialog teamId="t1" assignmentId="a2" onOpenChange={() => {}} />,
    );

    expect(await screen.findByRole("columnheader", { name: "Unavailable" })).toBeInTheDocument();
    expect(screen.queryByText("Should never render")).not.toBeInTheDocument();
  });
});
