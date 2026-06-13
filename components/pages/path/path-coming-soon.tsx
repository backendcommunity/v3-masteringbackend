"use client";
import { Code2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Placeholder shown for in-path step types whose embedded experience isn't
 * shipped yet (exercise IDE, project playground). Lets the learner skip ahead
 * so a not-yet-ready step never blocks path progression.
 */
export function PathComingSoon({
  kind,
  onSkip,
}: {
  kind: "exercise" | "project";
  onSkip: () => void;
}) {
  const copy =
    kind === "exercise"
      ? {
          Icon: Code2,
          title: "Interactive exercise",
          body: "The in-path exercise editor is coming soon. Skip ahead for now and keep your momentum — you can revisit it once it ships.",
        }
      : {
          Icon: FlaskConical,
          title: "Project playground",
          body: "The in-path project playground is coming soon. Skip ahead for now and keep building — you can revisit it once it ships.",
        };
  const { Icon } = copy;

  return (
    <div className="h-full min-h-0 w-full flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="eyebrow-mono text-muted-foreground mb-1.5">
          coming soon
        </div>
        <h2 className="text-lg font-bold">{copy.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {copy.body}
        </p>
        <Button onClick={onSkip} className="mt-6 w-full">
          Skip for now
        </Button>
      </div>
    </div>
  );
}
