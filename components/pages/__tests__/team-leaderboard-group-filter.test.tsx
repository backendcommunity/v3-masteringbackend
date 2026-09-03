// Finding 5 (team-groups review): the leaderboard's group filter existed on
// the server (resolveTeamLeaderboard(teamId, groupId?), the route's
// ?groupId= handling, and lib/store.ts's getTeamLeaderboard(teamId,
// groupId?)) but was unreachable from the UI — the page called
// store.getTeamLeaderboard(team.id) with no second argument and rendered no
// Select at all. The capability was served on one side and dropped on the
// other, the same shape the spec's decisions table rules against: groups
// "filter the roster, overview and leaderboard".
//
// This is not gated on canManage — the leaderboard is visible to every
// ACTIVE member — and carries no seat caveat, since this page shows no seat
// figures for a caveat to qualify.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TeamLeaderboardPage } from "../team-leaderboard";

const mockGetMyTeams = vi.fn();
const mockGetTeamGroups = vi.fn();
const mockGetTeamLeaderboard = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamGroups: mockGetTeamGroups,
    getTeamLeaderboard: mockGetTeamLeaderboard,
  }),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid="group-filter-select"
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

const TEAM = { id: "t1", name: "Acme", role: "MEMBER" as const };
const GROUPS = [{ id: "g1", name: "Platform", memberCount: 2, createdAt: "2026-01-01" }];
const BOARD_ALL = {
  entries: [
    { id: "e1", name: "Dev One", username: "dev1", avatar: null, rank: 1, totalPoints: 100, totalCompletedCourses: 3 },
  ],
};
const BOARD_PLATFORM = {
  entries: [
    { id: "e1", name: "Dev One", username: "dev1", avatar: null, rank: 1, totalPoints: 100, totalCompletedCourses: 3 },
  ],
};

describe("TeamLeaderboardPage — group filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyTeams.mockResolvedValue([TEAM]);
    mockGetTeamGroups.mockResolvedValue(GROUPS);
    mockGetTeamLeaderboard.mockImplementation((_teamId: string, groupId?: string) =>
      Promise.resolve(groupId ? BOARD_PLATFORM : BOARD_ALL),
    );
  });

  it("is reachable by a plain MEMBER, not just a manager — the page never gates on canManage", async () => {
    render(<TeamLeaderboardPage />);

    await screen.findByText("Dev One");
    // A MEMBER role team was used above; reaching this point at all proves
    // the fetch and Select aren't behind a canManage check.
    await waitFor(() => expect(mockGetTeamGroups).toHaveBeenCalledWith("t1"));
    expect(screen.getByTestId("group-filter-select")).toBeInTheDocument();
  });

  it("renders the group Select and fetches the unfiltered board on load", async () => {
    render(<TeamLeaderboardPage />);

    await screen.findByText("Dev One");
    expect(mockGetTeamLeaderboard).toHaveBeenCalledWith("t1", undefined);
  });

  it("passes the selected group id through to getTeamLeaderboard and labels the filtered view", async () => {
    render(<TeamLeaderboardPage />);

    const select = await screen.findByTestId("group-filter-select");
    await screen.findByText("Dev One");

    fireEvent.change(select, { target: { value: "g1" } });

    await waitFor(() =>
      expect(mockGetTeamLeaderboard).toHaveBeenLastCalledWith("t1", "g1"),
    );
    await screen.findByText(/showing platform/i);
  });

  it("shows no seat caveat when filtered — this page has no seat figures to qualify", async () => {
    render(<TeamLeaderboardPage />);

    const select = await screen.findByTestId("group-filter-select");
    await screen.findByText("Dev One");
    fireEvent.change(select, { target: { value: "g1" } });

    await screen.findByText(/showing platform/i);
    expect(screen.queryByText(/seats are counted/i)).not.toBeInTheDocument();
  });

  it("recovers in place from a deleted-group 404 instead of a dead end, like Overview", async () => {
    mockGetTeamLeaderboard.mockImplementation((_teamId: string, groupId?: string) => {
      if (!groupId) return Promise.resolve(BOARD_ALL);
      return Promise.reject(new Error("Not Found"));
    });

    render(<TeamLeaderboardPage />);

    const select = await screen.findByTestId("group-filter-select");
    await screen.findByText("Dev One");

    fireEvent.change(select, { target: { value: "g1" } });

    await screen.findByText("Couldn't load this view");
    // The whole page must NOT have been replaced — the Select survives so
    // "Show all groups" is reachable.
    expect(screen.getByTestId("group-filter-select")).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load the leaderboard")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("group-filter-select"), { target: { value: "all" } });
    await screen.findByText("Dev One");
    expect(screen.queryByText("Couldn't load this view")).not.toBeInTheDocument();
  });
});
