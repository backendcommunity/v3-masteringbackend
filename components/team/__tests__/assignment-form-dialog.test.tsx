/**
 * The create/edit dialog for a team assignment — the heaviest UI in the
 * sub-project. Modeled on the store-mock shape in
 * components/pages/__tests__/team-assignments-manager.test.tsx (Task 9).
 *
 * Test 5 below is the load-bearing one: the backend's set-replace matches
 * CUSTOM items by the `id` the client sends back (content items match by
 * (type, refId) instead) to decide which learner completions survive a
 * save. A form that drops ids on the way through — even just by rebuilding
 * item objects during a reorder — turns a harmless reorder into
 * delete-and-recreate, and AssignmentTaskCompletion cascades away with the
 * deleted rows. That test reorders the loaded items before saving
 * specifically so a reorder that rebuilds objects without `id` would fail
 * it, not just a save that never touches the items at all.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssignmentFormDialog } from "../assignment-form-dialog";
import type { TeamAssignment } from "@/lib/data";

const mockGetTeamGroups = vi.fn();
const mockGetTeamMembers = vi.fn();
const mockGetTeamAssignmentDetail = vi.fn();
const mockCreateTeamAssignment = vi.fn();
const mockUpdateTeamAssignment = vi.fn();
const mockSetTeamAssignmentItems = vi.fn();
const mockGetRoadmaps = vi.fn();
const mockGetCourses = vi.fn();
const mockGetProjects = vi.fn();
const mockGetMockInterviewTemplates = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getTeamGroups: mockGetTeamGroups,
    getTeamMembers: mockGetTeamMembers,
    getTeamAssignmentDetail: mockGetTeamAssignmentDetail,
    createTeamAssignment: mockCreateTeamAssignment,
    updateTeamAssignment: mockUpdateTeamAssignment,
    setTeamAssignmentItems: mockSetTeamAssignmentItems,
    getRoadmaps: mockGetRoadmaps,
    getCourses: mockGetCourses,
    getProjects: mockGetProjects,
    getMockInterviewTemplates: mockGetMockInterviewTemplates,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Radix's Select relies on pointer-capture/scroll behaviour jsdom doesn't
// implement. Same workaround as team-leaderboard-group-filter.test.tsx:
// swap it for a native <select> so fireEvent.change can drive it directly.
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      aria-label="mock-select"
      value={value ?? ""}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" disabled />
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const GROUPS = [{ id: "g1", name: "Platform", memberCount: 3, createdAt: "2026-01-01" }];
const ROSTER = {
  members: [
    {
      id: "m1",
      role: "MEMBER" as const,
      status: "ACTIVE" as const,
      joinedAt: "2026-01-01",
      user: { id: "u1", name: "Ada Lovelace", email: "ada@acme.com" },
    },
  ],
};

const EXISTING_ASSIGNMENT: TeamAssignment = {
  id: "a1",
  name: "Backend Onboarding",
  dueAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  targetType: "TEAM",
  targetGroupId: null,
  targetTeamMemberId: null,
  targetLabel: "Everyone",
  itemCount: 2,
  audienceSize: 5,
  doneCount: 1,
  isOverdue: false,
};

const GROUP_TARGETED_ASSIGNMENT: TeamAssignment = {
  ...EXISTING_ASSIGNMENT,
  targetType: "GROUP",
  targetGroupId: "g1",
  targetLabel: "Platform",
};

const EXISTING_DETAIL = {
  id: "a1",
  name: "Backend Onboarding",
  dueAt: null,
  targetType: "TEAM" as const,
  items: [
    { id: "i1", type: "COURSE" as const, refId: "c1", text: null, title: "Intro to Postgres", position: 0 },
    { id: "i2", type: "CUSTOM" as const, refId: null, text: "Read the runbook", title: null, position: 1 },
  ],
  people: [],
};

function fullDetailWith25Tasks() {
  return {
    ...EXISTING_DETAIL,
    items: Array.from({ length: 25 }, (_, i) => ({
      id: `i${i}`,
      type: "CUSTOM" as const,
      refId: null,
      text: `Task ${i}`,
      position: i,
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTeamGroups.mockResolvedValue(GROUPS);
  mockGetTeamMembers.mockResolvedValue(ROSTER);
  mockGetTeamAssignmentDetail.mockResolvedValue(EXISTING_DETAIL);
  mockCreateTeamAssignment.mockResolvedValue({ id: "a-new", name: "Backend Onboarding" });
  mockUpdateTeamAssignment.mockResolvedValue({ id: "a1", name: "Backend Onboarding" });
  mockSetTeamAssignmentItems.mockResolvedValue({ id: "a1", itemCount: 0 });
});

describe("AssignmentFormDialog", () => {
  it("offers all three target modes, populated from getTeamGroups and getTeamMembers", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={null}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );

    expect(await screen.findByLabelText(/everyone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/a group/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/a person/i)).toBeInTheDocument();
    expect(mockGetTeamGroups).toHaveBeenCalledWith("t1");
    expect(mockGetTeamMembers).toHaveBeenCalledWith("t1");

    fireEvent.click(screen.getByLabelText(/a group/i));
    expect(await screen.findByText("Platform")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/a person/i));
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("requires picking a specific group before Save enables, for a GROUP target", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={null}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );
    await screen.findByLabelText(/everyone/i);

    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "Backend Onboarding" },
    });
    fireEvent.click(screen.getByLabelText(/a group/i));

    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();

    const groupSelect = await screen.findByLabelText("mock-select");
    fireEvent.change(groupSelect, { target: { value: "g1" } });

    expect(screen.getByRole("button", { name: /^save$/i })).not.toBeDisabled();
  });

  it("disables Save for a blank name", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={null}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );
    await screen.findByLabelText(/everyone/i);
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "Backend Onboarding" },
    });
    expect(screen.getByRole("button", { name: /^save$/i })).not.toBeDisabled();
  });

  it("creating sends the assignment first, then the items with its returned id", async () => {
    const order: string[] = [];
    mockCreateTeamAssignment.mockImplementation(async () => {
      order.push("create");
      return { id: "a-new", name: "Backend Onboarding" };
    });
    mockSetTeamAssignmentItems.mockImplementation(async (_teamId: string, assignmentId: string) => {
      order.push(`items:${assignmentId}`);
      return { id: assignmentId, itemCount: 1 };
    });

    const onSaved = vi.fn();
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={null}
        open
        onOpenChange={() => {}}
        onSaved={onSaved}
      />,
    );
    await screen.findByLabelText(/everyone/i);

    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "Backend Onboarding" },
    });
    fireEvent.change(screen.getByPlaceholderText(/describe the task/i), {
      target: { value: "Read the runbook" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(order).toEqual(["create", "items:a-new"]);
    expect(mockSetTeamAssignmentItems).toHaveBeenCalledWith(
      "t1",
      "a-new",
      expect.arrayContaining([
        expect.objectContaining({ type: "CUSTOM", text: "Read the runbook" }),
      ]),
    );
  });

  it("editing sends surviving items back with their id intact, even after reordering", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={EXISTING_ASSIGNMENT}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );

    await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a1"));
    await screen.findByText(/read the runbook/i);

    // Reorder: move the CUSTOM item (loaded second) up ahead of the COURSE
    // item. A reorder that rebuilds the item objects without `id` would
    // still pass a save-only test — it takes this move to expose it.
    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    fireEvent.click(moveUpButtons[1]);

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockSetTeamAssignmentItems).toHaveBeenCalled());
    const [, , submittedItems] = mockSetTeamAssignmentItems.mock.calls[0];
    const task = submittedItems.find((i: any) => i.type === "CUSTOM");
    expect(task.id).toBe("i2");
  });

  it("cannot add a free-text task with blank text", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={null}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );
    await screen.findByLabelText(/everyone/i);

    const addButton = screen.getByRole("button", { name: /^add$/i });
    expect(addButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/describe the task/i), {
      target: { value: "   " },
    });
    expect(addButton).toBeDisabled();

    fireEvent.click(addButton);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("refuses a 26th item in the UI rather than leaving it to the server's 422", async () => {
    mockGetTeamAssignmentDetail.mockResolvedValue(fullDetailWith25Tasks());
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={EXISTING_ASSIGNMENT}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );

    await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalled());
    await screen.findByText("Task 24");

    const addButton = screen.getByRole("button", { name: /^add$/i });
    expect(addButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/describe the task/i), {
      target: { value: "One too many" },
    });
    expect(addButton).toBeDisabled();
    fireEvent.click(addButton);

    expect(screen.queryByText("One too many")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(25);
  });

  it("does not list `store` in the fetch effect's deps — an unrelated re-render must not refetch", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={null}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );
    await screen.findByLabelText(/everyone/i);
    expect(mockGetTeamGroups).toHaveBeenCalledTimes(1);

    // useAppStore() returns a fresh object on every call in this mock,
    // mirroring the real store's no-selector identity churn (e.g. the
    // nav-bar's ten-second poll firing a set() elsewhere in the app).
    // Typing forces re-renders without touching teamId/open — if the fetch
    // effect depended on `store`, each render below would refetch.
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "B" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Ba" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Backend" } });

    expect(mockGetTeamGroups).toHaveBeenCalledTimes(1);
  });

  it("prefills the target picker from targetGroupId when editing a GROUP-targeted assignment", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={GROUP_TARGETED_ASSIGNMENT}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );

    await waitFor(() => expect(mockGetTeamGroups).toHaveBeenCalled());
    const groupSelect = (await screen.findByLabelText("mock-select")) as HTMLSelectElement;
    expect(groupSelect.value).toBe("g1");

    // The manager never touched the picker, so Save must still omit the
    // target fields from the update payload — the prefill is only display.
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockUpdateTeamAssignment).toHaveBeenCalled());
    const [, , input] = mockUpdateTeamAssignment.mock.calls[0];
    expect(input).not.toHaveProperty("targetType");
    expect(input).not.toHaveProperty("targetGroupId");
  });

  it("shows the resolved title for an already-saved item, not its type and refId", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={EXISTING_ASSIGNMENT}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );

    await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a1"));
    expect(await screen.findByText("Intro to Postgres")).toBeInTheDocument();
    expect(screen.queryByText(/Course · c1/)).not.toBeInTheDocument();
  });

  it("never sends `title` back to setTeamAssignmentItems — it is display-only", async () => {
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={EXISTING_ASSIGNMENT}
        open
        onOpenChange={() => {}}
        onSaved={() => {}}
      />,
    );

    await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a1"));
    await screen.findByText("Intro to Postgres");

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockSetTeamAssignmentItems).toHaveBeenCalled());
    const [, , submittedItems] = mockSetTeamAssignmentItems.mock.calls[0];
    for (const item of submittedItems) {
      expect(item).not.toHaveProperty("title");
    }
  });

  /**
   * The critical finding from the final review: a save that only renamed
   * the assignment could wipe every learner's ticks, because Save was never
   * gated on the item list having actually, successfully loaded for THIS
   * assignment. Three routes reproduce it; all three must now be blocked
   * client-side, before the empty/stale/foreign list ever reaches
   * setTeamAssignmentItems.
   */
  describe("Save cannot fire on a list that isn't confirmed to be THIS assignment's (critical fix)", () => {
    it("route A: the detail fetch rejects — Save stays disabled even after a harmless field edit", async () => {
      mockGetTeamAssignmentDetail.mockRejectedValue(new Error("blip"));
      render(
        <AssignmentFormDialog
          teamId="t1"
          assignment={EXISTING_ASSIGNMENT}
          open
          onOpenChange={() => {}}
          onSaved={() => {}}
        />,
      );

      await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a1"));
      // The load has settled (failed) — Save must stay disabled, not just
      // disabled while the spinner shows.
      await waitFor(() => expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled());

      // The manager fixes a typo in the name — a change that has nothing to
      // do with items — and Save must still refuse to fire.
      fireEvent.change(screen.getByLabelText(/^name$/i), {
        target: { value: "Backend Onboarding (fixed)" },
      });
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();

      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
      expect(mockSetTeamAssignmentItems).not.toHaveBeenCalled();
      expect(mockUpdateTeamAssignment).not.toHaveBeenCalled();
    });

    it("route B: Save is disabled while the detail fetch is still in flight, not just enabled behind the spinner", async () => {
      let resolveDetail: (v: typeof EXISTING_DETAIL) => void = () => {};
      mockGetTeamAssignmentDetail.mockImplementation(
        () => new Promise((resolve) => { resolveDetail = resolve; }),
      );

      render(
        <AssignmentFormDialog
          teamId="t1"
          assignment={EXISTING_ASSIGNMENT}
          open
          onOpenChange={() => {}}
          onSaved={() => {}}
        />,
      );

      await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a1"));
      // Still in flight — Save must be disabled behind the spinner, not
      // clickable.
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
      expect(mockSetTeamAssignmentItems).not.toHaveBeenCalled();

      resolveDetail(EXISTING_DETAIL);
      await waitFor(() => expect(screen.getByRole("button", { name: /^save$/i })).not.toBeDisabled());
    });

    it("route C: closing assignment A and opening B before B's slower fetch resolves never lets B save A's items", async () => {
      const ASSIGNMENT_B: TeamAssignment = { ...EXISTING_ASSIGNMENT, id: "a2", name: "Data Onboarding" };
      mockGetTeamAssignmentDetail.mockImplementation((_teamId: string, assignmentId: string) => {
        if (assignmentId === "a1") return Promise.resolve(EXISTING_DETAIL);
        // B's fetch never resolves within this test — the exact "still
        // slow" window the bug lived in.
        return new Promise(() => {});
      });

      const { rerender } = render(
        <AssignmentFormDialog
          teamId="t1"
          assignment={EXISTING_ASSIGNMENT}
          open
          onOpenChange={() => {}}
          onSaved={() => {}}
        />,
      );
      await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a1"));
      await screen.findByText(/read the runbook/i); // A's items are loaded and rendered

      // Close on A...
      rerender(
        <AssignmentFormDialog
          teamId="t1"
          assignment={EXISTING_ASSIGNMENT}
          open={false}
          onOpenChange={() => {}}
          onSaved={() => {}}
        />,
      );
      // ...then open on B, the same dialog instance the manager page reuses.
      rerender(
        <AssignmentFormDialog
          teamId="t1"
          assignment={ASSIGNMENT_B}
          open
          onOpenChange={() => {}}
          onSaved={() => {}}
        />,
      );
      await waitFor(() => expect(mockGetTeamAssignmentDetail).toHaveBeenCalledWith("t1", "a2"));

      // A's items must not still be sitting in the form once B is open.
      expect(screen.queryByText(/read the runbook/i)).not.toBeInTheDocument();
      // And Save must refuse to fire — B's own fetch is still pending.
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
      expect(mockSetTeamAssignmentItems).not.toHaveBeenCalled();
      expect(mockUpdateTeamAssignment).not.toHaveBeenCalled();
    });
  });

  /**
   * IMPORTANT 4 from the final review: a failed item-save after a
   * successful create used to leave the created assignment as an orphan
   * with no items, and silently create a SECOND assignment on retry,
   * because `assignment` (the prop) stays null across a retry and the
   * dialog had no memory of the id the first create already returned.
   */
  it("retrying after a failed item-save updates the already-created assignment instead of creating a second one", async () => {
    mockCreateTeamAssignment.mockResolvedValue({ id: "a-orphan", name: "Backend Onboarding" });
    mockUpdateTeamAssignment.mockResolvedValue({ id: "a-orphan", name: "Backend Onboarding" });
    mockSetTeamAssignmentItems
      .mockRejectedValueOnce(new Error("422: task text too long"))
      .mockResolvedValueOnce({ id: "a-orphan", itemCount: 1 });

    const onSaved = vi.fn();
    render(
      <AssignmentFormDialog
        teamId="t1"
        assignment={null}
        open
        onOpenChange={() => {}}
        onSaved={onSaved}
      />,
    );
    await screen.findByLabelText(/everyone/i);

    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "Backend Onboarding" },
    });
    fireEvent.change(screen.getByPlaceholderText(/describe the task/i), {
      target: { value: "Read the runbook" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    // First attempt: create succeeds, the item-save fails.
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockCreateTeamAssignment).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockSetTeamAssignmentItems).toHaveBeenCalledTimes(1));
    expect(onSaved).not.toHaveBeenCalled();

    // Retry: must update "a-orphan", not create a second assignment.
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());

    expect(mockCreateTeamAssignment).toHaveBeenCalledTimes(1);
    expect(mockUpdateTeamAssignment).toHaveBeenCalledWith("t1", "a-orphan", expect.anything());
    expect(mockSetTeamAssignmentItems).toHaveBeenCalledTimes(2);
    expect(mockSetTeamAssignmentItems.mock.calls[1][1]).toBe("a-orphan");
  });
});
