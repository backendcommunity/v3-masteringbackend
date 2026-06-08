"use client";
import { PathSession } from "@/lib/path-types";

export function PathRail({
  session,
  currentStepId,
  onSelectStep,
}: {
  session: PathSession;
  currentStepId?: string;
  onSelectStep: (id: string) => void;
}) {
  return (
    <aside className="w-80 shrink-0 border-r overflow-y-auto p-4 space-y-1">
      {session.steps.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelectStep(s.id)}
          className={`block w-full text-left text-sm p-2 rounded ${
            s.id === currentStepId ? "bg-muted" : ""
          }`}
        >
          {s.title}
        </button>
      ))}
    </aside>
  );
}
