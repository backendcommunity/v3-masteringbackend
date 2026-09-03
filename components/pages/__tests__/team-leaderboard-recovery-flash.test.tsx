// The leaderboard's group filter (Finding 5) arrived with the same one-frame
// flash that Minor 7 had already fixed on the overview: the new page reset
// `boardFailed`/`boardLoading` inside its effect, which runs strictly AFTER
// the click's render commits. Choosing "Show all groups" out of a failed
// filtered view flips `groupFilter` to "all" immediately while `boardFailed`
// still describes the old filter's outcome, so the top-level guard
// `boardFailed && groupFilter === "all"` matches for exactly one render and
// replaces the whole page — Select and all — with the full-page error the
// user is clicking to escape.
//
// A `findByText` assertion cannot see this: it polls until the eventual
// correct state and never observes the intermediate one. A MutationObserver
// records every DOM mutation React performs in order, including from a commit
// that is superseded a moment later — so an insertion that never survives to
// be displayed still shows up. That is the only assertion that distinguishes
// "never rendered" from "rendered, then immediately replaced".
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
const BOARD = {
  entries: [
    {
      id: "e1",
      name: "Dev One",
      username: "dev1",
      avatar: null,
      rank: 1,
      totalPoints: 100,
      totalCompletedCourses: 3,
    },
  ],
};

let observer: MutationObserver | null = null;

afterEach(() => {
  observer?.disconnect();
  observer = null;
});

describe("TeamLeaderboardPage — recovery flash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyTeams.mockResolvedValue([TEAM]);
    mockGetTeamGroups.mockResolvedValue(GROUPS);
  });

  it("never paints the full-page error while recovering via Show all groups", async () => {
    mockGetTeamLeaderboard.mockImplementation((_teamId: string, groupId?: string) =>
      groupId ? Promise.reject(new Error("Not Found")) : Promise.resolve(BOARD),
    );

    render(<TeamLeaderboardPage />);

    const select = await screen.findByTestId("group-filter-select");
    await screen.findByText("Dev One");

    // Filter to the group — the backend 404s it, as it does for a group that
    // was renamed or deleted since the filter was chosen.
    fireEvent.change(select, { target: { value: "g1" } });
    await screen.findByText("Couldn't load this view");

    const insertedFullPageError: boolean[] = [];
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.textContent?.includes("Couldn't load the leaderboard")) {
            insertedFullPageError.push(true);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    fireEvent.click(screen.getByRole("button", { name: /show all groups/i }));

    await waitFor(() => expect(screen.getByText("Dev One")).toBeInTheDocument());
    await Promise.resolve();

    expect(insertedFullPageError).toEqual([]);
  });
});
