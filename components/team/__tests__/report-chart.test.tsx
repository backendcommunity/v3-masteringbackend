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
});
