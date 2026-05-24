"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Users, Calendar } from "lucide-react";
import type { PortfolioBootcamp } from "@/lib/portfolio-types";

interface PortfolioBootcampsProps {
  bootcamps: PortfolioBootcamp[];
}

const STATUS_STYLES: Record<
  PortfolioBootcamp["status"],
  { label: string; className: string }
> = {
  completed: {
    label: "Completed",
    className: "bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-[#13AECE]/10 text-[#13AECE] border-[#13AECE]/20",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-[#F2C94C]/10 text-[#F2C94C] border-[#F2C94C]/20",
  },
};

export function PortfolioBootcamps({ bootcamps }: PortfolioBootcampsProps) {
  if (!bootcamps.length) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Bootcamps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bootcamps.map((bc) => {
          const style = STATUS_STYLES[bc.status];
          return (
            <div
              key={bc.id}
              className="rounded-lg border p-3.5 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{bc.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {bc.cohortName}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${style.className}`}
                >
                  {style.label}
                </Badge>
              </div>

              {/* Progress (in_progress only) */}
              {bc.status === "in_progress" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium tabular-nums">
                      {bc.completionPercent}%
                    </span>
                  </div>
                  <Progress value={bc.completionPercent} className="h-1.5" />
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                {bc.score > 0 && (
                  <span className="font-medium text-foreground">
                    Score: {bc.score}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  #{bc.peerRank}/{bc.totalPeers}
                </span>
                <span>
                  {Math.round(bc.attendanceRate)}% attendance
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {bc.startedAt ? new Date(bc.startedAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  }) : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
