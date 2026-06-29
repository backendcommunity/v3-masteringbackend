// lib/mock-interview-demo-script.ts
// Deterministic, backend-free content for the Mock Interview walkthrough demo.
import type { ChatInterviewTemplate, ChatMessage } from "@/lib/store";
import type { ReportData } from "@/components/pages/mock-interviews/chat/result-card";

export const DEMO_TEMPLATE: ChatInterviewTemplate = {
  id: "demo-backend-engineer",
  name: "Backend Engineer Interview",
  position: "Backend Engineer",
  company: "Acme Pay",
  category: "Backend",
  seniority: "Mid-Level",
  difficulty: "Medium",
  duration: 15,
  questions: 3,
  topics: ["APIs", "Databases", "System Design"],
  format: "Chat",
  style: "Technical",
  description: "A guided taste of a real Mastering Backend mock interview.",
};

// Ordered AI question / candidate answer pairs. Even indexes are AI, odd are user.
export const DEMO_TURNS: Array<{ role: "ai" | "user"; content: string }> = [
  { role: "ai", content: "Welcome! Let's start. How would you design a rate limiter for a public payments API?" },
  { role: "user", content: "I'd use a token-bucket per API key in Redis: each key has a bucket that refills at a fixed rate, and every request consumes a token. If the bucket is empty I return 429 with a Retry-After header." },
  { role: "ai", content: "Good. How do you keep that correct when the API runs across many servers?" },
  { role: "user", content: "Centralize the counter in Redis so all instances share one source of truth, and make the check-and-decrement atomic with a Lua script to avoid races under concurrency." },
  { role: "ai", content: "Last one: how would you let trusted partners burst above the limit safely?" },
  { role: "user", content: "Give partner keys a larger bucket and a higher refill rate, and add a short-lived burst allowance on top of the steady rate so occasional spikes pass while sustained abuse still gets throttled." },
];

export const DEMO_REPORT: ReportData = {
  overallScore: 82,
  result: "Strong Pass",
  grade: "Good",
  summary:
    "Clear, well-structured answers with strong fundamentals on distributed rate limiting. Tighten up on failure modes and observability to reach senior level.",
  technicalScore: 85,
  communicationScore: 80,
  problemSolvingScore: 81,
  topicBreakdown: [
    { topic: "APIs", score: 86, feedback: "Solid grasp of HTTP semantics (429 + Retry-After)." },
    { topic: "Databases", score: 84, feedback: "Good use of Redis + atomic Lua for correctness." },
    { topic: "System Design", score: 78, feedback: "Covered scale-out; could discuss fallback when Redis is down." },
  ],
  questionAnalysis: [
    { question: "Design a rate limiter for a public payments API.", userAnswer: "Token-bucket per API key in Redis...", score: 84, feedback: "Right pattern, well justified." },
    { question: "Keep it correct across many servers.", userAnswer: "Centralized Redis counter + atomic Lua...", score: 86, feedback: "Nailed the concurrency concern." },
    { question: "Let trusted partners burst safely.", userAnswer: "Larger bucket + burst allowance...", score: 76, feedback: "Good instinct; quantify the burst window." },
  ],
  strengths: [
    "Strong distributed-systems fundamentals",
    "Communicates trade-offs clearly",
    "Reaches for the right primitives (Redis, atomic ops)",
  ],
  weaknesses: [
    "Light on failure modes (what if Redis is unavailable?)",
    "Didn't mention metrics/alerting for throttling",
  ],
  recommendations: [
    { title: "Practice resilience design", description: "Add graceful degradation when the shared store is down.", resources: ["Course: Scalable Backend Systems"] },
    { title: "Instrument everything", description: "Discuss metrics, dashboards, and alerts for rate-limit events." },
  ],
  interview: { title: "Backend Engineer Interview", position: "Backend Engineer", company: "Acme Pay", difficulty: "Medium", duration: 15 },
};

let seq = 0;
/** Stamp a scripted turn into a full ChatMessage. questionIndex = the AI question it belongs to. */
export function buildDemoMessage(
  turn: { role: "ai" | "user"; content: string },
  index: number,
): ChatMessage {
  // AI turns are at even indexes; each Q+A pair shares a questionIndex.
  const questionIndex = Math.floor(index / 2);
  seq += 1;
  return {
    id: `demo-${index}-${seq}`,
    role: turn.role,
    content: turn.content,
    timestamp: new Date(0).toISOString(),
    questionIndex,
    isQuestion: turn.role === "ai",
  };
}
