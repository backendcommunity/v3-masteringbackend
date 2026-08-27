// Task 6 review, Finding 1: getTeamOverview's `.catch` used to flip a single
// `failed` flag that replaced the ENTIRE page with "Couldn't load your
// team" — unmounting the group Select along with everything else. The
// backend 404s an unknown/other-team groupId, so deleting a group (from
// another tab, or from the Groups tab) while Overview sits filtered to it
// lands the viewer on a full-page error whose message is wrong (the team
// loaded fine — only the filter is stale) and whose only fix is a browser
// reload, since the one control that would let them pick "All groups" is
// gone.
//
// Fixed by splitting the single `failed` flag into `teamFailed` (getMyTeams
// itself failing — still a whole-page error) and `overviewFailed` (a
// filtered getTeamOverview call failing — confined to the stats region,
// with the header and group Select staying mounted). This test drives the
// exact recovery path: filter to a group, have the fetch reject, assert the
// Select is still there, then use it to switch back to "All groups" and
// confirm the view recovers.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TeamOverviewPage } from "../team-overview";

const mockGetMyTeams = vi.fn();
const mockGetTeamGroups = vi.fn();
const mockGetTeamOverview = vi.fn();
// The Overview screen now fetches the team report on the same page. It is
// left pending for the whole of this suite: these tests are about the
// overview half, and a report that never resolves keeps its region a
// skeleton without adding a second "Try again" to the screen.
const mockGetTeamReport = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamGroups: mockGetTeamGroups,
    getTeamOverview: mockGetTeamOverview,
    getTeamReport: mockGetTeamReport,
  }),
}));

// Mock the shadcn/Radix Select with a plain native <select> so the test can
// drive it with a normal `fireEvent.change` — Radix's pointer-capture/portal
// machinery doesn't run under jsdom. Same pattern as
// components/__tests__/github-connect-disconnect.test.tsx.
vi.mock("@/components/ui/select", () => ({
  // Two Selects live on this page now — the group filter and the report's
  // range — so the stub names them apart by the `name` the page passes,
  // keeping `group-filter-select` pointed at the one these tests drive.
  Select: ({ name, value, onValueChange, children }: any) => (
    <select
      data-testid={name === "range" ? "range-select" : "group-filter-select"}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const TEAM = { id: "t1", name: "Acme", role: "OWNER" as const };
const GROUPS = [{ id: "g1", name: "Platform", memberCount: 2, createdAt: "2026-01-01" }];
const OVERVIEW = {
  seats: { paidSeats: 5, activeMembers: 3, pendingInvites: 0, used: 3, available: 2 },
  activeThisWeek: 2,
  stalled: 0,
  neverActive: 1,
};

describe("TeamOverviewPage — filtered fetch failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyTeams.mockResolvedValue([TEAM]);
    mockGetTeamGroups.mockResolvedValue(GROUPS);
    mockGetTeamReport.mockImplementation(() => new Promise(() => {}));
  });

  it("keeps the group Select mounted when a filtered fetch fails, and recovers when the viewer picks All groups", async () => {
    mockGetTeamOverview.mockImplementation((_teamId: string, groupId?: string) => {
      if (!groupId) return Promise.resolve(OVERVIEW);
      return Promise.reject(new Error("Not Found"));
    });

    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    // Unfiltered load succeeds; the Select and the stats both render.
    const select = await screen.findByTestId("group-filter-select");
    await screen.findByText("Seats used");

    // Filter to the group — the backend 404s it (e.g. it was just deleted).
    fireEvent.change(select, { target: { value: "g1" } });

    await screen.findByText("Couldn't load this view");

    // The whole page must NOT have been replaced: the Select is still here,
    // not the generic "Couldn't load your team" full-page error.
    expect(screen.getByTestId("group-filter-select")).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load your team")).not.toBeInTheDocument();
    expect(screen.queryByText("Seats used")).not.toBeInTheDocument();

    // Recovery: use the still-mounted Select to switch back to All groups.
    fireEvent.change(screen.getByTestId("group-filter-select"), {
      target: { value: "all" },
    });

    await screen.findByText("Seats used");
    expect(screen.queryByText("Couldn't load this view")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mockGetTeamOverview).toHaveBeenLastCalledWith("t1", undefined),
    );
  });

  it("still shows the full-page error when the UNFILTERED fetch fails", async () => {
    mockGetTeamOverview.mockRejectedValue(new Error("network error"));

    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    await screen.findByText("Couldn't load your team");
    expect(screen.queryByTestId("group-filter-select")).not.toBeInTheDocument();
  });
});
