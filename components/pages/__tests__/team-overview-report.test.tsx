/**
 * The team report, now rendered on the Overview screen rather than a Reports
 * tab of its own. Every assertion in team-reports.test.tsx and
 * team-reports-stale-range.test.tsx is carried over here, retargeted at
 * `TeamOverviewPage`, plus the four that only exist once the two screens are
 * one screen — the ones about the group filter reaching the report.
 *
 * Three payload facts drive most of the report assertions, all documented on
 * `TeamReport` in lib/data.ts:
 *  - `change` is `number | null`; `null` (the previous window was zero) must
 *    render as no pill at all, never "∞%"/"NaN%".
 *  - `range.completionsBegin` later than `range.dataBegins` means the
 *    completion counters UNDERCOUNT before it — the caption must say so
 *    ("at least"/"undercount"), and must NOT appear when the two are equal.
 *  - `range.to` is exclusive (one bucket past the last rendered one), so the
 *    visible range is built from `dataBegins` and the LAST series bucket,
 *    never from `range.to` — printing it would show a future date.
 *
 * And one that only the merged screen can get wrong: filtering to a group
 * must narrow the report too. A whole-team chart under a "Showing Platform"
 * caption is the single failure this merge exists to prevent.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { TeamOverviewPage } from "../team-overview";
import type { TeamReport } from "@/lib/data";

const mockGetMyTeams = vi.fn();
const mockGetTeamGroups = vi.fn();
const mockGetTeamOverview = vi.fn();
const mockGetTeamReport = vi.fn();

// A brand-new object literal on every call — exactly what the real
// useAppStore() (no selector) hands back whenever ANY slice of the store
// changes anywhere in the app. Reusing this precedent (see
// components/team/__tests__/group-members-dialog.test.tsx) is what lets the
// "unrelated store update" test below reproduce the bug it guards against
// without wiring up the real store.
vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamGroups: mockGetTeamGroups,
    getTeamOverview: mockGetTeamOverview,
    getTeamReport: mockGetTeamReport,
  }),
  API_BASE: "http://localhost:8081/api/v3",
}));

// The CSV download goes through the shared axios instance so it inherits
// lib/api.ts's refresh-on-401 interceptor. A plain <a href> bypassed it: a
// manager with a long-open tab clicked Download, the cookie was expired, and
// the browser NAVIGATED AWAY from the SPA onto a raw JSON error body — every
// other action in the app would have refreshed silently.
const mockApiGet = vi.fn();
vi.mock("@/lib/api", () => ({ api: { get: (...args: unknown[]) => mockApiGet(...args) } }));

// Radix's pointer-capture/portal machinery doesn't run under jsdom, so both
// Selects are swapped for native <select>s that `fireEvent.change` can drive.
// They are told apart by the `name` the page passes — the same way
// team-overview-filter-failure.test.tsx does it.
vi.mock("@/components/ui/select", () => ({
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

// ResponsiveContainer needs a ResizeObserver, which jsdom doesn't ship, and
// measures its host via getBoundingClientRect, which jsdom always reports as
// 0x0 — recharts then renders nothing at all. Both are stubbed the same way
// components/team/__tests__/report-chart.test.tsx does.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  (global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
  // jsdom ships neither, and the download path needs both to hand the blob
  // to the browser.
  URL.createObjectURL = (() => "blob:mock") as typeof URL.createObjectURL;
  URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      width: 300,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 300,
      x: 0,
      y: 0,
      toJSON() {},
    }),
  });
});

const TEAM = { id: "t1", name: "Acme", role: "OWNER" as const };
const GROUPS = [{ id: "g1", name: "Platform", memberCount: 2, createdAt: "2026-01-01" }];

// Deliberately the same seat figures the report fixture carries (7 used of
// 10) — the merged screen shows ONE seats number, the overview's, and a test
// that used different numbers on each side could not tell which one it was
// looking at.
const OVERVIEW = {
  seats: { paidSeats: 10, activeMembers: 7, pendingInvites: 0, used: 7, available: 3 },
  activeThisWeek: 5,
  stalled: 2,
  neverActive: 1,
};

// 12 weekly buckets starting at dataBegins, built programmatically so the
// `to` field (one bucket PAST the last one) and the last bucket's own date
// never have to be hand-computed/hardcoded — see the range.to test below,
// which depends on `to` genuinely being later than anything rendered.
const DATA_BEGINS = "2026-06-08";
// UTC throughout: the backend labels every bucket with a UTC date
// (report-window.ts truncates in UTC), so a fixture that walked days in LOCAL
// time and then read them back with toISOString() shifted every generated
// label a day west of UTC — which silently collapsed `range.to` onto the last
// bucket's own end date and made those two assertions test the same string.
function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const BUCKET_COUNT = 12;
// Index 5 is a deliberate zero — "activeMembers" is nonzero everywhere else,
// so a bug that drops/nulls a falsy 0 bucket shows up as a missing point.
const SERIES = Array.from({ length: BUCKET_COUNT }, (_, i) => ({
  bucket: addDays(DATA_BEGINS, i * 7),
  activeMembers: i === 5 ? 0 : 3 + i,
  coursesFinished: i,
  pathsFinished: i % 2,
}));
const LAST_BUCKET = SERIES[SERIES.length - 1].bucket;
const RANGE_TO = addDays(LAST_BUCKET, 7); // exclusive — one bucket past the last

function buildReport(overrides: Partial<TeamReport["range"]> = {}): TeamReport {
  return {
    range: {
      period: "week",
      buckets: BUCKET_COUNT,
      from: DATA_BEGINS,
      to: RANGE_TO,
      dataBegins: DATA_BEGINS,
      completionsBegin: DATA_BEGINS,
      ...overrides,
    },
    seats: { total: 10, used: 7 },
    series: SERIES,
    totals: {
      activeMembers: 7,
      coursesFinished: 10,
      pathsFinished: 4,
      membersWhoFinished: 5,
    },
    previous: {
      activeMembers: 5,
      coursesFinished: 0,
      pathsFinished: 2,
      membersWhoFinished: 3,
    },
    change: {
      // FRACTIONS, not percentage-scaled integers — this is what the real
      // backend sends. percentChange() in report-window.ts is
      // (current - previous) / previous, and its own docstring says
      // "never a percentage-scaled number". A fixture using `40` here
      // would let a `Math.round(value)` bug (treating the fraction as
      // already-scaled) sail through undetected, since 40 stays >0 either
      // way — every value below is deliberately in the (-1, 1) range a
      // real fraction lives in, so a unit-scaling bug changes the outcome.
      activeMembers: 0.29, // must render "29%", not "No change"
      // The previous window was zero courses finished — must render as no
      // pill, never Infinity/NaN.
      coursesFinished: null,
      pathsFinished: -0.42, // must render "42%" (down), not "No change"
      membersWhoFinished: 0.67, // must render "67%", not "1%"
    },
  };
}

/** The array the chart actually hands recharts, off its JSON sidecar. */
function chartPoints() {
  return JSON.parse(screen.getByTestId("report-chart-data").textContent!) as Array<{
    axisLabel: string;
    bucket: string;
    value: number;
  }>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([TEAM]);
  mockGetTeamGroups.mockResolvedValue(GROUPS);
  mockGetTeamOverview.mockResolvedValue(OVERVIEW);
});

