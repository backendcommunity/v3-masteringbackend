"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PathSession } from "@/lib/path-types";
import { PathMeters } from "./path-meters";
import { StepRow } from "./step-row";

export function PathRail({
  session,
  currentStepId,
  onSelectStep,
}: {
  session: PathSession;
  currentStepId?: string;
  onSelectStep: (id: string) => void;
}) {
  const stepById = new Map(session.steps.map((s) => [s.id, s]));
  const groupedIds = new Set(session.groups.flatMap((g) => g.stepIds));
  const standalone = session.steps.filter((s) => !groupedIds.has(s.id));
  const groupStateById = new Map(session.groupsState.map((g) => [g.id, g]));

  const activeGroup = session.groups.find((g) =>
    g.stepIds.includes(currentStepId ?? ""),
  );

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-sidebar flex flex-col">
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <PathMeters session={session} />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1 no-scrollbar">
          <Accordion
            type="multiple"
            defaultValue={activeGroup ? [activeGroup.id] : []}
          >
            {session.groups.map((g, i) => {
              const gs = groupStateById.get(g.id);
              const isActiveGroup = activeGroup?.id === g.id;
              return (
                <AccordionItem
                  key={g.id}
                  value={g.id}
                  className="border-0 animate-in fade-in slide-in-from-left-2 duration-300"
                  style={{ animationDelay: `${80 + i * 40}ms` }}
                >
                  <AccordionTrigger className="px-3 py-2 hover:no-underline rounded-lg hover:bg-primary/10">
                    <div className="flex items-center justify-between w-full pr-2 gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                            isActiveGroup
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {g.title}
                        </span>
                      </span>
                      {gs && (
                        <span className="badge-level shrink-0 text-[10px]">
                          {gs.progressPct}%
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    {g.stepIds
                      .map((id) => stepById.get(id))
                      .filter(Boolean)
                      .map((s) => (
                        <StepRow
                          key={s!.id}
                          step={s!}
                          active={s!.id === currentStepId}
                          onSelect={() => onSelectStep(s!.id)}
                        />
                      ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          {standalone.map((s, i) => (
            <div
              key={s.id}
              className="animate-in fade-in slide-in-from-left-2 duration-300"
              style={{
                animationDelay: `${80 + (session.groups.length + i) * 40}ms`,
              }}
            >
              <StepRow
                step={s}
                active={s.id === currentStepId}
                onSelect={() => onSelectStep(s.id)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
