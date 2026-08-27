// Minor 7 (team-groups review): clicking "Show all groups" sets
// groupFilter="all" while `overviewFailed` is still true from the FILTERED
// fetch that just failed. For one render, the top-level guard
// `overviewFailed && groupFilter === "all"` matches, briefly replacing the
// recovery card with the generic full-page "Couldn't load your team" error
// — before the effect (which runs strictly after that render commits) resets
// `overviewFailed` back to false.
//
// `await screen.findByText("Seats used")` — the assertion style the existing
// filter-failure test uses — polls until the eventual correct state and
// never observes an intermediate one, so it cannot catch this. A
// MutationObserver does: it records every individual DOM mutation React
// performs, in order, including ones from a commit that gets superseded a
// moment later. If "Couldn't load your team" is ever inserted into the DOM
// during the click, it shows up in the mutation list even though the final
// state (after the effect corrects it) never displays it.
//
// The fix moves the reset into the render itself — React's "adjust state
// while rendering" pattern discards a render that calls setState before
// returning, so the stale render is never committed at all, and this
// mutation-level test is the only kind of assertion that can tell the
// difference between "never rendered" and "rendered then immediately
// replaced."
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

let observer: MutationObserver | null = null;

afterEach(() => {
  observer?.disconnect();
  observer = null;
});

describe("TeamOverviewPage — recovery flash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyTeams.mockResolvedValue([TEAM]);
    mockGetTeamGroups.mockResolvedValue(GROUPS);
    mockGetTeamReport.mockImplementation(() => new Promise(() => {}));
  });

  it("never paints the full-page error while recovering via Show all groups", async () => {
    mockGetTeamOverview.mockImplementation((_teamId: string, groupId?: string) => {
      if (!groupId) return Promise.resolve(OVERVIEW);
      return Promise.reject(new Error("Not Found"));
    });

    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    const select = await screen.findByTestId("group-filter-select");
    await screen.findByText("Seats used");

    // Filter to the group — the backend 404s it.
    fireEvent.change(select, { target: { value: "g1" } });
    await screen.findByText("Couldn't load this view");

    // Now record every DOM mutation from here on, then click "Show all
    // groups" — the recovery path under test.
    const insertedFullPageError: boolean[] = [];
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.textContent?.includes("Couldn't load your team")) {
            insertedFullPageError.push(true);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    fireEvent.click(screen.getByRole("button", { name: /show all groups/i }));

    // Let the MutationObserver's queued microtask (and the store call it's
    // waiting on) run, then confirm the page has fully recovered.
    await waitFor(() => expect(screen.getByText("Seats used")).toBeInTheDocument());
    await Promise.resolve();

    expect(insertedFullPageError).toEqual([]);
  });
});
