"use client";
import {
  Play,
  FileText,
  Brain,
  Code2,
  FolderGit2,
  Mic,
  GraduationCap,
  Link2,
  CheckCircle2,
  Lock,
  Circle,
} from "lucide-react";
import { PathSessionStep, PathStepType } from "@/lib/path-types";

const ICONS: Record<PathStepType, React.ComponentType<{ className?: string }>> =
  {
    VIDEO: Play,
    ARTICLE: FileText,
    QUIZ: Brain,
    EXERCISE: Code2,
    PROJECT: FolderGit2,
    MOCK_INTERVIEW: Mic,
    BOOTCAMP: GraduationCap,
    RESOURCE: Link2,
  };

const TILE_TINT: Record<PathStepType, string> = {
  VIDEO: "bg-primary/15 text-primary",
  ARTICLE: "bg-slate-500/15 text-slate-300",
  QUIZ: "bg-[#F2C94C]/15 text-[#F2C94C]",
  EXERCISE: "bg-[#347474]/20 text-[#5fb0b0]",
  PROJECT: "bg-[#EB5757]/15 text-[#EB5757]",
  MOCK_INTERVIEW: "bg-[#2D9CDB]/15 text-[#2D9CDB]",
  BOOTCAMP: "bg-[#F2C94C]/15 text-[#F2C94C]",
  RESOURCE: "bg-muted text-muted-foreground",
};

export function StepRow({
  step,
  active,
  onSelect,
}: {
  step: PathSessionStep;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = ICONS[step.type] ?? Circle;
  const locked = !step.access.allowed;
  const done = step.status === "DONE";

  const tileClass = done
    ? "bg-[#347474]/20 text-[#5fb0b0]"
    : locked
      ? "bg-muted text-muted-foreground"
      : (TILE_TINT[step.type] ?? "bg-muted text-muted-foreground");

  return (
    <button
      onClick={onSelect}
      className={`group flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg transition-all
        ${
          active
            ? "bg-primary/15 border-l-2 border-primary glow-subtle font-semibold"
            : "hover:bg-primary/10"
        }
        ${locked ? "opacity-60" : ""}
        ${
          step.recommended && !active && !locked
            ? "ring-1 ring-primary/60 pulse-animation"
            : ""
        }`}
    >
      <span
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${tileClass}`}
      >
        {done ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : locked ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </span>
      <span className="truncate flex-1 text-[13px]">{step.title}</span>
      {step.score != null && step.type === "QUIZ" && (
        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {step.score}%
        </span>
      )}
    </button>
  );
}
