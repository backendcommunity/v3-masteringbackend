"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, TrendingUp, AlertCircle, BookOpen } from "lucide-react";

export interface ReportData {
  overallScore: number;
  result: string;
  grade?: string;
  summary?: string;
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  topicBreakdown?: Array<{ topic: string; score: number; feedback: string }>;
  questionAnalysis?: Array<{ question: string; userAnswer: string; score: number; feedback: string }>;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  interview?: { title?: string; position?: string; company?: string; difficulty?: string; duration?: number };
}

interface ResultCardProps {
  data: ReportData;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#4ade80" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl"
        style={{ borderColor: color, color }}
      >
        {score}
      </div>
      <span className="text-[11px] text-muted-foreground mt-1">/ 100</span>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function GradeBadge({ grade, result }: { grade?: string; result: string }) {
  const label = grade || result;
  const color =
    label.toLowerCase().includes("good") || label.toLowerCase().includes("pass")
      ? "bg-green-100 text-green-700 border-green-200"
      : label.toLowerCase().includes("below") || label.toLowerCase().includes("fail")
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-amber-100 text-amber-700 border-amber-200";
  return (
    <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full border", color)}>
      {label}
    </span>
  );
}

export function ResultCard({ data }: ResultCardProps) {
  return (
    <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-3">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">Interview Complete</p>
            <p className="text-[11px] text-muted-foreground">
              {data.interview?.position || data.interview?.title || "Mock Interview"}
              {data.interview?.company ? ` · ${data.interview.company}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GradeBadge grade={data.grade} result={data.result} />
          <ScoreCircle score={data.overallScore} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-3 border-b border-border">
        <ScoreBar label="Technical" score={data.technicalScore ?? 0} />
        <ScoreBar label="Communication" score={data.communicationScore ?? 0} />
        <ScoreBar label="Problem Solving" score={data.problemSolvingScore ?? 0} />
        {data.topicBreakdown?.[0] && (
          <ScoreBar label={data.topicBreakdown[0].topic} score={data.topicBreakdown[0].score} />
        )}
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-9 px-4 gap-2 justify-start">
          <TabsTrigger value="overview" className="text-xs h-8 px-3 data-[state=active]:bg-muted rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="detailed" className="text-xs h-8 px-3 data-[state=active]:bg-muted rounded-md">Detailed Feedback</TabsTrigger>
          <TabsTrigger value="skills" className="text-xs h-8 px-3 data-[state=active]:bg-muted rounded-md">Skills Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="px-4 py-3 space-y-3 m-0">
          {data.summary && <p className="text-[12px] text-muted-foreground leading-relaxed">{data.summary}</p>}
          {data.strengths && data.strengths.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Strengths
              </p>
              <ul className="space-y-1">
                {data.strengths.slice(0, 4).map((s, i) => (
                  <li key={i} className="text-[12px] text-foreground flex gap-1.5">
                    <span className="text-emerald-500 flex-shrink-0">·</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.weaknesses && data.weaknesses.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-red-500 mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Key Issues
              </p>
              <ul className="space-y-1">
                {data.weaknesses.slice(0, 4).map((w, i) => (
                  <li key={i} className="text-[12px] text-foreground flex gap-1.5">
                    <span className="text-red-400 flex-shrink-0">·</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
        <TabsContent value="detailed" className="px-4 py-3 m-0">
          {data.questionAnalysis && data.questionAnalysis.length > 0 ? (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {data.questionAnalysis.map((q, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground">Q{i + 1}: {q.question}</p>
                  <p className="text-[11px] text-muted-foreground">{q.feedback}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", q.score >= 70 ? "bg-green-400" : q.score >= 50 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${q.score}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-10 text-right">{q.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">No detailed breakdown available.</p>
          )}
        </TabsContent>
        <TabsContent value="skills" className="px-4 py-3 m-0">
          {data.topicBreakdown && data.topicBreakdown.length > 0 ? (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {data.topicBreakdown.map((t, i) => (
                <div key={i}>
                  <ScoreBar label={t.topic} score={t.score} />
                  {t.feedback && <p className="text-[10px] text-muted-foreground mt-0.5 ml-0.5">{t.feedback}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">No skills breakdown available.</p>
          )}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Recommendations
              </p>
              <ul className="space-y-1">
                {data.recommendations.map((r, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                    <span className="text-primary flex-shrink-0">→</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
