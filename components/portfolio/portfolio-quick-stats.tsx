"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Brain, Code2, GraduationCap } from "lucide-react";
import type {
  PortfolioQuizExerciseSummary,
  PortfolioBootcamp,
} from "@/lib/portfolio-types";

interface PortfolioQuickStatsProps {
  quizExerciseSummary: PortfolioQuizExerciseSummary;
  bootcamps: PortfolioBootcamp[];
}

export function PortfolioQuickStats({
  quizExerciseSummary,
  bootcamps,
}: PortfolioQuickStatsProps) {
  const completedBootcamps = bootcamps.filter(
    (b) => b.status === "completed",
  ).length;

  const items = [
    {
      icon: Brain,
      label: "Quizzes Passed",
      value: `${quizExerciseSummary.quizzesPassed}/${quizExerciseSummary.quizzesTotal}`,
      sub: `${quizExerciseSummary.quizAvgScore}% avg`,
      color: "#9B59B6",
    },
    {
      icon: Code2,
      label: "Exercises Done",
      value: `${quizExerciseSummary.exercisesCompleted}/${quizExerciseSummary.exercisesTotal}`,
      sub: `${quizExerciseSummary.exerciseAvgScore}% avg`,
      color: "#13AECE",
    },
    {
      icon: GraduationCap,
      label: "Bootcamps",
      value: `${completedBootcamps}`,
      sub:
        bootcamps.length > completedBootcamps
          ? `${bootcamps.length - completedBootcamps} in progress`
          : "completed",
      color: "#27AE60",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items?.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <item.icon className="h-5 w-5" style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums leading-none">
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.label}{" "}
                <span className="opacity-60">&middot; {item.sub}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
