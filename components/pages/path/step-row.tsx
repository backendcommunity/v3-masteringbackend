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
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
        ${active ? "bg-muted font-semibold" : "hover:bg-muted/40"}
        ${step.recommended && !active ? "ring-1 ring-[#13AECE]" : ""}`}
    >
      <span className="shrink-0">
        {step.status === "DONE" ? (
          <CheckCircle2 className="w-4 h-4 text-[#347474]" />
        ) : locked ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Icon className="w-4 h-4 text-muted-foreground" />
        )}
      </span>
      <span className="truncate flex-1">{step.title}</span>
      {step.score != null && step.type === "QUIZ" && (
        <span className="text-[10px] text-muted-foreground">{step.score}%</span>
      )}
    </button>
  );
}
