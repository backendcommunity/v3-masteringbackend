import { describe, it, expect } from "vitest";
import {
  DEMO_TEMPLATE,
  DEMO_TURNS,
  DEMO_REPORT,
  buildDemoMessage,
} from "@/lib/mock-interview-demo-script";

describe("mock interview demo script", () => {
  it("has a template with a question count and starts with an AI turn", () => {
    expect(DEMO_TEMPLATE.questions).toBeGreaterThan(0);
    expect(DEMO_TURNS[0].role).toBe("ai");
  });
  it("alternates AI/user turns", () => {
    DEMO_TURNS.forEach((t, i) => {
      expect(t.role).toBe(i % 2 === 0 ? "ai" : "user");
    });
  });
  it("has a complete report shape", () => {
    expect(DEMO_REPORT.overallScore).toBeGreaterThan(0);
    expect(DEMO_REPORT.overallScore).toBeLessThanOrEqual(100);
    expect(DEMO_REPORT.strengths?.length).toBeGreaterThan(0);
    expect(DEMO_REPORT.recommendations?.length).toBeGreaterThan(0);
  });
  it("builds a ChatMessage with the right role and index", () => {
    const m = buildDemoMessage(DEMO_TURNS[1], 1);
    expect(m.role).toBe("user");
    expect(m.questionIndex).toBe(0); // user answer to first question
    expect(typeof m.id).toBe("string");
  });
});
