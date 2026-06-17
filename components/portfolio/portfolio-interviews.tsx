"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Clock, Target } from "lucide-react";
import type { PortfolioMockInterviews } from "@/lib/portfolio-types";

interface PortfolioInterviewsProps {
  mockInterviews: PortfolioMockInterviews;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#27AE60";
  if (score >= 60) return "#F2C94C";
  return "#ef4444";
}

export function PortfolioInterviews({
  mockInterviews,
}: PortfolioInterviewsProps) {
  if (mockInterviews.totalInterviews === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Mock Interview Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <Mic className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-2xl font-bold tabular-nums">
              {mockInterviews.totalInterviews}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Interviews
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <Target className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: getScoreColor(mockInterviews.averageScore) }}
            >
              {mockInterviews.averageScore}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Avg Score
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <Clock className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-2xl font-bold tabular-nums">
              {mockInterviews.practicedHours}h
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Practice
            </p>
          </div>
        </div>

        {/* Strengths */}
        {mockInterviews.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Key Strengths</h4>
            <div className="flex flex-wrap gap-1.5">
              {mockInterviews.strengths.map((strength) => (
                <Badge
                  key={strength}
                  className="bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/20 hover:bg-[#27AE60]/15 text-xs"
                  variant="outline"
                >
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Interview styles */}
        {mockInterviews.practiceTemplates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Interview Styles</h4>
            <div className="flex flex-wrap gap-1.5">
              {mockInterviews.practiceTemplates.map((template) => (
                <Badge key={template} variant="outline" className="text-xs">
                  {template}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