describe("TeamOverviewPage — the report", () => {
  it("renders the seat figure and a chart for every metric the toggle offers", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    // ONE seats figure on the merged screen, and it is the overview's.
    const seatsTile = (await screen.findByText("Seats used")).closest(".pt-5") as HTMLElement;
    expect(within(seatsTile).getByText("7 of 10")).toBeTruthy();

    // The three sparklines became one chart plus a metric toggle. Every
    // metric that had a sparkline must still be reachable, and each must
    // carry the whole series — one point per bucket proves the series
    // actually reached the chart.
    for (const metric of ["activeMembers", "coursesFinished", "pathsFinished"] as const) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(
        metric === "activeMembers" ? "^Active members$"
          : metric === "coursesFinished" ? "^Courses finished$"
          : "^Paths finished$",
      ) }));
      expect(screen.getByTestId(`report-chart-${metric}`)).toBeTruthy();
      expect(chartPoints()).toHaveLength(BUCKET_COUNT);
    }
  });

  it("marks the selected metric pressed, and only that one", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    const toggle = await screen.findByRole("group", { name: /chart metric/i });
    const buttons = within(toggle).getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons.filter((b) => b.getAttribute("aria-pressed") === "true")).toHaveLength(1);

    fireEvent.click(within(toggle).getByRole("button", { name: /^Paths finished$/ }));
    expect(
      within(toggle).getByRole("button", { name: /^Paths finished$/ }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(toggle).getByRole("button", { name: /^Active members$/ }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("says when the data begins, so an empty stretch is not read as inactivity", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    expect(await screen.findByText(/since 8 June 2026/i)).toBeTruthy();
  });

  it("heads the report with the window it actually covers", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    expect(await screen.findByText(/over the last 12 weeks/i)).toBeTruthy();
  });

  it("shows no change pill when the previous period was zero", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    const coursesTile = await screen.findByTestId("report-stat-coursesFinished");
    expect(within(coursesTile).queryByTestId("change-pill")).not.toBeInTheDocument();

    // Never a fabricated stand-in for null, anywhere on the page.
    expect(screen.queryByText(/∞/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();

    // A metric with a REAL change still gets a pill — proves the absence
    // above is specific to the null case, not every pill being suppressed.
    const activeTile = screen.getByTestId("report-stat-activeMembers");
    expect(within(activeTile).getByTestId("change-pill")).toBeTruthy();
  });

  it("renders change as a percentage, given the fraction the backend sends", async () => {
    // percentChange() in the backend's report-window.ts returns a FRACTION
    // ((current - previous) / previous), documented on its own line as
    // "never a percentage-scaled number" — not a number already scaled to
    // percentage points. A `Math.round(value)` bug (treating 0.29 as if it
    // were already "29") rounds every one of these to 0 or 1 and mislabels
    // real double-digit growth as "No change" — the exact defect this test
    // exists to catch.
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    const activeTile = await screen.findByTestId("report-stat-activeMembers");
    expect(within(activeTile).getByTestId("change-pill").textContent).toMatch(/29%/);

    const pathsTile = screen.getByTestId("report-stat-pathsFinished");
    expect(within(pathsTile).getByTestId("change-pill").textContent).toMatch(/42%/);

    const membersTile = screen.getByTestId("report-stat-membersWhoFinished");
    expect(within(membersTile).getByTestId("change-pill").textContent).toMatch(/67%/);
  });

  it("labels membersWhoFinished as course-OR-path, so it can't contradict a zero pathsFinished tile", async () => {
    // Live-browser finding: team-reports.ts's SQL counts membersWhoFinished
    // as `COUNT(DISTINCT userId) FILTER (WHERE kind <> 'activity')` — course
    // OR path, not path alone. A team where one member finished a COURSE
    // (and nobody finished a path) renders "0" on the Paths Finished tile
    // sitting right next to "1" on a tile whose old label said "Members who
    // finished A PATH" — a direct contradiction between two adjacent tiles.
    // This reproduces exactly that data shape.
    const report = buildReport();
    report.totals = {
      ...report.totals,
      coursesFinished: 1,
      pathsFinished: 0,
      membersWhoFinished: 1,
    };
    mockGetTeamReport.mockResolvedValue(report);
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    const membersTile = await screen.findByTestId("report-stat-membersWhoFinished");
    const pathsTile = screen.getByTestId("report-stat-pathsFinished");

    // The label must say "course" — not just "path" — so it can never claim
    // fewer people finished something than a course-only finisher allows.
    expect(membersTile.textContent).toMatch(/course/i);
    // Sanity: this is the exact contradictory-looking pair from the live
    // report (0 paths finished, 1 member who finished SOMETHING) — both
    // numbers are correct once the label matches what's actually counted.
    expect(pathsTile.textContent).toContain("0");
    expect(membersTile.textContent).toContain("1");
  });

  it("undercounts completions before completionsBegin when it's later than dataBegins", async () => {
    mockGetTeamReport.mockResolvedValue(
      buildReport({ completionsBegin: addDays(DATA_BEGINS, 21) }),
    );
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    const caption = await screen.findByText(/undercount|at least/i);
    expect(caption.textContent).not.toMatch(/\bnone\b/i);
  });

  it("shows no undercount caption when completionsBegin equals dataBegins", async () => {
    // No gap: completionsBegin === dataBegins — the caption must be ABSENT,
    // not present-but-empty.
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");
    expect(screen.queryByText(/undercount/i)).not.toBeInTheDocument();
  });

  it("does not show range.to as the end of the window", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    const { container } = render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    const toFormatted = new Date(`${RANGE_TO}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    expect(container.textContent).not.toContain(toFormatted);
    expect(container.textContent).not.toContain(RANGE_TO);
  });

  it("renders a zero bucket as a point on the line, not a gap", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    // Every bucket reaches the chart, including the zero one at index 5 — a
    // `bucket[metric] || null`-style bug would drop it, shrinking this count
    // by one and breaking the line into two disconnected segments.
    const points = chartPoints();
    expect(points).toHaveLength(BUCKET_COUNT);
    expect(points[5].value).toBe(0);
    expect(points.every((p) => p.value !== null && p.value !== undefined)).toBe(true);
  });

  it("does not put `store` in the fetch effect's deps", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    const { rerender } = render(<TeamOverviewPage onNavigate={vi.fn()} />);

    await waitFor(() => expect(mockGetTeamReport).toHaveBeenCalledTimes(1));

    // Simulate an unrelated store update elsewhere in the app (e.g. the
    // notification poll firing setLevelUpModal) by forcing a re-render with
    // no relevant prop/state change. The mocked useAppStore() above hands
    // back a brand-new object on every call, reproducing exactly what a
    // real selector-less useAppStore() subscriber sees on ANY unrelated
    // set() in the app.
    rerender(<TeamOverviewPage onNavigate={vi.fn()} />);

    // Wait out anything the effect might have re-armed (a debounce, a
    // microtask chain) before trusting the call count — asserting
    // immediately after a synchronous rerender would still pass even if the
    // effect quietly re-armed a timer that fires a moment later.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockGetTeamReport).toHaveBeenCalledTimes(1);
  });

  it("keeps a failed fetch on a usable screen with a retry", async () => {
    mockGetTeamReport.mockRejectedValueOnce(new Error("boom"));
    mockGetTeamReport.mockResolvedValueOnce(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    const retry = await screen.findByRole("button", { name: /try again/i });
    fireEvent.click(retry);

    await screen.findByTestId("report-stat-activeMembers");
    expect(mockGetTeamReport).toHaveBeenCalledTimes(2);
  });

  it("renders the tiles in a declared order, not the payload's key order", async () => {
    // `Object.keys(report.totals)` put the tiles in whatever order a backend
    // object literal happened to be written in — reordering two fields in
    // team-reports.ts's TeamReportTotals silently reorders this screen. The
    // fixture below hands back the keys REVERSED to prove the order comes
    // from the page.
    const report = buildReport();
    report.totals = {
      membersWhoFinished: 5,
      pathsFinished: 4,
      coursesFinished: 10,
      activeMembers: 7,
    } as typeof report.totals;
    mockGetTeamReport.mockResolvedValue(report);

    const { container } = render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    const order = Array.from(
      container.querySelectorAll('[data-testid^="report-stat-"]'),
    ).map((el) => el.getAttribute("data-testid"));
    expect(order).toEqual([
      "report-stat-activeMembers",
      "report-stat-coursesFinished",
      "report-stat-pathsFinished",
      "report-stat-membersWhoFinished",
    ]);
  });

  it("renders the END of the last bucket as the range end, not its start", async () => {
    // The last weekly bucket is labelled by its MONDAY, so printing the label
    // said "through 24 August" for a window that covers through the 30th —
    // understating the report's coverage by up to a full bucket. `range.to`
    // is still never printed: it is one bucket PAST the last one.
    mockGetTeamReport.mockResolvedValue(buildReport());
    const { container } = render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    const lastBucketEnd = addDays(LAST_BUCKET, 6);
    const expected = new Date(`${lastBucketEnd}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    expect(container.textContent).toContain(expected);

    const lastBucketStart = new Date(`${LAST_BUCKET}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    expect(container.textContent).not.toContain(lastBucketStart);
    expect(container.textContent).not.toContain(RANGE_TO);
  });

  it("renders the last day of the month for a 12m report", async () => {
    // Monthly buckets are labelled by the 1st, and "the end of the bucket" is
    // a month length away, not seven days — a week-shaped +6 would print
    // "6 August" for the August bucket.
    const report = buildReport({ period: "month" });
    report.series = [
      { bucket: "2026-07-01", activeMembers: 1, coursesFinished: 1, pathsFinished: 0 },
      { bucket: "2026-08-01", activeMembers: 1, coursesFinished: 1, pathsFinished: 0 },
    ];
    mockGetTeamReport.mockResolvedValue(report);

    const { container } = render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    expect(container.textContent).toContain("31 August 2026");
  });

  it("shows exactly one seats figure — the overview's, not a second one from the report", async () => {
    // The Reports screen carried its own seats tile (`seats.used of
    // seats.total`, with a null-total "no active plan" variant). Two seats
    // figures on one screen is one too many: they are computed from
    // different payloads and can disagree the moment a subscription changes
    // mid-request. The report's tile is the one that goes, so the report
    // payload's own seat numbers must reach no pixel of this page.
    const report = buildReport();
    report.seats = { total: null, used: 4 };
    mockGetTeamReport.mockResolvedValue(report);

    const { container } = render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    expect(screen.getAllByText("Seats used")).toHaveLength(1);
    expect(container.textContent).not.toMatch(/no active plan/i);
    expect(container.textContent).not.toContain("4 of");
  });
});

describe("TeamOverviewPage — the group filter reaches the report", () => {
  it("refetches the report when the group filter changes, and sends the group", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    await screen.findByTestId("report-stat-activeMembers");
    await waitFor(() =>
      expect(mockGetTeamReport).toHaveBeenLastCalledWith("t1", "12w", undefined),
    );

    fireEvent.change(screen.getByTestId("group-filter-select"), { target: { value: "g1" } });

    // The whole point of the merge: the report narrows with the tiles above
    // it. A report left whole-team here is the "two things at once" bug.
    await waitFor(() =>
      expect(mockGetTeamReport).toHaveBeenLastCalledWith("t1", "12w", "g1"),
    );
  });

  it("says seats are whole-team while a group filter is active", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    const { container } = render(<TeamOverviewPage onNavigate={vi.fn()} />);

    await screen.findByTestId("report-stat-activeMembers");
    expect(container.textContent).not.toContain("Seats are counted for the whole team");

    fireEvent.change(screen.getByTestId("group-filter-select"), { target: { value: "g1" } });
    await screen.findByTestId("report-stat-activeMembers");

    // Both halves. The first says what narrowed, the second says what did
    // not — a group does not own seats, and a caption that only said
    // "Showing Platform" would leave the seats tile above it reading as
    // Platform's.
    await waitFor(() =>
      expect(container.textContent).toContain(
        "Showing Platform. Seats are counted for the whole team.",
      ),
    );
  });

  it("swaps the report for a skeleton while the new group's report is in flight", async () => {
    // The mirror of the overview's own filter-transition rule: the previous
    // group's totals must not sit under the new group's caption for the
    // round trip. Both the render-phase reset and the effect set
    // `reportLoading` for exactly this reason.
    mockGetTeamReport.mockImplementation((_teamId: string, _r: string, gid?: string) =>
      gid ? new Promise<TeamReport>(() => {}) : Promise.resolve(buildReport()),
    );
    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    fireEvent.change(screen.getByTestId("group-filter-select"), { target: { value: "g1" } });

    await waitFor(() =>
      expect(screen.queryByTestId("report-stat-activeMembers")).not.toBeInTheDocument(),
    );
    // A loading report is not a broken one, and the filter stays live.
    expect(screen.queryByText("Couldn't load this report")).not.toBeInTheDocument();
    expect(screen.getByTestId("group-filter-select")).toBeInTheDocument();
  });

  it("keeps the group Select and the stalled callout mounted when the report fails", async () => {
    mockGetTeamReport.mockRejectedValue(new Error("503"));
    render(<TeamOverviewPage onNavigate={vi.fn()} />);

    await screen.findByText("Couldn't load this report");

    // "N people have stopped learning" is the most valuable line on this
    // screen. A failed report must never take it down with it — nor the
    // filter, nor the "now" tiles.
    expect(screen.getByText("2 people have stopped learning")).toBeInTheDocument();
    expect(screen.getByTestId("group-filter-select")).toBeInTheDocument();
    expect(screen.getByText("Seats used")).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load your team")).not.toBeInTheDocument();
  });
});

