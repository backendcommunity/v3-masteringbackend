"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import type {
  TeamReport,
  TeamReportPeriod,
  TeamReportRange,
  TeamReportTotals,
  TeamSummary,
} from "@/lib/data";
import { cn } from "@/lib/utils";

const RANGE_LABELS: Record<TeamReportRange, string> = {
  "12w": "Last 12 weeks",
  "12m": "Last 12 months",
};

// Labels are checked against what team-reports.ts's SQL actually counts, not
// against what the field name suggests — see the doc comments below each.
const METRIC_LABELS: Record<keyof TeamReportTotals, string> = {
  // Distinct members with a genuine (non-notification) Activity row in the
  // bucket — any feed event, including a login, not specifically learning
  // activity. "Active members" doesn't claim more than that.
  activeMembers: "Active members",
  // COUNT(*) of course-completion events in the bucket — an event count,
  // not distinct members (one person finishing two courses counts twice).
  coursesFinished: "Courses finished",
  // Same shape as coursesFinished, for path completions.
  pathsFinished: "Paths finished",
  // COUNT(DISTINCT userId) WHERE kind <> 'activity' — course OR path, not
  // path alone. The earlier "Members who finished a path" label claimed
  // fewer people finished something than the pathsFinished tile right next
  // to it could ever allow (a member who only finished a COURSE still
  // counts here) — this wording covers both.
  membersWhoFinished: "Members who finished a course or path",
};

// The three totals that also have a per-bucket series to chart. `membersWhoFinished`
// is a totals-only figure — `TeamReportBucket` carries no matching field for it.
const SPARKLINE_METRICS = ["activeMembers", "coursesFinished", "pathsFinished"] as const;

// The tile order, declared here rather than taken from `Object.keys(totals)`.
// Key order on a JSON payload is the incidental order of a backend object
// literal: reordering two fields in team-reports.ts's `TeamReportTotals`
// would silently reshuffle this screen, and the reader's eye goes
// engagement -> output -> reach.
const TOTALS_METRICS = [
  "activeMembers",
  "coursesFinished",
  "pathsFinished",
  "membersWhoFinished",
] as const;

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
 * The LAST DAY a bucket covers, from the bucket's own label and the report's
 * period — never from `range.to`.
 *
 * A bucket is labelled by its first day: the Monday of its ISO week, or the
 * 1st of its month. Printing that label as the end of the range said "through
 * 24 August" for a window that runs through the 30th, understating the
 * report's coverage by up to a full bucket. `range.to` is the wrong source for
 * the fix — it is one bucket PAST the last one, so it would overshoot by a
 * whole period — and deriving the day before it would still be reading a field
 * this screen must not print. Computing it from the label keeps both problems
 * out: +6 days for a week, and last-day-of-month for a month, which is a month
 * length rather than a fixed number of days.
 */
function bucketEnd(bucket: string, period: TeamReportPeriod): string {
  const d = new Date(`${bucket}T00:00:00`);
  if (period === "month") {
    // Day 0 of the NEXT month is the last day of this one, for every month
    // length including February in a leap year.
    d.setMonth(d.getMonth() + 1, 0);
  } else {
    d.setDate(d.getDate() + 6);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * The filename out of a `Content-Disposition: attachment; filename="..."`
 * header, or `null` if there isn't one to read.
 *
 * Only the quoted form is handled, which is the only form the export emits.
 * Any path separator in the value is refused rather than sanitised: a
 * filename is a name, and a value that tries to be a path is not one this
 * screen should try to repair.
 */
function filenameFrom(headers: unknown): string | null {
  const raw = (headers as Record<string, string> | undefined)?.["content-disposition"];
  const match = raw?.match(/filename="([^"]+)"/);
  const name = match?.[1];
  if (!name || name.includes("/") || name.includes("\\")) return null;
  return name;
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

  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  // Monotonic request id. The endpoint is cached per (team, range) for 900
  // seconds, so the two ranges' response times differ by an order of
  // magnitude: toggling 12m -> 12w can land the slower, abandoned 12m payload
  // LAST, and without this the Select would read "Last 12 weeks" over a chart
  // of monthly buckets. Only the newest request may write state.
  const requestIdRef = useRef(0);

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
    const id = ++requestIdRef.current;
    setReportFailed(false);
    try {
      const data = await store.getTeamReport(teamId, r);
      // A response for a selection the user has already moved off must be
      // dropped, not rendered under the current label.
      if (id !== requestIdRef.current) return;
      setReport(data);
    } catch {
      if (id !== requestIdRef.current) return;
      setReportFailed(true);
    }
    // `store` is deliberately excluded — see loadTeam above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The CSV export, fetched through the shared axios client rather than
   * followed as a link.
   *
   * A plain `<a href>` to the API origin does carry the cookie (R10's
   * reasoning about a top-level GET navigation is still true), and the happy
   * path worked. The error path did not: on any non-200 the backend replies
   * `res.status(...).json(...)` with no `Content-Disposition`, so the browser
   * NAVIGATES the tab off the SPA and renders raw JSON. 401 is the sharp
   * edge — `lib/api.ts` refreshes an expired token and replays the request,
   * so every other action in the app just works for a manager with a
   * long-open tab, and this one alone dumped them on an error page. The 503
   * `resolveTeamReport` raises on a transaction timeout has the same shape.
   *
   * Going through `api` puts the download behind that same interceptor and
   * keeps a failure inside the page.
   */
  const downloadCsv = useCallback(async (teamId: string, r: TeamReportRange) => {
    setDownloading(true);
    setDownloadFailed(false);
    try {
      const response = await api.get(`/teams/${teamId}/reports/export.csv`, {
        params: { range: r },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      // Prefer the filename the backend built — it carries the team's own
      // slug. Readable cross-origin only because the API names
      // `Content-Disposition` in its CORS `exposedHeaders`; the fallback
      // covers a proxy that strips it rather than saving a file called
      // "export.csv".
      link.download = filenameFrom(response.headers) ?? `team-reports-${r}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
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
  // The END of the last bucket, not its label. See `bucketEnd`.
  const rangeEndLabel = lastBucket
    ? formatLongDate(bucketEnd(lastBucket.bucket, report.range.period))
    : dataBeginsLabel;

  // Strict > only — equal means there's no gap, and the caption must not
  // appear at all in that case (a caption that fires when there's nothing
  // to explain contradicts the chart above it just as badly as omitting it
  // when there IS a gap).
  const hasCompletionsGap = report.range.completionsBegin > report.range.dataBegins;
  const completionsBeginLabel = formatLongDate(report.range.completionsBegin);

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
          <button
            type="button"
            onClick={() => downloadCsv(team.id, range)}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      {downloadFailed && (
        <p role="alert" className="text-sm text-red-600">
          Couldn&apos;t download the CSV. Please try again.
        </p>
      )}

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
            {/* `total` is null for a team with no subscription at all. The
                backend used to send 0 there, which rendered "4 of 0" — a
                denominator no subscription is asserting. A real subscription
                that pays for zero seats still sends 0 and still gets one. */}
            <p className="text-2xl font-bold tabular-nums">
              {report.seats.total === null
                ? report.seats.used
                : `${report.seats.used} of ${report.seats.total}`}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {report.seats.total === null ? "Seats in use \u2014 no active plan" : "Seats used"}
            </p>
          </CardContent>
        </Card>
        {TOTALS_METRICS.map((metric) => (
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
