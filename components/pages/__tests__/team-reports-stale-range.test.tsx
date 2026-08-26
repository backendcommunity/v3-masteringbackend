/**
 * `loadReport` had no staleness guard: it awaited `getTeamReport` and called
 * `setReport(data)` unconditionally, with no check that the payload it just
 * received still matches the range the user has selected.
 *
 * That is more reachable than it looks. The backend caches the report per
 * (team, range) for 900 seconds, so a warm range answers in milliseconds
 * while a cold one runs a RepeatableRead transaction over two windows — the
 * two response times differ by an order of magnitude in the ordinary case.
 * Toggle 12m -> 12w and the abandoned 12m response can land LAST: the Select
 * reads "Last 12 weeks" while the chart underneath it draws monthly buckets
 * and the tiles show a twelve-month total.
 *
 * This drives exactly that ordering — request the slow range, switch back
 * before it resolves, then release it — and asserts the screen keeps the
 * payload that was requested LAST, not the one that RESOLVED last. Same
 * shape as components/pages/__tests__/team-roster-stale-response.test.tsx,
 * which pins the identical class on the roster.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TeamReportsPage } from "../team-reports";
import type { TeamReport, TeamSummary } from "@/lib/data";

const mockGetMyTeams = vi.fn();
const mockGetTeamReport = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamReport: mockGetTeamReport,
  }),
  API_BASE: "http://localhost:8081/api/v3",
}));

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));

// Radix's pointer-capture/portal machinery doesn't run under jsdom, so the
// range Select is swapped for a native <select> that `fireEvent.change` can
// drive. Same pattern as team-roster-stale-response.test.tsx.
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid="range-select"
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

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  (global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      width: 300, height: 100, top: 0, left: 0, bottom: 100, right: 300, x: 0, y: 0,
      toJSON() {},
    }),
  });
});

const TEAM: TeamSummary = {
  id: "t1",
  name: "Acme",
  ownerId: "o1",
  role: "OWNER",
  subscription: { status: "active", seats: 10, paidSeats: 10 },
};

function report(period: "week" | "month", coursesFinished: number): TeamReport {
  const bucket = period === "week" ? "2026-08-24" : "2026-08-01";
  return {
    range: {
      period,
      buckets: 1,
      from: bucket,
      to: "2026-09-01",
      dataBegins: bucket,
      completionsBegin: bucket,
    },
    seats: { total: 10, used: 7 },
    series: [{ bucket, activeMembers: 1, coursesFinished, pathsFinished: 0 }],
    totals: { activeMembers: 1, coursesFinished, pathsFinished: 0, membersWhoFinished: 1 },
    previous: { activeMembers: 0, coursesFinished: 0, pathsFinished: 0, membersWhoFinished: 0 },
    change: {
      activeMembers: null, coursesFinished: null, pathsFinished: null, membersWhoFinished: null,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([TEAM]);
});

describe("TeamReportsPage — range last-write-wins", () => {
  it("keeps the LAST-requested range's report even if an earlier request resolves later", async () => {
    let releaseSlow: (value: TeamReport) => void = () => {};
    const slow = new Promise<TeamReport>((resolve) => {
      releaseSlow = resolve;
    });

    mockGetTeamReport.mockImplementation((_teamId: string, r: string) =>
      r === "12m" ? slow : Promise.resolve(report("week", 7)),
    );

    render(<TeamReportsPage />);
    await screen.findByTestId("report-seats");

    const select = await screen.findByTestId("range-select");

    // Ask for 12 months — it hangs.
    fireEvent.change(select, { target: { value: "12m" } });
    await waitFor(() => expect(mockGetTeamReport).toHaveBeenCalledWith("t1", "12m"));

    // Change your mind before it lands. This one resolves immediately.
    fireEvent.change(select, { target: { value: "12w" } });
    await waitFor(() =>
      expect(mockGetTeamReport.mock.calls.filter((c) => c[1] === "12w")).toHaveLength(2),
    );

    // Now the abandoned monthly response arrives, carrying a distinctive
    // total nothing else in this test produces.
    releaseSlow(report("month", 999));
    await new Promise((r) => setTimeout(r, 50));

    const coursesTile = screen.getByTestId("report-stat-coursesFinished");
    expect(coursesTile.textContent).toContain("7");
    // The screen must never show a figure from a range the user is no longer
    // looking at, under a Select that says otherwise.
    expect(coursesTile.textContent).not.toContain("999");
    expect((select as HTMLSelectElement).value).toBe("12w");
  });
});
