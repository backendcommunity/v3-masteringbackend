"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { TeamMemberProgress } from "@/lib/data";

/**
 * One member's detail.
 *
 * Mock interviews appear as COUNTS and nothing else. Scores, transcripts and
 * feedback are never sent by the backend, and nothing here should ever ask for
 * them — see the privacy boundary in the spec.
 */
export function MemberProgressSheet({
  teamId,
  memberId,
  open,
  onOpenChange,
}: {
  teamId: string;
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useAppStore();
  const [progress, setProgress] = useState<TeamMemberProgress | null>(null);

  useEffect(() => {
    if (!open || !memberId) {
      setProgress(null);
      return;
    }
    let cancelled = false;
    store
      .getTeamMemberProgress(teamId, memberId)
      .then((p) => {
        if (!cancelled) setProgress(p);
      })
      .catch(() => {
        if (!cancelled) onOpenChange(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, memberId, teamId, store, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {!progress ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{progress.user.name ?? progress.user.email}</DialogTitle>
              <DialogDescription>
                {progress.stats.lastActivityAt
                  ? `Last active ${formatDate(progress.stats.lastActivityAt)}`
                  : "Hasn't started yet"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Points" value={progress.stats.points} />
              <Stat label="Streak" value={progress.stats.currentStreak} />
              <Stat label="Level" value={progress.stats.level} />
            </div>

            <Section title="Courses">
              {progress.courses.length === 0 ? (
                <Empty>No courses started.</Empty>
              ) : (
                progress.courses.map((c) => (
                  <Row key={c.id} label={c.title}>
                    {c.isCompleted ? (
                      <Badge variant="secondary">Completed</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">In progress</span>
                    )}
                  </Row>
                ))
              )}
            </Section>

            <Section title="Paths">
              {progress.paths.length === 0 ? (
                <Empty>No paths started.</Empty>
              ) : (
                progress.paths.map((p) => (
                  <Row key={p.id} label={p.title}>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {p.completedItems} of {p.totalItems}
                    </span>
                  </Row>
                ))
              )}
            </Section>

            <Section title="Projects">
              {progress.projects.length === 0 ? (
                <Empty>No projects started.</Empty>
              ) : (
                progress.projects.map((p) => (
                  <Row key={p.id} label={p.title}>
                    {p.isCompleted && p.completedAt ? (
                      <Badge variant="secondary">
                        Completed {formatDate(p.completedAt)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">In progress</span>
                    )}
                  </Row>
                ))
              )}
            </Section>

            <Section title="Practice">
              <Row label="Quizzes passed">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {progress.quizzes.passed} of {progress.quizzes.taken}
                </span>
              </Row>
              <Row label="Mock interviews taken">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {progress.mockInterviews.completed}
                </span>
              </Row>
            </Section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <span className="min-w-0 truncate text-sm">{label}</span>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-1 text-sm text-muted-foreground">{children}</p>;
}
