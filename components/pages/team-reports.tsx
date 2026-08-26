"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ReportSparkline } from "@/components/team/report-sparkline";
import { useAppStore, API_BASE } from "@/lib/store";
import type { TeamReport, TeamReportRange, TeamReportTotals, TeamSummary } from "@/lib/data";
import { cn } from "@/lib/utils";

const RANGE_LABELS: Record<TeamReportRange, string> = {
  "12w": "Last 12 weeks",
  "12m": "Last 12 months",
};

const METRIC_LABELS: Record<keyof TeamReportTotals, string> = {
  activeMembers: "Active members",
  coursesFinished: "Courses finished",
  pathsFinished: "Paths finished",
  membersWhoFinished: "Members who finished a path",
};

// The three totals that also have a per-bucket series to chart. `membersWhoFinished`
// is a totals-only figure — `TeamReportBucket` carries no matching field for it.
const SPARKLINE_METRICS = ["activeMembers", "coursesFinished", "pathsFinished"] as const;

/** `YYYY-MM-DD` -> "8 June 2026". Parsed with an explicit local time so the
 * date doesn't shift a day depending on the viewer's UTC offset. */
function formatLongDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * `change` is `number | null` — `null` means the previous window was zero,
 * and the only honest thing to render for that is nothing. Never "∞%",
 * never "NaN%", never a bare "0%" standing in for "we don't know". A real
 * zero-percent change (the previous window was equal, not empty) still
 * renders — that pill just says so.
 */
function ChangePill({ value }: { value: number | null }) {
  if (value === null) return null;

  // `value` is a FRACTION — percentChange() in the backend's report-window.ts
  // returns (current - previous) / previous, "never a percentage-scaled
  // number" per its own docstring. Scale to a percentage here, at the one
  // place this number becomes text, rather than trusting it arrives pre-scaled.
  const rounded = Math.round(value * 100);
  const isUp = rounded > 0;
  const isDown = rounded < 0;

  return (
    <Badge
      variant="outline"
      data-testid="change-pill"
      className={cn(
        "gap-0.5 px-1.5 py-0 text-[10px] font-semibold",
        isUp && "border-[#27AE60]/30 bg-[#27AE60]/10 text-[#27AE60]",
        isDown && "border-red-500/30 bg-red-500/10 text-red-600",
      )}
    >
      {isUp && <ArrowUp className="h-2.5 w-2.5" />}
      {isDown && <ArrowDown className="h-2.5 w-2.5" />}
      {rounded === 0 ? "No change" : `${Math.abs(rounded)}%`}
    </Badge>
  );
}

function StatTile({
  metric,
  value,
  change,
}: {
  metric: keyof TeamReportTotals;
  value: number;
  change: number | null;
}) {
  return (
    <Card data-testid={`report-stat-${metric}`}>
      <CardContent className="pt-5">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {METRIC_LABELS[metric]}
          </p>
          <ChangePill value={change} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * "Did this subscription do anything." Manager-only (gated by
 * `TeamHubLayout`'s `managerOnly` check, same as Overview and Settings).
 *
 * Three payload facts drive the rendering here, all documented on
 * `TeamReport` in lib/data.ts:
 *  - `change` is `number | null` — a null pill renders as nothing, never a
 *    fabricated "∞%"/"NaN%"/"0%".
 *  - `range.completionsBegin` can be later than `range.dataBegins`, which
 *    means the completion counters UNDERCOUNT before it (rows never got a
 *    date, not zero of them) — captioned "at least" when that gap exists,
 *    silent when it doesn't.
 *  - `range.to` is exclusive (one bucket past the last rendered one), so the
 *    visible range is built from `dataBegins` and the LAST series bucket,
 *    never from `range.to`.
 */
export function TeamReportsPage() {
  const store = useAppStore();

  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [teamFailed, setTeamFailed] = useState(false);

  const [range, setRange] = useState<TeamReportRange>("12w");
  const [report, setReport] = useState<TeamReport | null>(null);
  const [reportFailed, setReportFailed] = useState(false);

  const loadTeam = useCallback(async () => {
    setTeamFailed(false);
    try {
      const teams = await store.getMyTeams();
      const first = teams?.[0] ?? null;
      if (!first) throw new Error("No team found");
      setTeam(first);
    } catch {
      setTeamFailed(true);
    }
    // `store` is deliberately excluded — useAppStore() has no selector, so
    // its identity changes on any set() anywhere in the app (including a
    // nav-bar poll on a ten-second timer). Depending on it would re-run this
    // fetch on unrelated churn. Same pattern as loadTeams in
    // components/pages/team.tsx:121.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const loadReport = useCallback(async (teamId: string, r: TeamReportRange) => {
    setReportFailed(false);
    try {
      const data = await store.getTeamReport(teamId, r);
      setReport(data);
    } catch {
      setReportFailed(true);
    }
    // `store` is deliberately excluded — see loadTeam above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (team) loadReport(team.id, range);
  }, [team, range, loadReport]);

  if (teamFailed) {
    return (
      <EmptyStateCard
        icon={BarChart3}
        title="Couldn't load your team"
        description="Something went wrong loading your team information. Please try again."
        primaryCTA={{ label: "Try again", onClick: loadTeam }}
      />
    );
  }

  if (!team) return <PageSkeleton rows={4} />;

  if (reportFailed) {
    return (
      <EmptyStateCard
        icon={BarChart3}
        title="Couldn't load this report"
        description="Something went wrong loading your team's report. Please try again."
        primaryCTA={{ label: "Try again", onClick: () => loadReport(team.id, range) }}
      />
    );
  }

  if (!report) return <PageSkeleton rows={4} />;

  const lastBucket = report.series[report.series.length - 1];
  const dataBeginsLabel = formatLongDate(report.range.dataBegins);
  const rangeEndLabel = lastBucket
    ? formatLongDate(lastBucket.bucket)
    : dataBeginsLabel;

  // Strict > only — equal means there's no gap, and the caption must not
  // appear at all in that case (a caption that fires when there's nothing
  // to explain contradicts the chart above it just as badly as omitting it
  // when there IS a gap).
  const hasCompletionsGap = report.range.completionsBegin > report.range.dataBegins;
  const completionsBeginLabel = formatLongDate(report.range.completionsBegin);

  const csvHref = `${API_BASE}/teams/${team.id}/reports/export.csv?range=${range}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Since {dataBeginsLabel} through {rangeEndLabel}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as TeamReportRange)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RANGE_LABELS) as TeamReportRange[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RANGE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <a
            href={csvHref}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
        </div>
      </div>

      {hasCompletionsGap && (
        <p className="text-sm text-muted-foreground">
          Completions before {completionsBeginLabel} weren&apos;t reliably dated, so
          courses and paths finished before then are an undercount — at least this
          many finished, possibly more.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card data-testid="report-seats">
          <CardContent className="pt-5">
            <p className="text-2xl font-bold tabular-nums">
              {report.seats.used} of {report.seats.total}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Seats used
            </p>
          </CardContent>
        </Card>
        {(Object.keys(report.totals) as (keyof TeamReportTotals)[]).map((metric) => (
          <StatTile
            key={metric}
            metric={metric}
            value={report.totals[metric]}
            change={report.change[metric]}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SPARKLINE_METRICS.map((metric) => (
          <Card key={metric}>
            <CardContent className="pt-5">
              <p className="text-sm font-medium">{METRIC_LABELS[metric]}</p>
              <ReportSparkline data={report.series} metric={metric} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
