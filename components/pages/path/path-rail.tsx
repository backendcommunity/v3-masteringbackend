"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
    <aside className="w-80 shrink-0 border-r flex flex-col">
      <PathMeters session={session} />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <Accordion
            type="multiple"
            defaultValue={activeGroup ? [activeGroup.id] : []}
          >
            {session.groups.map((g) => {
              const gs = groupStateById.get(g.id);
              return (
                <AccordionItem key={g.id} value={g.id} className="border-0">
                  <AccordionTrigger className="px-3 py-2 hover:no-underline rounded-lg hover:bg-muted/30">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="text-xs font-bold uppercase tracking-wide truncate">
                        {g.title}
                      </span>
                      {gs && (
                        <Badge variant="outline" className="text-[10px]">
                          {gs.progressPct}%
                        </Badge>
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
          {standalone.map((s) => (
            <StepRow
              key={s.id}
              step={s}
              active={s.id === currentStepId}
              onSelect={() => onSelectStep(s.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
