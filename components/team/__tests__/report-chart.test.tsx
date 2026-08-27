/**
 * `ReportChart` replaces the three 64px sparklines with one real chart.
 * jsdom gives `ResponsiveContainer` zero layout, so it never renders any
 * SVG paths — asserting on rendered geometry would test nothing. Instead
 * the component renders a `<script type="application/json"
 * data-testid="report-chart-data">` carrying exactly the array it hands
 * recharts, and these tests assert on that: it's where the transform bugs
 * (the `|| 0` gap bug, the axis-label formatting) actually live.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportChart } from "../report-chart";
import type { TeamReportBucket } from "@/lib/data";

// ResponsiveContainer needs a ResizeObserver, which jsdom doesn't ship —
// stubbed the same way components/pages/__tests__/team-reports.test.tsx and
// components/atoms/__tests__/terminal-run-api.test.tsx do.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  (global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
  // recharts skips rendering axis ticks entirely at 0x0 (jsdom's default
  // getBoundingClientRect), which would make the theming test below pass
  // vacuously — nothing to assert on. Giving the container real dimensions,
  // the same way team-reports.test.tsx does, is what makes tick <text>
  // nodes actually appear in the DOM.
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

const SERIES: TeamReportBucket[] = [
  { bucket: "2026-06-01", activeMembers: 4, coursesFinished: 0, pathsFinished: 1 },
  { bucket: "2026-07-01", activeMembers: 0, coursesFinished: 2, pathsFinished: 0 },
  { bucket: "2026-08-01", activeMembers: 7, coursesFinished: 3, pathsFinished: 2 },
];

describe("ReportChart", () => {
  it("plots a zero bucket as a zero, not a gap", () => {
    render(<ReportChart data={SERIES} metric="activeMembers" period="month" label="Active members" />);
    const points = JSON.parse(screen.getByTestId("report-chart-data").textContent!);
    expect(points.map((p: any) => p.value)).toEqual([4, 0, 7]);
    expect(points.every((p: any) => p.value !== null && p.value !== undefined)).toBe(true);
  });

  it("labels the x axis by bucket, formatted for the period", () => {
    render(<ReportChart data={SERIES} metric="coursesFinished" period="month" label="Courses finished" />);
    const points = JSON.parse(screen.getByTestId("report-chart-data").textContent!);
    expect(points[0].axisLabel).toBe("Jun");
  });

  it("renders nothing to chart when the series is empty, and says so", () => {
    render(<ReportChart data={[]} metric="activeMembers" period="week" label="Active members" />);
    expect(screen.getByText(/nothing to chart yet/i)).toBeInTheDocument();
  });

  // recharts puts `className` on the axis's outer <g> wrapper, never on the
  // individual tick <text> elements — each tick gets its color from an
  // explicit `fill` attribute instead, sourced from the `tick` prop. Putting
  // the theme token in a `className` (as an earlier draft did) compiles and
  // renders, but every tick silently falls back to recharts' own default
  // stroke (#666) on both light and dark grounds. This asserts the actual
  // rendered attribute so that regression can't silently ship again.
  it("colors axis ticks with the muted-foreground token, not recharts' default", () => {
    const { container } = render(
      <ReportChart data={SERIES} metric="activeMembers" period="month" label="Active members" />
    );
    const ticks = container.querySelectorAll(".recharts-cartesian-axis-tick-value");
    expect(ticks.length).toBeGreaterThan(0);
    ticks.forEach((tick) => {
      expect(tick.getAttribute("fill")).toBe("hsl(var(--muted-foreground))");
      expect(tick.getAttribute("fill")).not.toBe("#666");
    });
  });
});
