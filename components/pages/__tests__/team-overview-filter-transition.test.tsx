// Finding 3 (team-groups review): `if (!overview) return <PageSkeleton/>`
// only ever fires before the FIRST load. Once `overview` holds data, a
// filter change (All groups -> Platform) leaves those whole-team figures on
// screen — under the NEW department's "Showing Platform." caption — for the
// entire round trip of the new fetch. Wrong figures attributed to a named
// department is exactly what server-side filtering exists to avoid.
//
// The Members tab already handles the identical transition correctly via
// `rosterLoading` -> skeleton, with the header/Select staying mounted. This
// test pins the same behavior here: during a filter switch, the stats
// region must show a skeleton — not the previous scope's numbers — while the
// group Select stays live throughout.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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

// Same native-<select> mock as team-overview-filter-failure.test.tsx — Radix
// Select's pointer-capture/portal machinery doesn't run under jsdom.
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

// Matches the finding's own example numbers, so a reader can trace the test
// straight back to the reported symptom.
const WHOLE_TEAM_OVERVIEW = {
  seats: { paidSeats: 6, activeMembers: 4, pendingInvites: 0, used: 4, available: 2 },
  activeThisWeek: 4,
  stalled: 2,
  neverActive: 0,
};

const PLATFORM_OVERVIEW = {
  seats: { paidSeats: 6, activeMembers: 4, pendingInvites: 0, used: 4, available: 2 },
  activeThisWeek: 1,
  stalled: 0,
  neverActive: 1,
};

describe("TeamOverviewPage — filter transition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyTeams.mockResolvedValue([TEAM]);
    mockGetTeamGroups.mockResolvedValue(GROUPS);
    mockGetTeamReport.mockImplementation(() => new Promise(() => {}));
  });

  it("shows a skeleton, not the previous scope's figures, while a filtered fetch is in flight", async () => {
    mockGetTeamOverview.mockResolvedValueOnce(WHOLE_TEAM_OVERVIEW);

    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    const select = await screen.findByTestId("group-filter-select");
    await screen.findByText("Seats used");
    expect(screen.getByText("4 of 6")).toBeInTheDocument();

    // The filtered fetch never resolves within this test — long enough to
    // inspect the screen mid-round-trip.
    let resolvePlatform!: (v: unknown) => void;
    mockGetTeamOverview.mockImplementationOnce(
      () => new Promise((resolve) => { resolvePlatform = resolve; }),
    );

    fireEvent.change(select, { target: { value: "g1" } });

    // The stale whole-team number must be gone while Platform's fetch is
    // still in flight — replaced by a skeleton, not left on screen under
    // Platform's caption.
    await waitFor(() => expect(screen.queryByText("4 of 6")).not.toBeInTheDocument());
    expect(screen.queryByText("Seats used")).not.toBeInTheDocument();

    // The Select stays mounted throughout — this is a loading state, not an
    // error state, and it must not regress the recovery path a previous fix
    // round put in for the error case.
    expect(screen.getByTestId("group-filter-select")).toBeInTheDocument();

    // Resolve Platform's fetch — its own figures now render correctly.
    resolvePlatform(PLATFORM_OVERVIEW);
    await screen.findByText("Seats used");
    const neverStartedCard = screen.getByText("Never started").closest(".pt-5") as HTMLElement;
    expect(within(neverStartedCard).getByText("1")).toBeInTheDocument();
  });
});
