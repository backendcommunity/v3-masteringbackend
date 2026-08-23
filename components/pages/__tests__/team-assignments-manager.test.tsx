/**
 * The manager half of the Assignments tab: everyone's assignments, and a
 * grid answering "who is behind, and on what". Modeled on the store-mock
 * shape in team-assignments-member.test.tsx (Task 8), which pins the plain
 * member path. This file pins the OWNER/ADMIN path on top of it — the member
 * section must still render for a manager, since a manager is also a person
 * with assignments of their own.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { TeamAssignmentsPage } from "../team-assignments";

const mockGetMyTeams = vi.fn();
const mockGetMyAssignments = vi.fn();
const mockGetTeamAssignments = vi.fn();
const mockGetTeamAssignmentDetail = vi.fn();
const mockDeleteTeamAssignment = vi.fn();
const mockSetItemDone = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getMyAssignments: mockGetMyAssignments,
    getTeamAssignments: mockGetTeamAssignments,
    getTeamAssignmentDetail: mockGetTeamAssignmentDetail,
    createTeamAssignment: vi.fn(),
    updateTeamAssignment: vi.fn(),
    deleteTeamAssignment: mockDeleteTeamAssignment,
    setTeamAssignmentItems: vi.fn(),
    setAssignmentItemDone: mockSetItemDone,
    getTeamGroups: vi.fn(),
    getTeamMembers: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const OWNER_TEAM = { id: "t1", name: "Acme", ownerId: "o1", role: "OWNER" as const };
const MEMBER_TEAM = { id: "t1", name: "Acme", ownerId: "o1", role: "MEMBER" as const };

const MY_ASSIGNMENT = {
  id: "a1",
  name: "Backend Onboarding",
  dueAt: "2026-09-30T00:00:00.000Z",
  targetLabel: "Platform",
  done: 1,
  total: 3,
  isOverdue: false,
  items: [
    { id: "i1", type: "COURSE", refId: "c1", text: null, position: 0, state: "DONE" },
  ],
};

const TEAM_ASSIGNMENT = {
  id: "a1",
  name: "Backend Onboarding",
  dueAt: "2026-09-30T00:00:00.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
  targetType: "GROUP" as const,
  targetLabel: "Platform",
  itemCount: 3,
  audienceSize: 8,
  doneCount: 5,
  isOverdue: false,
};

const DETAIL = {
  id: "a1",
  name: "Backend Onboarding",
  dueAt: "2026-09-30T00:00:00.000Z",
  targetType: "GROUP" as const,
  items: [
    { id: "i1", type: "COURSE" as const, refId: "c1", text: null, position: 0 },
    { id: "i2", type: "TASK" as const, refId: null, text: "Read the runbook", position: 1 },
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
      states: { i1: "DONE", i2: "NOT_STARTED" },
    },
    {
      teamMemberId: "m2",
      userId: "u2",
      name: "Grace Hopper",
      email: "grace@acme.com",
      avatar: null,
      done: 0,
      total: 2,
      isOverdue: true,
      states: { i1: "NOT_STARTED", i2: "NOT_STARTED" },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([OWNER_TEAM]);
  mockGetMyAssignments.mockResolvedValue([MY_ASSIGNMENT]);
  mockGetTeamAssignments.mockResolvedValue([TEAM_ASSIGNMENT]);
  mockGetTeamAssignmentDetail.mockResolvedValue(DETAIL);
  mockDeleteTeamAssignment.mockResolvedValue(undefined);
  mockSetItemDone.mockResolvedValue(undefined);
});

describe("a manager's Assignments tab", () => {
  it("sees both their own assignments and the team's", async () => {
    render(<TeamAssignmentsPage />);

    // Their own section, same as a plain member. The name appears twice —
    // once in the member card, once in the team list — so assert the count.
    expect(await screen.findAllByText("Backend Onboarding")).toHaveLength(2);

    // The team section, listing every assignment with target/audience/done.
    expect(await screen.findByText("Team assignments")).toBeInTheDocument();
    expect(screen.getByText(/Platform.*8 people/)).toBeInTheDocument();
    expect(screen.getByText(/5 of 8 done/)).toBeInTheDocument();
  });

  it("calls getTeamAssignments for an OWNER, and not for a plain MEMBER", async () => {
    const { unmount } = render(<TeamAssignmentsPage />);
    await screen.findByText("Team assignments");
    expect(mockGetTeamAssignments).toHaveBeenCalledWith("t1");
    unmount();

    vi.clearAllMocks();
    mockGetMyTeams.mockResolvedValue([MEMBER_TEAM]);
    mockGetMyAssignments.mockResolvedValue([MY_ASSIGNMENT]);
    render(<TeamAssignmentsPage />);
    await screen.findByText("Backend Onboarding");
    expect(mockGetTeamAssignments).not.toHaveBeenCalled();
  });

  it("fetches and renders detail when an assignment is opened", async () => {
    render(<TeamAssignmentsPage />);
    const row = await screen.findByText(/Platform.*8 people/);
    fireEvent.click(row.closest("[role='button'], button, div")!);

    await waitFor(() =>
      expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a1"),
    );

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
    expect(screen.getByText(/0 of 2/)).toBeInTheDocument();
  });

  it("shows per-item state in the grid, distinguishably", async () => {
    render(<TeamAssignmentsPage />);
    const row = await screen.findByText(/Platform.*8 people/);
    fireEvent.click(row.closest("[role='button'], button, div")!);

    await screen.findByText("Ada Lovelace");

    const adaRow = screen.getByText("Ada Lovelace").closest("tr") as HTMLElement;
    expect(within(adaRow).getByText(/done/i)).toBeInTheDocument();
    expect(within(adaRow).getByText(/not started/i)).toBeInTheDocument();
  });

  it("marks overdue people in the grid by their own isOverdue, not the assignment's", async () => {
    render(<TeamAssignmentsPage />);
    const row = await screen.findByText(/Platform.*8 people/);
    fireEvent.click(row.closest("[role='button'], button, div")!);

    await screen.findByText("Grace Hopper");
    const graceRow = screen.getByText("Grace Hopper").closest("tr") as HTMLElement;
    const adaRow = screen.getByText("Ada Lovelace").closest("tr") as HTMLElement;

    expect(within(graceRow).getByText(/overdue/i)).toBeInTheDocument();
    expect(within(adaRow).queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it("confirms delete in plain terms, promising nobody loses progress or access", async () => {
    render(<TeamAssignmentsPage />);
    await screen.findByText(/Platform.*8 people/);

    fireEvent.click(screen.getByRole("button", { name: /delete backend onboarding/i }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getAllByText(/assignment/i).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/progress/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/access/i)).toBeInTheDocument();
  });

  it("keeps the detail dialog open with a retry when the fetch fails", async () => {
    mockGetTeamAssignmentDetail.mockRejectedValue(new Error("network"));
    render(<TeamAssignmentsPage />);
    const row = await screen.findByText(/Platform.*8 people/);
    fireEvent.click(row.closest("[role='button'], button, div")!);

    await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalled());

    const retry = await screen.findByRole("button", { name: /try again/i });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    mockGetTeamAssignmentDetail.mockResolvedValueOnce(DETAIL);
    fireEvent.click(retry);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("renders a DialogTitle even while the detail is loading", async () => {
    let resolveDetail!: (value: typeof DETAIL) => void;
    mockGetTeamAssignmentDetail.mockReturnValue(
      new Promise((resolve) => {
        resolveDetail = resolve;
      }),
    );
    render(<TeamAssignmentsPage />);
    const row = await screen.findByText(/Platform.*8 people/);
    fireEvent.click(row.closest("[role='button'], button, div")!);

    await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalled());

    const dialog = await screen.findByRole("dialog");
    // A shadcn DialogContent without a DialogTitle is an a11y violation, and
    // this must hold even in the loading branch, before any data has arrived.
    expect(within(dialog).getByRole("heading")).toBeInTheDocument();

    resolveDetail(DETAIL);
    await screen.findByText("Ada Lovelace");
  });
});
