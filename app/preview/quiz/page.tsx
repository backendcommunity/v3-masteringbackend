"use client";

// TEMP preview route for PathQuiz (mock data, self-contained).
// Visit /preview/quiz — toggle Single vs Group. Delete when done; not for prod.
import { useState } from "react";
import { toast } from "sonner";
import { PathQuiz } from "@/components/pages/path/path-quiz";
import { Quiz } from "@/lib/data";
import { PathSessionStep } from "@/lib/path-types";

const SINGLE: Quiz = {
  id: "preview-single",
  title: "Quick Check",
  description: "A one-question knowledge check.",
  timeLimit: 0,
  passingScore: 50,
  attempts: 0,
  maxAttempts: 99,
  completed: false,
  questions: [
    {
      id: "q1",
      question: "Which HTTP method is idempotent and used to fully replace a resource?",
      type: "multiple-choice",
      options: ["POST", "PUT", "PATCH", "CONNECT"],
      correctAnswer: "PUT",
      explanation:
        "PUT replaces the target resource entirely and is idempotent — repeating it yields the same state.",
      points: 10,
    },
  ],
};

const GROUP: Quiz = {
  id: "preview-group",
  title: "Backend Fundamentals",
  description: "Check your understanding of core backend concepts.",
  timeLimit: 10,
  passingScore: 60,
  attempts: 0,
  maxAttempts: 99,
  completed: false,
  questions: [
    {
      id: "q1",
      question: "What does a database index primarily improve?",
      type: "multiple-choice",
      options: ["Write speed", "Read/lookup speed", "Disk usage", "Backup size"],
      correctAnswer: "Read/lookup speed",
      explanation: "Indexes trade extra writes/space for much faster lookups.",
      points: 10,
    },
    {
      id: "q2",
      question: "Which status code means 'created'?",
      type: "multiple-choice",
      options: ["200", "201", "204", "302"],
      correctAnswer: "201",
      explanation: "201 Created signals a new resource was successfully created.",
      points: 10,
    },
    {
      id: "q3",
      question: "Redis is best described as a…",
      type: "multiple-choice",
      options: [
        "Relational database",
        "In-memory key-value store",
        "Message broker only",
        "File system",
      ],
      correctAnswer: "In-memory key-value store",
      explanation: "Redis is an in-memory key-value store (also used for cache/queues).",
      points: 10,
    },
  ],
};

const STEP = { id: "preview-step", type: "QUIZ" } as unknown as PathSessionStep;

export default function QuizPreviewRoute() {
  const [mode, setMode] = useState<"single" | "group">("single");

  return (
    <div
      className="flex h-screen flex-col bg-background"
      style={{ fontFamily: "Satoshi, system-ui, sans-serif", fontSize: "14px" }}
    >
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">PathQuiz preview</span>
        <div className="ml-auto flex gap-1 rounded-lg border border-border p-1">
          {(["single", "group"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <PathQuiz
          key={mode}
          step={STEP}
          quizId={mode}
          quizData={mode === "single" ? SINGLE : GROUP}
          onComplete={(id, payload) =>
            toast.success(`onComplete(${id}) ${JSON.stringify(payload)}`)
          }
        />
      </div>
    </div>
  );
}
