"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TeamReportBucket, TeamReportPeriod } from "@/lib/data";

export type ReportChartMetric = "activeMembers" | "coursesFinished" | "pathsFinished";

/** `YYYY-MM-DD` -> "Jun" for a month bucket, "9 Jun" for a week one. Parsed
 * with an explicit local time so the label doesn't shift a day on a viewer
 * west of UTC. */
function axisLabelFor(bucket: string, period: TeamReportPeriod): string {
  const d = new Date(`${bucket}T00:00:00`);
  return period === "month"
    ? d.toLocaleDateString("en-GB", { month: "short" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * One metric's series as a full-width area chart with real axes.
 *
 * `bucket[metric]` is read directly, never through a `|| something` guard.
 * The values are plain numbers, and a `||` fallback would treat a real `0`
 * the same as a missing one — handing recharts a falsy value it draws as a
 * gap. A quiet week is data: it must sit on the axis as a zero, because a
 * chart whose job is "is the investment working" must not editorialize a bad
 * week into an absent one.
 */
export function ReportChart({
  data,
  metric,
  period,
  label,
}: {
  data: TeamReportBucket[];
  metric: ReportChartMetric;
  period: TeamReportPeriod;
  label: string;
}) {
  const points = data.map((bucket) => ({
    axisLabel: axisLabelFor(bucket.bucket, period),
    bucket: bucket.bucket,
    value: bucket[metric],
  }));

  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Nothing to chart yet.</p>
      </div>
    );
  }

  const gradientId = `report-chart-${metric}`;

  return (
    <div className="h-64 w-full" data-testid={`report-chart-${metric}`}>
      {/* The exact array handed to recharts, so a test can assert the
          transform without depending on SVG layout jsdom does not compute.
          JSON.stringify does not escape "<", and the HTML tokenizer ends a
          <script> on the literal bytes "</script>" regardless of JS string
          context, so every "<" is escaped as \u003c below. Today's fields
          (axisLabel, bucket, value) can't produce that sequence, but that's
          not why this is safe — the escape is what keeps this sidecar safe
          if a caller-supplied string (e.g. `label`) is ever added to
          `points`. */}
      <script
        type="application/json"
        data-testid="report-chart-data"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(points).replace(/</g, "\\u003c") }}
      />
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13AECE" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#13AECE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey="axisLabel"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "#13AECE", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              fontSize: 12,
            }}
            formatter={(value: number) => [value, label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#13AECE"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 2, strokeWidth: 0, fill: "#13AECE" }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
