import { describe, it, expect } from "vitest";
import type { QuizQuestion } from "@/lib/data";
import {
  correctIndexOf,
  correctTextOf,
  isCorrect,
  scoreAttempt,
} from "@/lib/quiz-answers";

/**
 * The shapes below are taken from real rows. 14 of 16 stored quizzes look like
 * `seeded` — an `answer` index and no `points` — and grading them by
 * `correctAnswer` and points alone scored every attempt zero.
 */
const seeded = {
  question: "What best describes horizontal scaling?",
  options: [
    "Adding more CPU and RAM to a single server",
    "Adding more servers and distributing load across them",
    "Compressing data to use less disk",
  ],
  answer: 1,
  explanation: "Scaling out adds machines behind a load balancer.",
} as unknown as QuizQuestion;

const authored = {
  question: "Which module gives you a router?",
  options: ["http", "express"],
  correctAnswer: "express",
  points: 5,
} as unknown as QuizQuestion;

describe("correctIndexOf", () => {
  it("reads the index shape the seeded quizzes use", () => {
    expect(correctIndexOf(seeded)).toBe(1);
  });

  it("resolves the text shape back to an index", () => {
    expect(correctIndexOf(authored)).toBe(1);
  });

  it("accepts an index stored as text", () => {
    const odd = { options: ["a", "b"], correctAnswer: "1" } as unknown as QuizQuestion;
    expect(correctIndexOf(odd)).toBe(1);
  });

  it("returns -1 when the question names no answer, rather than guessing zero", () => {
    const broken = { options: ["a", "b"] } as unknown as QuizQuestion;
    expect(correctIndexOf(broken)).toBe(-1);
  });
});

describe("correctTextOf", () => {
  it("gives the option text for an index-shaped question", () => {
    expect(correctTextOf(seeded)).toBe(
      "Adding more servers and distributing load across them",
    );
  });

  it("gives the stored text for a text-shaped question", () => {
    expect(correctTextOf(authored)).toBe("express");
  });
});

describe("isCorrect", () => {
  it("marks the right option on an index-shaped question", () => {
    // This is the bug: course-quiz compared against `correctAnswer`, which is
    // undefined here, so this was false for every option.
    expect(isCorrect(seeded, 1)).toBe(true);
    expect(isCorrect(seeded, 0)).toBe(false);
  });

  it("marks the right option on a text-shaped question", () => {
    expect(isCorrect(authored, 1)).toBe(true);
    expect(isCorrect(authored, 0)).toBe(false);
  });

  it("never marks anything correct when no answer is recorded", () => {
    const broken = { options: ["a", "b"] } as unknown as QuizQuestion;
    expect(isCorrect(broken, 0)).toBe(false);
    expect(isCorrect(broken, 1)).toBe(false);
  });
});

describe("scoreAttempt", () => {
  it("weights by points when the questions carry them", () => {
    expect(
      scoreAttempt([
        { passed: true, points: 3 },
        { passed: false, points: 1 },
      ]),
    ).toBe(75);
  });

  it("falls back to the share correct when no question carries points", () => {
    // Scoring purely by points divided by zero here and returned 0% for a
    // perfect attempt — most stored questions have no points.
    expect(scoreAttempt([{ passed: true }, { passed: true }])).toBe(100);
    expect(scoreAttempt([{ passed: true }, { passed: false }])).toBe(50);
  });

  it("returns 0 for an empty attempt without dividing by zero", () => {
    expect(scoreAttempt([])).toBe(0);
  });

  it("scores a perfect attempt at a real seeded quiz as a pass", () => {
    // End to end on the shape that used to fail: three index-shaped questions,
    // no points, all answered correctly. Against a passingScore of 80 this was
    // 0 and the learner could not clear a required quiz to advance.
    const questions = [seeded, seeded, seeded];
    const results = questions.map((question) => ({
      passed: isCorrect(question, correctIndexOf(question)),
      points: (question as unknown as { points?: number }).points,
    }));

    expect(scoreAttempt(results)).toBe(100);
  });
});
