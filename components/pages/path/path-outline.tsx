"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  Lock,
  Play,
  Circle,
  FileText,
  Brain,
  Code2,
  FolderGit2,
  Mic,
  GraduationCap,
  Link2,
} from "lucide-react";
import { PathSession, PathSessionStep, PathStepType } from "@/lib/path-types";

const TYPE_LABEL: Record<PathStepType, string> = {
  VIDEO: "Video",
  ARTICLE: "Article",
  QUIZ: "Skill Assessment",
  EXERCISE: "Coding Exercise",
  PROJECT: "Project",
  MOCK_INTERVIEW: "Mock Interview",
  BOOTCAMP: "Live Workshop",
  RESOURCE: "Resource",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_ICON: Record<PathStepType, any> = {
  VIDEO: Play,
  ARTICLE: FileText,
  QUIZ: Brain,
  EXERCISE: Code2,
  PROJECT: FolderGit2,
  MOCK_INTERVIEW: Mic,
  BOOTCAMP: GraduationCap,
  RESOURCE: Link2,
};

function StatusIcon({
  step,
  active,
}: {
  step: PathSessionStep;
  active: boolean;
}) {
  if (step.status === "DONE")
    return <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#347474]" />;
  if (!step.access.allowed)
    return <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
  if (active) return <Play className="h-4 w-4 flex-shrink-0 text-primary" />;
  const Icon = TYPE_ICON[step.type] ?? Circle;
  return <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />;
}

// Split a course group's members into chapter sections, preserving compiled
// order. Consecutive steps sharing a chapterId fold into one section; steps
// with no chapter (course-level quizzes/projects) form null-chapter sections
// that render flat. A course with no chapter metadata yields a single
// null-chapter section — identical to the old flat list.
type ChapterSection = {
  chapterId: string | null;
  chapterTitle: string | null;
  steps: PathSessionStep[];
};

function toChapterSections(members: PathSessionStep[]): ChapterSection[] {
  const sections: ChapterSection[] = [];
  members.forEach((s) => {
    const chapterId = s.chapterId ?? null;
    const last = sections[sections.length - 1];
    if (last && last.chapterId === chapterId) {
      last.steps.push(s);
    } else {
      sections.push({
        chapterId,
        chapterTitle: s.chapterTitle ?? null,
        steps: [s],
      });
    }
  });
  return sections;
}

function renderStep(
  s: PathSessionStep,
  active: boolean,
  onSelectStep: (id: string) => void,
) {
  return (
    <button
      key={s.id}
      type="button"
      data-path-active={active ? "true" : undefined}
      onClick={() => onSelectStep(s.id)}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-foreground hover:bg-muted/50"
      }`}
    >
      <StatusIcon step={s} active={active} />
      <span className="flex-1 truncate">{s.title}</span>
      {s.score != null && s.type === "QUIZ" && (
        <span className="text-[10px] text-muted-foreground">{s.score}%</span>
      )}
    </button>
  );
}

export function PathOutline({
  session,
  currentStepId,
  onSelectStep,
  groupLabel = "Course",
}: {
  session: PathSession;
  currentStepId?: string;
  onSelectStep: (id: string) => void;
  // Label on each group chip. Path groups are courses ("Course"); course groups
  // are chapters ("Chapter").
  groupLabel?: string;
}) {
  const stepById = new Map(session.steps.map((s) => [s.id, s]));
  const groupStateById = new Map(session.groupsState.map((g) => [g.id, g]));
  const groupedIds = new Set(session.groups.flatMap((g) => g.stepIds));

  type Item = {
    key: string;
    order: number;
    kind: "course" | "step";
    group?: PathSession["groups"][number];
    step?: PathSessionStep;
  };

  const items: Item[] = [];
  session.groups.forEach((g) => {
    const members = g.stepIds
      .map((id) => stepById.get(id))
      .filter(Boolean) as PathSessionStep[];
    const order = members.length
      ? Math.min(...members.map((s) => s.order))
      : 0;
    items.push({ key: `g-${g.id}`, order, kind: "course", group: g });
  });
  session.steps
    .filter((s) => !groupedIds.has(s.id))
    .forEach((s) =>
      items.push({ key: `s-${s.id}`, order: s.order, kind: "step", step: s }),
    );
  items.sort((a, b) => a.order - b.order);

  let courseNum = 0;

  return (
    <div className="relative px-3 py-3 sm:px-4">
      {/* Timeline line */}
      <div className="absolute left-[1.375rem] top-5 bottom-5 w-px bg-border sm:left-[1.625rem]" />

      <div className="space-y-3">
        {items.map((item) => {
          if (item.kind === "course" && item.group) {
            courseNum += 1;
            const g = item.group;
            const gs = groupStateById.get(g.id);
            const done = gs?.status === "DONE";
            const members = g.stepIds
              .map((id) => stepById.get(id))
              .filter(Boolean) as PathSessionStep[];
            const hasActive = g.stepIds.includes(currentStepId ?? "");

            return (
              <div key={item.key} className="flex items-start gap-3">
                <div
                  className={`relative z-10 mt-4 h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-background ${
                    done ? "bg-[#347474]" : "bg-foreground/20"
                  }`}
                />
                <div className="flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={hasActive ? "c" : undefined}
                  >
                    <AccordionItem value="c" className="border-0">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/10">
                        <div className="flex-1 space-y-1.5 pr-2 text-left">
                          <span className="inline-block rounded-full bg-muted-foreground/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                            {groupLabel}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                              {String(courseNum).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-bold leading-snug">
                              {g.title}
                            </span>
                          </div>
                          {gs && (
                            <span className="block text-[11px] text-muted-foreground">
                              {gs.progressPct}% complete
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2 pt-0">
                        <div className="space-y-0.5 border-t pt-2">
                          {toChapterSections(members).map((sec, i) =>
                            sec.chapterId ? (
                              <div key={`ch-${sec.chapterId}-${i}`} className="pt-1">
                                <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                  {sec.chapterTitle}
                                </div>
                                {sec.steps.map((s) =>
                                  renderStep(s, s.id === currentStepId, onSelectStep),
                                )}
                              </div>
                            ) : (
                              sec.steps.map((s) =>
                                renderStep(s, s.id === currentStepId, onSelectStep),
                              )
                            ),
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            );
          }

          // Standalone step — clickable card
          const s = item.step!;
          const active = s.id === currentStepId;
          const done = s.status === "DONE";
          return (
            <div key={item.key} className="flex items-start gap-3">
              <div
                className={`relative z-10 mt-4 h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-background ${
                  done
                    ? "bg-[#347474]"
                    : active
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                }`}
              />
              <button
                type="button"
                data-path-active={active ? "true" : undefined}
                onClick={() => onSelectStep(s.id)}
                className={`flex-1 overflow-hidden rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/30 ${
                  active ? "ring-1 ring-primary" : ""
                }`}
              >
                <span className="inline-block rounded-full bg-muted-foreground/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {TYPE_LABEL[s.type]}
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusIcon step={s} active={active} />
                  <span className="text-sm font-bold leading-snug">
                    {s.title}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
