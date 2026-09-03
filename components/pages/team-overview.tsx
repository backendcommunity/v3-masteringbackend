"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Download,
  Flame,
  MoonStar,
  Users,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyStateCard } from "@/components/empty-state-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ReportChart, type ReportChartMetric } from "@/components/team/report-chart";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type {
  TeamGroup,
  TeamOverview,
  TeamReport,
  TeamReportPeriod,
  TeamReportRange,
  TeamReportTotals,
} from "@/lib/data";

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

// The three totals that also have a per-bucket series, and therefore the
// three the chart's metric toggle can offer. `membersWhoFinished` is a
// totals-only figure — `TeamReportBucket` carries no matching field for it,
// so it has a tile above but no line to draw.
const CHART_METRICS: readonly ReportChartMetric[] = [
  "activeMembers",
  "coursesFinished",
  "pathsFinished",
];

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
        {/* The pill rides with the NUMBER, not with the label. Inline with
            the label, a name long enough to wrap ("Members who finished a
            course or path") pushed its pill onto a third line while its
            neighbours' sat on the first, so the row of pills read as ragged
            rather than as one comparable set. Labels wrap last, where a
            wrap costs nothing. */}
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <ChangePill value={change} />
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
          {METRIC_LABELS[metric]}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * The Team Hub landing screen: what the team looks like NOW, and what it did
 * over the last twelve weeks or months.
 *
 * Four numbers, and the one that matters is "stalled" — the point of buying
 * seats is that people use them, and this is the screen that says who isn't.
 * The report below it answers the next question ("did that investment do
 * anything") on the same page, so the two can never disagree by living on
 * two tabs.
 *
 * Three payload facts drive the report half, all documented on `TeamReport`
 * in lib/data.ts:
 *  - `change` is `number | null` — a null pill renders as nothing, never a
 *    fabricated "∞%"/"NaN%"/"0%".
 *  - `range.completionsBegin` can be later than `range.dataBegins`, which
 *    means the completion counters UNDERCOUNT before it (rows never got a
 *    date, not zero of them) — captioned "at least" when that gap exists,
 *    silent when it doesn't.
 *  - `range.to` is exclusive (one bucket past the last rendered one), so the
 *    visible range is built from `dataBegins` and the LAST series bucket,
 *    never from `range.to`.
 *
 * The group filter scopes BOTH halves: the "now" tiles and the report are
 * fetched with the same `groupId`, because a manager who filtered to
 * "Platform" must never read whole-team numbers under Platform's name. Seats
 * are the one deliberate exception — a group does not own seats — and the
 * caption says so out loud rather than leaving the reader to guess.
 */
export function TeamOverviewPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const store = useAppStore();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [teamFailed, setTeamFailed] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewFailed, setOverviewFailed] = useState(false);
  // Two retry tokens, not one. `retryToken` belongs to the overview's own
  // CTAs; `reportRetryToken` belongs to the report's. Sharing one made the
  // report's "Try again" re-issue the overview fetch as well — which
  // unmounted the stat grid, the caption and the stalled callout for a round
  // trip on the happy path, and on an unlucky one let a transient overview
  // error collapse the whole page (`teamFailed || overviewFailed` below),
  // taking the stalled callout AND the report's own error card with it. A
  // report-only failure must have a report-only recovery.
  const [retryToken, setRetryToken] = useState(0);
  const [reportRetryToken, setReportRetryToken] = useState(0);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const prevGroupFilterRef = useRef(groupFilter);

  const [range, setRange] = useState<TeamReportRange>("12w");
  const [report, setReport] = useState<TeamReport | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportFailed, setReportFailed] = useState(false);
  const [metric, setMetric] = useState<ReportChartMetric>("activeMembers");
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  // Monotonic request id. The report endpoint is cached per (team, group,
  // range) for 900 seconds, so the two ranges' response times differ by an
  // order of magnitude: toggling 12m -> 12w can land the slower, abandoned
  // 12m payload LAST, and without this the Select would read "Last 12 weeks"
  // over a chart of monthly buckets. Only the newest request may write state.
  const reportRequestRef = useRef(0);

  // A callback rather than an inline effect body so the failure branch can
  // offer an in-page retry — the shape the Reports screen used before it was
  // folded in here. Re-issuing one request is the honest recovery for one
  // failed request; a full page reload throws away the rest of the session
  // to do it.
  const loadTeam = useCallback(async () => {
    setTeamFailed(false);
    try {
      const teams = await store.getMyTeams();
      const team = teams?.[0];
      if (!team) throw new Error("No team found");
      setTeamId(team.id);
    } catch {
      setTeamFailed(true);
    }
    // `store` is deliberately excluded — useAppStore() has no selector, so
    // its identity changes on any set() anywhere in the app. Depending on it
    // would re-run this fetch on unrelated churn. Same pattern as
    // loadTeams/loadRoster in components/pages/team.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // A failed fetch here used to flip a single `failed` flag that replaced
  // the ENTIRE page, unmounting the group Select along with everything
  // else. That's fine when the unfiltered fetch fails (the team itself is
  // unreachable — see the full-page branch below, unchanged for that case).
  // But the backend 404s a stale `groupId` (the group was renamed/deleted
  // out from under a filtered view), and losing the Select at that exact
  // moment removes the one control that lets the viewer recover by picking
  // "All groups". So a filtered failure only sets `overviewFailed`, which
  // the render below confines to the stats region — the header and Select
  // stay mounted.
  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    setOverviewFailed(false);
    setOverviewLoading(true);
    const gid = groupFilter === "all" ? undefined : groupFilter;
    store
      .getTeamOverview(teamId, gid)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) setOverviewFailed(true);
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, groupFilter, retryToken]);

  // The report is fetched with the SAME group as the tiles above it. A
  // report that stayed whole-team under a "Showing Platform" caption is the
  // single failure this screen exists to avoid — one page must not say two
  // things at once.
  useEffect(() => {
    if (!teamId) return;
    const requestId = ++reportRequestRef.current;
    setReportLoading(true);
    setReportFailed(false);
    setDownloadFailed(false);
    const gid = groupFilter === "all" ? undefined : groupFilter;
    store
      .getTeamReport(teamId, range, gid)
      .then((data) => {
        // The staleness guard, not a `cancelled` flag: switching 12w -> 12m
        // and back leaves two responses in flight, and the slower one must
        // not paint under the newer label. Monotonic id, checked on BOTH
        // the success and failure paths.
        if (requestId === reportRequestRef.current) setReport(data);
      })
      .catch(() => {
        if (requestId === reportRequestRef.current) setReportFailed(true);
      })
      .finally(() => {
        if (requestId === reportRequestRef.current) setReportLoading(false);
      });
    // `store` is deliberately excluded — useAppStore() has no selector, so its
    // identity changes on any set() anywhere in the app, and depending on it
    // here is an unbounded fetch loop. `reportRetryToken`, not `retryToken`:
    // this effect answers to the report's own CTA only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, groupFilter, range, reportRetryToken]);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    store
      .getTeamGroups(teamId)
      .then((g) => {
        if (!cancelled) setGroups(g ?? []);
      })
      .catch(() => {
        // The filter is additive. If groups fail to load the overview still
        // renders — stats without a filter beat an error page.
        if (!cancelled) setGroups([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

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
  const downloadCsv = useCallback(
    async (id: string, r: TeamReportRange, groupId?: string) => {
      setDownloading(true);
      setDownloadFailed(false);
      try {
        const response = await api.get(`/teams/${id}/reports/export.csv`, {
          // The export is scoped to whatever the screen is scoped to: a file
          // of whole-team rows downloaded from a Platform-filtered view
          // would be the same two-things-at-once bug, only harder to spot
          // once it is sitting in a spreadsheet.
          params: groupId ? { range: r, groupId } : { range: r },
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
        // Deferred, not synchronous. Chrome and Firefox start the download
        // during click dispatch so the blob survives an immediate revoke;
        // Safari has a long history of not, and saves nothing. jsdom stubs
        // both createObjectURL and revokeObjectURL, so no test can see this.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        setDownloadFailed(true);
      } finally {
        setDownloading(false);
      }
    },
    [],
  );

  // Adjusting state during render (React's sanctioned pattern for "reset
  // when a value changes") rather than in an effect: an effect fires AFTER
  // the click's own render commits, so for one frame `groupFilter` would
  // already be the new value while `overviewFailed`/`overviewLoading` still
  // described the OLD filter's outcome — the exact flash Finding 3 and
  // Minor 7 both are. Catching the change here means React bails out and
  // re-renders with the reset state before anything paints, so the flash
  // never reaches the screen. `prevGroupFilterRef` tracks what render last
  // saw so this only fires ON the change, not every render.
  //
  // The report's own flags are reset here for the same reason and not a
  // weaker one: its numbers, its failure card and a failed download's alert
  // all describe the group that was selected a moment ago, and any of them
  // sitting under the new group's caption is the same lie.
  //
  // Two of the three are pinned by tests that measure how many commits the
  // switch takes (see "the render-phase reset" in
  // __tests__/team-overview-report.test.tsx). `setReportFailed(false)` is
  // not, and cannot be while it sits below `setReportLoading(true)`: the
  // render below reads `reportLoading ? skeleton : reportFailed ? card`, so
  // a stale failure has no frame in which it is visible. It stays because it
  // becomes load-bearing the moment the loading line above it is removed or
  // the two branches are reordered — do not delete it as unreachable.
  if (groupFilter !== prevGroupFilterRef.current) {
    prevGroupFilterRef.current = groupFilter;
    setOverviewLoading(true);
    setOverviewFailed(false);
    setReportLoading(true);
    setReportFailed(false);
    setDownloadFailed(false);
  }

  // An unfiltered fetch failing means the team itself couldn't be loaded —
  // the whole-page error is still the right read there, same as before.
  if (teamFailed || (overviewFailed && groupFilter === "all")) {
    // `teamFailed` is getMyTeams itself failing, and that case has a real
    // in-page recovery: re-run the one request that failed. The Reports
    // screen offered exactly this and the fold-in absorbed its case into the
    // overview's harder branch, which only ever knew how to reload the tab.
    const retry = teamFailed ? loadTeam : () => window.location.reload();
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couldn&apos;t load your team</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={retry}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!overview) return <PageSkeleton rows={3} />;

  // A denominator is only honest when a subscription is making the claim.
  // `paidSeats: 0` means both "no subscription" and "a subscription that
  // pays for zero seats", and rendering the first as "4 of 0" asserts a
  // figure nobody is asserting — the bug `seatUsage()` added `subscribed`
  // to keep distinguishable. Only an explicit `false` suppresses the
  // denominator: an absent field is an older payload, not a missing plan.
  const noActivePlan = overview.seats.subscribed === false;
  const stats = [
    {
      label: noActivePlan ? "Seats in use \u2014 no active plan" : "Seats used",
      value: noActivePlan
        ? String(overview.seats.used)
        : `${overview.seats.used} of ${overview.seats.paidSeats}`,
      icon: Users,
    },
    { label: "Signed in this week", value: String(overview.activeThisWeek), icon: Flame },
    { label: "Stalled", value: String(overview.stalled), icon: MoonStar },
    { label: "Never started", value: String(overview.neverActive), icon: UserX },
  ];

  const activeGroupName = groups.find((g) => g.id === groupFilter)?.name ?? "one group";
  const overviewReady = !overviewLoading && !overviewFailed;

  // Everything below is derived from the report payload itself, never from
  // the `range` Select: a payload and the control that asked for it can
  // disagree for one frame, and the numbers are the honest source.
  const lastBucket = report?.series[report.series.length - 1];
  const reportWindow: TeamReportRange = report?.range.period === "month" ? "12m" : "12w";
  const dataBeginsLabel = report ? formatLongDate(report.range.dataBegins) : "";
  // The END of the last bucket, not its label. See `bucketEnd`.
  const rangeEndLabel =
    report && lastBucket
      ? formatLongDate(bucketEnd(lastBucket.bucket, report.range.period))
      : dataBeginsLabel;
  // Strict > only — equal means there's no gap, and the caption must not
  // appear at all in that case (a caption that fires when there's nothing
  // to explain contradicts the chart above it just as badly as omitting it
  // when there IS a gap).
  const hasCompletionsGap = !!report && report.range.completionsBegin > report.range.dataBegins;
  const completionsBeginLabel = report ? formatLongDate(report.range.completionsBegin) : "";

  return (
    <div className="space-y-6">
      {/* Only the group filter lives at page level, because only the group
          filter scopes the whole page — it narrows the tiles AND the report.
          The range picker and the CSV button scope the report alone, so they
          sit on the report's own heading row below the divider, next to what
          they change. */}
      {groups.length > 0 && (
        <Select name="group-filter" value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {overviewLoading ? (
        // A filter change keeps stale `overview` figures sitting in state —
        // clearing them would flash empty instead of the previous number,
        // which is no better. Showing a skeleton here rather than the old
        // scope's stats is what stops "Seats used 4 of 6" from reading as
        // Platform's numbers when it's still whole-team data in flight.
        // Same shape as rosterLoading -> PageSkeleton in team.tsx.
        <PageSkeleton rows={3} />
      ) : overviewFailed ? (
        // Reached only when groupFilter !== "all" — the unfiltered failure
        // case already returned the whole-page error above. This reads as
        // the filtered view failing, not the team, and the Select above
        // stays live so picking "All groups" is the recovery path.
        <EmptyStateCard
          icon={AlertTriangle}
          title="Couldn't load this view"
          description="This group may have been renamed or removed since you filtered to it. Switch to All groups, or try again."
          primaryCTA={{ label: "Show all groups", onClick: () => setGroupFilter("all") }}
          secondaryCTA={{ label: "Try again", onClick: () => setRetryToken((t) => t + 1) }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5">
                <s.icon className="mb-2 h-4 w-4 text-muted-foreground" />
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* The caption belongs to the SCOPE, not to the tiles' fetch. Sitting
          inside the tiles' success branch, it vanished whenever the overview
          request failed — leaving a group-scoped report, a group-scoped
          chart and a group-scoped CSV button on screen with nothing saying
          what they were scoped to. Both halves are load-bearing wherever it
          renders: the first says what narrowed — every figure on this screen
          except one is this group's — and the second says what did not.
          Seats are a team-level fact (a group does not own seats), and a
          reader who assumed otherwise would read the tile above as "Platform
          has 4 of 6 seats". */}
      {groupFilter !== "all" && (
        <p className="text-sm text-muted-foreground">
          Showing {activeGroupName}. Seats are counted for the whole team.
        </p>
      )}

      {/* Everything above the divider is the team RIGHT NOW — the tiles, who
          has stalled, and what is still unused. The seats-free line sits with
          the seats tile it refers to rather than at the foot of the page, and
          the stalled callout sits with the "Stalled" tile it acts on. */}
      {overviewReady && overview.stalled > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {overview.stalled === 1
                ? "One person has stopped learning"
                : `${overview.stalled} people have stopped learning`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No activity in the last 14 days. Seats they aren&apos;t using
              are seats someone else could have.
            </p>
            <Button variant="outline" onClick={() => onNavigate(routes.teamMembers)}>
              See who
            </Button>
          </CardContent>
        </Card>
      )}

      {overviewReady && overview.seats.available > 0 && (
        <p className="text-sm text-muted-foreground">
          You have {overview.seats.available}{" "}
          {overview.seats.available === 1 ? "seat" : "seats"} free.{" "}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() => onNavigate(routes.teamMembers)}
          >
            Invite someone
          </button>
        </p>
      )}

      {/* The divider between "right now" and "over time". The two halves
          answer different questions and are counted over different windows —
          the tiles are a snapshot, the report is a trend — so running them
          together as one column of cards invited reading a tile as part of
          the report's window. */}
      <Separator />

      {/* The report's own header, OUTSIDE the loading/failed/success branch
          below. The range picker has to survive both: a cold 12-month window
          can time out while the 12-week one is warm, and switching back is
          the recovery — a picker that unmounts with the failure takes that
          away exactly when it is needed.

          The heading falls back to a neutral "Progress" whenever no report is
          on screen. It cannot use `report` alone, which still holds the
          PREVIOUS window's payload during a range switch: rendering that
          beside the new Select value would put the old window's label under
          the new range, which is the one thing this screen must never do. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            {report && !reportLoading
              ? `Over the ${RANGE_LABELS[reportWindow].toLowerCase()}`
              : "Progress"}
          </h3>
          {report && !reportLoading && (
            <p className="text-sm text-muted-foreground">
              Since {dataBeginsLabel} through {rangeEndLabel}.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            name="range"
            value={range}
            onValueChange={(v) => setRange(v as TeamReportRange)}
          >
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
            onClick={() =>
              teamId &&
              downloadCsv(teamId, range, groupFilter === "all" ? undefined : groupFilter)
            }
            disabled={downloading || !teamId}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* The download alert belongs with the button that produced it. */}
      {downloadFailed && (
        <p role="alert" className="text-sm text-red-600">
          Couldn&apos;t download the CSV. Please try again.
        </p>
      )}

      {/* The report region. Its loading and failure states are confined to
          it: a report that failed must never take down the stalled callout
          above, which is the most valuable line on the screen. */}
      {reportLoading ? (
        <PageSkeleton rows={4} />
      ) : reportFailed ? (
        <EmptyStateCard
          icon={BarChart3}
          title="Couldn't load this report"
          description="Something went wrong loading your team's report. Please try again."
          primaryCTA={{
            label: "Try again",
            onClick: () => setReportRetryToken((t) => t + 1),
          }}
        />
      ) : report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {TOTALS_METRICS.map((m) => (
              <StatTile
                key={m}
                metric={m}
                value={report.totals[m]}
                change={report.change[m]}
              />
            ))}
          </div>

          {/* The toggle and the chart share one card so they read as one
              control and its output, and so the chart sits on the same
              surface as the tiles above it rather than floating on the page
              background. The plot area itself stays transparent — a second
              background behind the Area's translucent gradient fill is what
              makes a chart look muddy. */}
          <Card>
            <CardContent className="space-y-4 pt-5">
              {/* A real group of buttons rather than a Select: three options
                  that are always visible cost one glance, where a Select
                  hides two of them behind a click and hides which one is
                  showing. */}
              <div role="group" aria-label="Chart metric" className="flex flex-wrap gap-2">
                {CHART_METRICS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={metric === m}
                    onClick={() => setMetric(m)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      metric === m
                        ? "border-[#13AECE] bg-[#13AECE]/10 text-[#13AECE]"
                        : "hover:bg-accent",
                    )}
                  >
                    {METRIC_LABELS[m]}
                  </button>
                ))}
              </div>

              <ReportChart
                data={report.series}
                metric={metric}
                period={report.range.period}
                label={METRIC_LABELS[metric]}
              />
            </CardContent>
          </Card>

          {hasCompletionsGap && (
            <p className="text-sm text-muted-foreground">
              Completions before {completionsBeginLabel} weren&apos;t reliably dated, so
              courses and paths finished before then are an undercount — at least this
              many finished, possibly more.
            </p>
          )}
        </div>
      ) : null}

    </div>
  );
}
