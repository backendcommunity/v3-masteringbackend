"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import type { PathSession, PathSessionStep, PathStepType } from "@/lib/path-types";
import {
  ArrowRight,
  BookOpen,
  Code2,
  FileText,
  GraduationCap,
  Lock,
  Play,
  Rocket,
  Target,
  type LucideIcon,
} from "lucide-react";

interface UpNextPanelProps {
  pathSession: PathSession | null;
  steps: PathSessionStep[];
}

const STEP_META: Record<PathStepType, { Icon: LucideIcon; tint: string }> = {
  QUIZ: { Icon: FileText, tint: "bg-primary" },
  VIDEO: { Icon: Play, tint: "bg-emerald-500" },
  ARTICLE: { Icon: BookOpen, tint: "bg-sky-500" },
  EXERCISE: { Icon: Code2, tint: "bg-amber-500" },
  PROJECT: { Icon: Rocket, tint: "bg-purple-500" },
  MOCK_INTERVIEW: { Icon: Target, tint: "bg-rose-500" },
  BOOTCAMP: { Icon: GraduationCap, tint: "bg-indigo-500" },
  RESOURCE: { Icon: BookOpen, tint: "bg-muted-foreground" },
};

const subFor = (s: PathSessionStep) => {
  if (!s.access.allowed) return s.access.reason || "Locked";
  if (s.recommended) return "Recommended next";
  if (s.status === "IN_PROGRESS") return "In progress";
  return s.type.replace("_", " ").toLowerCase();
};

export function UpNextPanel({ pathSession, steps }: UpNextPanelProps) {
  const router = useRouter();
  const slug = pathSession?.path.slug;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold">Up next in your path</h3>
        {slug && (
          <button
            onClick={() => router.push(routes.pathWorkspace(slug))}
            className="text-xs font-bold text-primary hover:underline"
          >
            See all
          </button>
        )}
      </div>

      {!slug || steps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            No active path yet — start one to see your next moves here.
          </p>
          <button
            onClick={() => router.push(routes.paths)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Browse paths <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {steps.map((s) => {
            const meta = STEP_META[s.type] ?? STEP_META.RESOURCE;
            const locked = !s.access.allowed;
            const Icon = locked ? Lock : meta.Icon;
            return (
              <button
                key={s.id}
                disabled={locked}
                onClick={() =>
                  slug && router.push(routes.pathWorkspace(slug, s.id))
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors",
                  locked
                    ? "cursor-not-allowed opacity-70"
                    : "hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white",
                    locked ? "bg-muted-foreground/60" : meta.tint,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold">{s.title}</div>
                  <div className="truncate text-[11px] capitalize text-muted-foreground">
                    {subFor(s)}
                  </div>
                </div>
                {s.maxPoints > 0 && (
                  <span className="flex-shrink-0 text-[11px] font-extrabold text-primary">
                    +{s.maxPoints} XP
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