describe("TeamOverviewPage — range last-write-wins", () => {
  /**
   * The report fetch had no staleness guard on the Reports screen once: it
   * awaited `getTeamReport` and called `setReport(data)` unconditionally,
   * with no check that the payload it just received still matches the range
   * the user has selected.
   *
   * That is more reachable than it looks. The backend caches the report per
   * (team, group, range) for 900 seconds, so a warm range answers in
   * milliseconds while a cold one runs a RepeatableRead transaction over two
   * windows — the two response times differ by an order of magnitude in the
   * ordinary case. Toggle 12m -> 12w and the abandoned 12m response can land
   * LAST: the Select reads "Last 12 weeks" while the chart underneath it
   * draws monthly buckets and the tiles show a twelve-month total.
   */
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
      previous: {
        activeMembers: 0, coursesFinished: 0, pathsFinished: 0, membersWhoFinished: 0,
      },
      change: {
        activeMembers: null, coursesFinished: null, pathsFinished: null, membersWhoFinished: null,
      },
    };
  }

  /**
   * Drives the ordering the guard exists for: request the slow range, switch
   * back before it resolves, then release it. Returns the range Select once
   * the abandoned payload has had every chance to paint.
   */
  async function raceRanges() {
    let releaseSlow: (value: TeamReport) => void = () => {};
    const slow = new Promise<TeamReport>((resolve) => {
      releaseSlow = resolve;
    });

    mockGetTeamReport.mockImplementation((_teamId: string, r: string) =>
      r === "12m" ? slow : Promise.resolve(report("week", 7)),
    );

    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    const select = (await screen.findByTestId("range-select")) as HTMLSelectElement;

    // Ask for 12 months — it hangs.
    fireEvent.change(select, { target: { value: "12m" } });
    await waitFor(() =>
      expect(mockGetTeamReport).toHaveBeenCalledWith("t1", "12m", undefined),
    );

    // Change your mind before it lands. This one resolves immediately.
    fireEvent.change(select, { target: { value: "12w" } });
    await waitFor(() =>
      expect(mockGetTeamReport.mock.calls.filter((c) => c[1] === "12w")).toHaveLength(2),
    );

    // Now the abandoned monthly response arrives, carrying a distinctive
    // total nothing else in this test produces.
    releaseSlow(report("month", 999));
    await new Promise((r) => setTimeout(r, 50));

    return select;
  }

  it("keeps the LAST-requested range's report even if an earlier request resolves later", async () => {
    const select = await raceRanges();

    const coursesTile = screen.getByTestId("report-stat-coursesFinished");
    expect(coursesTile.textContent).toContain("7");
    // The screen must never show a figure from a range the user is no longer
    // looking at, under a Select that says otherwise.
    expect(coursesTile.textContent).not.toContain("999");
    expect(select.value).toBe("12w");
  });

  it("does not paint a stale report under a newer range label", async () => {
    const select = await raceRanges();

    // Not just the numbers — the heading, the axis and the Select must all
    // describe the same window. The abandoned payload is MONTHLY, so a
    // report that painted would say "Over the last 12 months" above a
    // Select reading "Last 12 weeks".
    expect(select.value).toBe("12w");
    expect(screen.getByText(/over the last 12 weeks/i)).toBeInTheDocument();
    expect(screen.queryByText(/over the last 12 months/i)).not.toBeInTheDocument();
    // The monthly payload's own bucket label ("Aug", from a month period)
    // must not have reached the chart either — the weekly one labels its
    // single bucket "24 Aug".
    expect(chartPoints().map((p) => p.axisLabel)).toEqual(["24 Aug"]);
  });
});

