"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderGit2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Loader2,
  Check,
  ListChecks,
  Sparkles,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StepSkeleton } from "@/components/pages/path/step-skeleton";
import { useAppStore } from "@/lib/store";
import { useUser } from "@/hooks/use-user";
import { ArticleBlocks } from "@/components/pages/path/path-article";
import { KapTutorPanel } from "@/components/pages/kap/kap-tutor-panel";

type Task = {
  id: string;
  title: string;
  description?: string;
  blocks?: any[];
  mb?: number;
};
type ProjectTaskGroup = { id?: string; title?: string; tasks?: Task[] };
type UserTask = { taskId: string; isCompleted: boolean };


// Project tasks in the PLAYGROUND layout — a resizable left rail with
// "Tasks" / "Kap" segmented tabs and a main content pane. No editor, terminal,
// preview, or file explorer. Tasks tab navigates the project's tasks; Kap tab is
// the guidance assistant; the main pane renders the selected task via the shared
// article block component. Used in BOTH the in-path project step and the
// standalone /projects/[slug]/tasks page. `projectId` is a project id (path step)
// OR slug (standalone) — the project + task endpoints resolve either.
export function PathProjectTasks({
  projectId,
  onComplete,
  onNavigate,
  backHref,
  onProjectLoaded,
  onViewCertificate,
  onProgress,
}: {
  projectId: string;
  // Path step: advance the path. Standalone: omit (a "Back to project" shows).
  onComplete?: () => void;
  onNavigate?: (path: string) => void;
  backHref?: string;
  // Standalone only: once every task is done, the last-task footer offers the
  // project certificate instead of "Back to project".
  onViewCertificate?: () => void;
  // Reports the points accumulated by building this project (sum of completed
  // tasks' `mb`), reactively as tasks are marked done — host renders it in the
  // top nav.
  onProgress?: (info: { earnedPoints: number; totalPoints: number }) => void;
  // Fired once the project loads, so a host (e.g. the route's breadcrumb) can
  // show its title without a second fetch.
  onProjectLoaded?: (project: { title?: string }) => void;
}) {
  const store = useAppStore();
  const user = useUser();
  const [project, setProject] = useState<any>(null);
  const [groups, setGroups] = useState<ProjectTaskGroup[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [railTab, setRailTab] = useState<"tasks" | "kap">("tasks");

  // Resizable rail (drag the divider) — mirrors the playground's flex-basis drag.
  const [railW, setRailW] = useState(350);
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = railW;
    document.body.style.userSelect = "none";
    const move = (ev: MouseEvent) =>
      setRailW(Math.min(460, Math.max(240, startW + ev.clientX - startX)));
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const p = await store.getProject(projectId);
        if (!active) return;
        setProject(p);
        onProjectLoaded?.(p);
        const gs: ProjectTaskGroup[] = p?.projectTasks ?? [];
        setGroups(gs);
        setUserTasks(p?.userProject?.userTasks ?? []);
        setSelectedId(gs.flatMap((g) => g.tasks ?? [])[0]?.id ?? "");
      } catch {
        if (active) setProject(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const allTasks = useMemo(() => groups.flatMap((g) => g.tasks ?? []), [groups]);
  const isDone = (taskId: string) =>
    userTasks.some((u) => u.taskId === taskId && u.isCompleted);
  const doneCount = allTasks.filter((t) => isDone(t.id)).length;
  const total = allTasks.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  // Points accrued by completing tasks (each task's `mb`). Reported up so the
  // host top nav can display it; rises reactively with userTasks.
  const totalPoints = allTasks.reduce((sum, t) => sum + (t.mb ?? 0), 0);
  const earnedPoints = allTasks.reduce(
    (sum, t) => (isDone(t.id) ? sum + (t.mb ?? 0) : sum),
    0,
  );
  useEffect(() => {
    onProgress?.({ earnedPoints, totalPoints });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnedPoints, totalPoints]);

  const selected = allTasks.find((t) => t.id === selectedId);
  const selectedGroup = groups.find((g) =>
    (g.tasks ?? []).some((t) => t.id === selectedId),
  );
  const selectedIdx = allTasks.findIndex((t) => t.id === selectedId);
  const nextTask = selectedIdx >= 0 ? allTasks[selectedIdx + 1] : undefined;

  const mark = async (taskId: string) => {
    if (isDone(taskId) || marking) return;
    setMarking(true);
    setUserTasks((prev) => {
      const exists = prev.some((u) => u.taskId === taskId);
      return exists
        ? prev.map((u) => (u.taskId === taskId ? { ...u, isCompleted: true } : u))
        : [...prev, { taskId, isCompleted: true }];
    });
    try {
      await store.markProjectTaskAsCompleted(projectId, taskId);
      toast.success("Task completed");
    } catch {
      toast.error("Couldn't mark that task. Try again.");
      setUserTasks((prev) =>
        prev.map((u) => (u.taskId === taskId ? { ...u, isCompleted: false } : u)),
      );
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <StepSkeleton />;
  if (!project) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10 text-center text-muted-foreground">
        This project is unavailable right now. Use Next to continue.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* ── Resizable left rail with Tasks / Kap tabs ── */}
      <aside
        className="hidden min-h-0 shrink-0 flex-col border-r border-border bg-muted/20 md:flex"
        style={{ width: railW }}
      >
        {/* seg tabs */}
        <div className="flex gap-1 border-b border-border p-2">
          {[
            { k: "tasks" as const, label: "Tasks", Icon: ListChecks },
            { k: "kap" as const, label: "Kap", Icon: Sparkles },
          ].map(({ k, label, Icon }) => (
            <button
              key={k}
              type="button"
              onClick={() => setRailTab(k)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                railTab === k
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {railTab === "tasks" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border p-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <FolderGit2 className="h-3.5 w-3.5 text-primary" /> Project
              </span>
              <h2 className="mt-1.5 text-sm font-bold leading-snug">
                {project.title}
              </h2>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {doneCount}/{total}
                </span>
              </div>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto p-2">
              {groups.map((group, gi) => (
                <div key={group.id ?? gi} className="mb-3">
                  {group.title && (
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      {group.title}
                    </p>
                  )}
                  {(group.tasks ?? []).map((task) => {
                    const active = task.id === selectedId;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setSelectedId(task.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                          active
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {isDone(task.id) ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        )}
                        <span className="truncate">{task.title}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        )}

        {railTab === "kap" && (
          <div className="pjkap" style={{ height: "100%", minHeight: 0 }}>
            <KapTutorPanel
              scope="project"
              projectId={project?.id}
              taskId={selectedId || undefined}
              title={project?.title}
              intro="Hi — I'm Kap. I'll point you in the right direction, but I won't write the code for you. Ask about the task, an error, or what's failing."
              starterPrompts={[
                "Why is my test failing?",
                "How do I return 201?",
                "Give me a hint",
              ]}
            />
          </div>
        )}
      </aside>

      {/* drag handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onMouseDown={startResize}
        className="hidden w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40 md:block"
      />

      {/* ── Main: selected task content (no editor) ── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="border-b border-border p-3 md:hidden">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {allTasks.map((t, i) => (
              <option key={t.id} value={t.id}>
                {i + 1}. {t.title}
                {isDone(t.id) ? " ✓" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mx-auto w-full max-w-[760px] px-5 py-8 sm:px-8 sm:py-10">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Task
                  {selectedGroup?.title && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      {selectedGroup.title}
                    </>
                  )}
                  {isDone(selected.id) && (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <span className="text-muted-foreground/50">·</span>
                      <Check className="h-3.5 w-3.5" /> Done
                    </span>
                  )}
                </span>
              </div>
              <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight">
                {selected.title}
              </h1>

              <div className="mt-6">
                <ArticleBlocks
                  content={selected.description}
                  blocks={selected.blocks}
                />
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-7">
                {!isDone(selected.id) ? (
                  <Button onClick={() => mark(selected.id)} disabled={marking} className="gap-1.5">
                    {marking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Mark task complete
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Task completed
                  </span>
                )}

                {nextTask ? (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedId(nextTask.id)}
                    className="gap-1.5"
                  >
                    Next task <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : total > 0 && doneCount === total && onViewCertificate ? (
                  <Button onClick={() => onViewCertificate()} className="gap-1.5">
                    <Award className="h-4 w-4" /> View certificate
                  </Button>
                ) : onComplete ? (
                  <Button onClick={() => onComplete()} className="gap-1.5">
                    Continue path <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : backHref && onNavigate ? (
                  <Button
                    onClick={() => onNavigate(backHref)}
                    className="gap-1.5"
                  >
                    Back to project <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-[15px] text-muted-foreground">
              This project has no tasks yet. Use Next to continue.
            </p>
          )}
        </div>
      </main>

      {/* Kap panel styling — replicated verbatim from the playground rail so the
          tab looks identical (vars mapped to the same theme tokens). */}
      <style jsx>{`
        .pjkap {
          --cyan: hsl(var(--mb-blue));
          --cyan-2: hsl(var(--mb-light-blue));
          --panel: hsl(var(--card));
          --panel-2: hsl(var(--secondary));
          --line: hsl(var(--border));
          --text: hsl(var(--foreground));
          --muted: hsl(var(--muted-foreground));
          --gold: #f2c94c;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .pjkap .chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
        }
        .pjkap .chat-b {
          flex: 1;
          overflow: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pjkap .msg {
          display: flex;
          gap: 9px;
          max-width: 92%;
        }
        .pjkap .msg.me {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .pjkap .msg.ai {
          align-self: flex-start;
        }
        .pjkap .msg .av {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          flex: 0 0 26px;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 11px;
          overflow: hidden;
        }
        .pjkap .msg.ai .av {
          background: rgba(19, 174, 206, 0.15);
          color: var(--cyan);
          border: 1px solid rgba(19, 174, 206, 0.3);
        }
        .pjkap .msg.me .av {
          background: var(--panel-2);
          color: var(--muted);
          border: 1px solid var(--line);
        }
        .pjkap .bub {
          padding: 9px 12px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.6;
        }
        .pjkap .msg.ai .bub {
          background: var(--panel);
          border: 1px solid var(--line);
          border-top-left-radius: 3px;
          color: var(--text);
        }
        .pjkap .msg.me .bub {
          background: linear-gradient(135deg, var(--cyan), var(--cyan-2));
          color: #06222b;
          border-top-right-radius: 3px;
          font-weight: 500;
        }
        .pjkap .kapnote {
          display: flex;
          gap: 8px;
          margin: 12px 12px 4px;
          padding: 8px 10px;
          border-radius: 9px;
          font-size: 11.5px;
          line-height: 1.5;
          color: #e3c77a;
          background: rgba(242, 201, 76, 0.08);
          border: 1px solid rgba(242, 201, 76, 0.25);
        }
        .pjkap .kapnote svg {
          width: 16px;
          height: 16px;
          flex: 0 0 16px;
          margin-top: 1px;
          color: var(--gold);
        }
        .pjkap .kapnote b {
          color: var(--gold);
        }
        .pjkap .sugg {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding: 0 14px 10px;
        }
        .pjkap .sugg button {
          font: inherit;
          font-size: 11.5px;
          color: var(--muted);
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 99px;
          padding: 6px 11px;
          cursor: pointer;
        }
        .pjkap .sugg button:hover {
          color: var(--text);
        }
        .pjkap .kapinput {
          border-top: 1px solid var(--line);
          padding: 8px;
        }
        .pjkap .typing {
          display: flex;
          gap: 4px;
          padding: 2px;
        }
        .pjkap .typing i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--muted);
          animation: pjbounce 1s infinite;
        }
        .pjkap .typing i:nth-child(2) {
          animation-delay: 0.15s;
        }
        .pjkap .typing i:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes pjbounce {
          0%,
          60%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
}
