"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAppStore } from "@/lib/store";
import type { AssignmentItem, AssignmentItemState } from "@/lib/data";

const TYPE_LABELS: Record<AssignmentItem["type"], string> = {
  PATH: "Path",
  COURSE: "Course",
  PROJECT: "Project",
  MOCK_INTERVIEW: "Mock interview",
  CHAPTER: "Chapter",
  ARTICLE: "Article",
  VIDEO: "Video",
  TASK: "Task",
  QUIZ: "Quiz",
  EXERCISE: "Exercise",
  CUSTOM: "Task",
};

const STATE_LABELS: Record<AssignmentItemState, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  UNAVAILABLE: "Unavailable",
};

/**
 * A manager's view of one assignment: who has finished, and on what.
 *
 * Open state is driven entirely by `assignmentId` — non-null is open. A
 * failed fetch must NOT close the dialog (that reads as the button doing
 * nothing); it stays open with a retry, the same fix applied twice before in
 * this epic (roster, then overview). `DialogTitle` renders in every branch,
 * loading included — a shadcn `DialogContent` without one is an a11y
 * violation a browser pass caught, not a test.
 */
export function AssignmentDetailDialog({
  teamId,
  assignmentId,
  onOpenChange,
}: {
  teamId: string;
  assignmentId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useAppStore();
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof store.getTeamAssignmentDetail>
  > | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // `store` is deliberately excluded — useAppStore() has no selector, so its
  // identity changes on any set() anywhere in the app (including a nav-bar
  // poll every ten seconds). Depending on it would re-run this fetch on
  // unrelated churn. Same pattern as components/pages/team.tsx:121 and :145,
  // and the fix applied to GroupMembersDialog for the same defect class.
  useEffect(() => {
    if (!assignmentId) {
      setDetail(null);
      setLoadFailed(false);
      return;
    }
    let cancelled = false;
    setLoadFailed(false);
    store
      .getTeamAssignmentDetail(teamId, assignmentId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, assignmentId, reloadToken]);

  const items = detail
    ? [...detail.items].sort((a, b) => a.position - b.position)
    : [];

  return (
    <Dialog open={assignmentId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{detail ? detail.name : "Assignment"}</DialogTitle>
          <DialogDescription>
            {detail
              ? "Who's finished, and what's left."
              : loadFailed
                ? "Couldn't load this assignment."
                : "Loading this assignment…"}
          </DialogDescription>
        </DialogHeader>

        {loadFailed ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load this assignment.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReloadToken((t) => t + 1)}
            >
              Try again
            </Button>
          </div>
        ) : !detail ? (
          <PageSkeleton rows={4} />
        ) : detail.people.length === 0 ? (
          // Reachable, not a bug: an assignment can target a group nobody is
          // currently in. That's "0 of 0", the same as `summarise` reports
          // it elsewhere — a header row over an empty body read as broken,
          // so this says plainly why the table has nothing in it.
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nobody is in this assignment&apos;s audience yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                    Person
                  </th>
                  {items.map((item) => {
                    // Same rule as assignment-card.tsx, and determined the
                    // same way — from `state`, not by inferring from a null
                    // title — so the two surfaces agree: a title when there
                    // is one, "Unavailable" when the catalogue row is gone
                    // (every person shares that state for a given item, so
                    // checking any one of them is enough), and the type name
                    // only as a last resort for a title that's absent for
                    // some other reason.
                    const unavailable =
                      item.type !== "CUSTOM" &&
                      detail.people.some((p) => p.states[item.id] === "UNAVAILABLE");
                    return (
                      <th
                        key={item.id}
                        className="whitespace-nowrap px-2 py-2 text-left font-medium text-muted-foreground"
                      >
                        {item.type === "CUSTOM"
                          ? (item.text ?? "Task")
                          : unavailable
                            ? "Unavailable"
                            : (item.title ?? TYPE_LABELS[item.type])}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {detail.people.map((person) => (
                  <tr key={person.teamMemberId} className="border-b last:border-0">
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{person.name}</span>
                        {person.isOverdue && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {person.done} of {person.total}
                      </p>
                    </td>
                    {items.map((item) => {
                      const state = person.states[item.id];
                      return (
                        <td key={item.id} className="whitespace-nowrap px-2 py-3">
                          <span
                            className={
                              state === "DONE"
                                ? "text-xs font-medium text-green-600 dark:text-green-400"
                                : "text-xs text-muted-foreground"
                            }
                          >
                            {STATE_LABELS[state] ?? "Not started"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
