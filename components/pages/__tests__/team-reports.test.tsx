/**
 * The team Reports screen — "did this subscription do anything".
 *
 * Three payload facts drive every assertion in this file, all documented on
 * `TeamReport` in lib/data.ts:
 *  - `change` is `number | null`; `null` (the previous window was zero) must
 *    render as no pill at all, never "∞%"/"NaN%".
 *  - `range.completionsBegin` later than `range.dataBegins` means the
 *    completion counters UNDERCOUNT before it — the caption must say so
 *    ("at least"/"undercount"), and must NOT appear when the two are equal.
 *  - `range.to` is exclusive (one bucket past the last rendered one), so the
 *    visible range is built from `dataBegins` and the LAST series bucket,
 *    never from `range.to` — printing it would show a future date.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { TeamReportsPage } from "../team-reports";
import type { TeamReport, TeamSummary } from "@/lib/data";

const mockGetMyTeams = vi.fn();
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

// ResponsiveContainer needs a ResizeObserver, which jsdom doesn't ship, and
// measures its host via getBoundingClientRect, which jsdom always reports as
// 0x0 — recharts then renders nothing at all. Both are stubbed the same way
// components/atoms/__tests__/terminal-run-api.test.tsx stubs ResizeObserver
// for Terminal.tsx's own real-size deferral.
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

const team = (role: "OWNER" | "ADMIN" | "MEMBER" = "OWNER"): TeamSummary => ({
  id: "t1",
  name: "Acme",
  ownerId: "o1",
  role,
  subscription: { status: "active", seats: 10, paidSeats: 10 },
});

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
// so a bug that drops/nulls a falsy 0 bucket shows up as a missing dot.
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

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([team()]);
});

describe("TeamReportsPage", () => {
  it("renders the seat figure and each sparkline", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    const { container } = render(<TeamReportsPage />);

    const seats = await screen.findByTestId("report-seats");
    expect(within(seats).getByText("7 of 10")).toBeTruthy();

    for (const metric of ["activeMembers", "coursesFinished", "pathsFinished"] as const) {
      const sparkline = container.querySelector(`[data-testid="report-sparkline-${metric}"]`);
      expect(sparkline).toBeTruthy();
      // One dot per bucket proves the series actually reached the chart —
      // the zero-bucket assertion below narrows this to the specific bug
      // that class of check exists to catch.
      expect(sparkline!.querySelectorAll("circle.recharts-dot").length).toBe(BUCKET_COUNT);
    }
  });

  it("says when the data begins, so an empty stretch is not read as inactivity", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamReportsPage />);

    expect(await screen.findByText(/since 8 June 2026/i)).toBeTruthy();
  });

  it("shows no change pill when the previous period was zero", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamReportsPage />);

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
    // exists to catch, demonstrated against the pre-fix code in the fix
    // report alongside this test.
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamReportsPage />);

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
    render(<TeamReportsPage />);

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
    render(<TeamReportsPage />);

    const caption = await screen.findByText(/undercount|at least/i);
    expect(caption.textContent).not.toMatch(/\bnone\b/i);
  });

  it("shows no undercount caption when completionsBegin equals dataBegins", async () => {
    // No gap: completionsBegin === dataBegins — the caption must be ABSENT,
    // not present-but-empty.
    mockGetTeamReport.mockResolvedValue(buildReport());
    render(<TeamReportsPage />);
    await screen.findByTestId("report-seats");
    expect(screen.queryByText(/undercount/i)).not.toBeInTheDocument();
  });

  it("does not show range.to as the end of the window", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    const { container } = render(<TeamReportsPage />);
    await screen.findByTestId("report-seats");

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
    const { container } = render(<TeamReportsPage />);
    await screen.findByTestId("report-seats");

    const sparkline = container.querySelector('[data-testid="report-sparkline-activeMembers"]')!;
    const dots = sparkline.querySelectorAll("circle.recharts-dot");
    // Every bucket gets a dot, including the zero one at index 5 — a
    // `bucket[metric] || null`-style bug would drop it, shrinking this
    // count by one and breaking the line into two disconnected segments.
    expect(dots.length).toBe(BUCKET_COUNT);
  });

  it("does not put `store` in the fetch effect's deps", async () => {
    mockGetTeamReport.mockResolvedValue(buildReport());
    const { rerender } = render(<TeamReportsPage />);

    await waitFor(() => expect(mockGetTeamReport).toHaveBeenCalledTimes(1));

    // Simulate an unrelated store update elsewhere in the app (e.g. the
    // notification poll firing setLevelUpModal) by forcing a re-render with
    // no relevant prop/state change. The mocked useAppStore() above hands
    // back a brand-new object on every call, reproducing exactly what a
    // real selector-less useAppStore() subscriber sees on ANY unrelated
    // set() in the app.
    rerender(<TeamReportsPage />);

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
    render(<TeamReportsPage />);

    const retry = await screen.findByRole("button", { name: /try again/i });
    fireEvent.click(retry);

    await screen.findByTestId("report-seats");
    expect(mockGetTeamReport).toHaveBeenCalledTimes(2);
  });

  it("renders the tiles in a declared order, not the payload's key order", async () => {
    // `Object.keys(report.totals)` put the tiles in whatever order a backend
    // object literal happened to be written in — reordering two fields in
    // team-reports.ts's TeamReportTotals silently reorders this screen. The
    // fixture below hands back the keys REVERSED to prove the order comes
    // from this file.
    const report = buildReport();
    report.totals = {
      membersWhoFinished: 5,
      pathsFinished: 4,
      coursesFinished: 10,
      activeMembers: 7,
    } as typeof report.totals;
    mockGetTeamReport.mockResolvedValue(report);

    const { container } = render(<TeamReportsPage />);
    await screen.findByTestId("report-seats");

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
    const { container } = render(<TeamReportsPage />);
    await screen.findByTestId("report-seats");

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

    const { container } = render(<TeamReportsPage />);
    await screen.findByTestId("report-seats");

    expect(container.textContent).toContain("31 August 2026");
  });

  it("renders no denominator when the team has no subscription", async () => {
    // The backend sends `seats.total: null` for a team whose subscription was
    // removed — "4 of 0" asserted a paid-seat figure no subscription made.
    const report = buildReport();
    report.seats = { total: null, used: 4 };
    mockGetTeamReport.mockResolvedValue(report);

    render(<TeamReportsPage />);
    const seats = await screen.findByTestId("report-seats");

    expect(seats.textContent).toContain("4");
    // No denominator at all — not "4 of 0", and not "4 of " with the null
    // silently swallowed by React, which reads as a truncated number.
    expect(seats.textContent).not.toMatch(/\bof\b/);
    expect(seats.textContent).toMatch(/no active plan/i);
  });

  it("still renders a real zero-seat subscription as a denominator", async () => {
    const report = buildReport();
    report.seats = { total: 0, used: 4 };
    mockGetTeamReport.mockResolvedValue(report);

    render(<TeamReportsPage />);
    const seats = await screen.findByTestId("report-seats");
    expect(seats.textContent).toContain("4 of 0");
  });
});

describe("TeamReportsPage — the CSV download", () => {
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
    render(<TeamReportsPage />);
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

    render(<TeamReportsPage />);
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

    render(<TeamReportsPage />);
    fireEvent.click(await screen.findByRole("button", { name: /download csv/i }));

    await waitFor(() => expect(clicks).toHaveLength(1));
    expect(clicks[0]).toBe("team-reports-12w.csv");
    spy.mockRestore();
  });

  it("keeps the manager on the screen when the export fails", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("503"));
    render(<TeamReportsPage />);
    const button = await screen.findByRole("button", { name: /download csv/i });

    fireEvent.click(button);

    // The report itself is still on screen — a failed download must not tear
    // the page down or throw an unhandled rejection.
    await screen.findByText(/couldn.t download/i);
    expect(screen.getByTestId("report-seats")).toBeTruthy();
  });
});
