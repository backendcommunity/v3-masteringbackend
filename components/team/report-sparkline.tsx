"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { TeamReportBucket } from "@/lib/data";

/** The three `TeamReportBucket` fields this component can chart. */
export type ReportSparklineMetric = "activeMembers" | "coursesFinished" | "pathsFinished";

interface ReportSparklineProps {
  data: TeamReportBucket[];
  metric: ReportSparklineMetric;
  color?: string;
}

/**
 * One metric's series as a small line, one dot per bucket.
 *
 * `bucket[metric]` is read directly — never through a `|| something` guard.
 * `TeamReportBucket` values are plain numbers, and a `||` fallback would
 * treat a real `0` bucket the same as a missing one, handing recharts a
 * falsy value that `connectNulls` reads as a gap. A genuine zero week (no
 * completions, but the bucket exists) must stay a `0`, so it renders as a
 * dot sitting on the line exactly like any other value — the chart's only
 * job here is to not editorialize a quiet week into an invisible one.
 */
export function ReportSparkline({ data, metric, color = "#13AECE" }: ReportSparklineProps) {
  const points = data.map((bucket, index) => ({
    index,
    value: bucket[metric],
  }));

  return (
    <div className="h-16 w-full" data-testid={`report-sparkline-${metric}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2, strokeWidth: 0, fill: color }}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