describe("TeamOverviewPage — the CSV download", () => {
  beforeEach(() => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    mockApiGet.mockResolvedValue({
      data: new Blob(["a,b\r\n"], { type: "text/csv" }),
      headers: {
        "content-disposition": 'attachment; filename="acme-engineering-reports-12w.csv"',
      },
    });
  });

  it("fetches through the shared api client rather than navigating the tab", async () => {
    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    const button = await screen.findByRole("button", { name: /download csv/i });

    // A plain <a href> to the API origin bypasses lib/api.ts's
    // refresh-on-401 interceptor entirely, so an expired cookie replaces the
    // whole SPA with a raw JSON error page — the 503 the report transaction
    // raises has the same shape. There must be no anchor to navigate with.
    expect(document.querySelector('a[href*="export.csv"]')).toBeNull();

    fireEvent.click(button);

    await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(1));
    const [url, config] = mockApiGet.mock.calls[0];
    expect(url).toBe("/teams/t1/reports/export.csv");
    expect(config).toMatchObject({ params: { range: "12w" }, responseType: "blob" });
    expect((config as { params: Record<string, unknown> }).params.groupId).toBeUndefined();
  });

  it("exports the group the screen is filtered to, not the whole team", async () => {
    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    await screen.findByTestId("report-stat-activeMembers");

    fireEvent.change(screen.getByTestId("group-filter-select"), { target: { value: "g1" } });
    await screen.findByTestId("report-stat-activeMembers");

    fireEvent.click(screen.getByRole("button", { name: /download csv/i }));

    // A spreadsheet of whole-team rows downloaded from a Platform-filtered
    // view is the same "two things at once" bug, only harder to spot once
    // it has left the browser.
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(1));
    expect(mockApiGet.mock.calls[0][1]).toMatchObject({
      params: { range: "12w", groupId: "g1" },
      responseType: "blob",
    });
  });

  it("saves under the filename the backend built, not a generic one", async () => {
    // The export slugifies the team's own name (with a "team" fallback for a
    // name that slugifies to nothing) — a client-side filename would throw
    // that away and give every team's file the same name in a manager's
    // Downloads folder.
    const clicks: string[] = [];
    const realCreate = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string, ...rest: unknown[]) => {
        const el = realCreate(tag as "a", ...(rest as []));
        if (tag === "a") {
          el.click = () => clicks.push((el as HTMLAnchorElement).download);
        }
        return el;
      });

    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: /download csv/i }));

    await waitFor(() => expect(clicks).toHaveLength(1));
    expect(clicks[0]).toBe("acme-engineering-reports-12w.csv");
    spy.mockRestore();
  });

  it("falls back to a name of its own when the header cannot be read", async () => {
    // A proxy that strips Content-Disposition, or a CORS config that stops
    // exposing it, must not leave the file called "export.csv".
    mockApiGet.mockResolvedValueOnce({
      data: new Blob(["a,b\r\n"], { type: "text/csv" }),
      headers: {},
    });
    const clicks: string[] = [];
    const realCreate = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string, ...rest: unknown[]) => {
        const el = realCreate(tag as "a", ...(rest as []));
        if (tag === "a") {
          el.click = () => clicks.push((el as HTMLAnchorElement).download);
        }
        return el;
      });

    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: /download csv/i }));

    await waitFor(() => expect(clicks).toHaveLength(1));
    expect(clicks[0]).toBe("team-reports-12w.csv");
    spy.mockRestore();
  });

  it("keeps the manager on the screen when the export fails", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("503"));
    render(<TeamOverviewPage onNavigate={vi.fn()} />);
    const button = await screen.findByRole("button", { name: /download csv/i });

    fireEvent.click(button);

    // The report itself is still on screen — a failed download must not tear
    // the page down or throw an unhandled rejection.
    await screen.findByText(/couldn.t download/i);
    expect(screen.getByTestId("report-stat-activeMembers")).toBeTruthy();
    expect(screen.getByText("Seats used")).toBeInTheDocument();
  });
});
