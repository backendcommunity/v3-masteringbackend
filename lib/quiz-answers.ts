import type { QuizQuestion } from "@/lib/data";

/**
 * Reading a quiz question's correct answer, and scoring an attempt.
 *
 * Stored questions come in two shapes and the API returns them untouched:
 *
 *   { question, options, answer: 2 }              — seeded quizzes (the majority)
 *   { question, options, correctAnswer: "text" }  — quizzes written through the admin
 *
 * `QuizQuestion` declares `correctAnswer: string` as if it were always there, so
 * the type gives no warning when it is not. Reading it directly yields
 * `undefined`, every comparison is false, and the learner scores zero.
 *
 * Points are the same story: most stored questions carry none, so scoring purely
 * by points divides by zero and returns zero even when every answer was right.
 *
 * These helpers were proven in `path-quiz`; this module is that logic made
 * shareable so every quiz surface grades the same way.
 */

/** Index of the correct option, or -1 when the question does not say. */
export function correctIndexOf(question: QuizQuestion): number {
  const index = (question as unknown as { answer?: number }).answer;
  if (typeof index === "number") return index;

  const text = question.correctAnswer;
  if (text != null && question.options) {
    const byText = question.options.indexOf(text);
    if (byText >= 0) return byText;
    // Some rows store the index as a string in the text field.
    const asNumber = Number(text);
    if (!Number.isNaN(asNumber)) return asNumber;
  }
  return -1;
}

/** The correct option's text, for display and for comparing a learner's choice. */
export function correctTextOf(question: QuizQuestion): string {
  return question.options?.[correctIndexOf(question)] ?? question.correctAnswer ?? "";
}

/** True when the option at `selectedIndex` is the correct one. */
export function isCorrect(question: QuizQuestion, selectedIndex: number): boolean {
  const correct = correctIndexOf(question);
  return correct >= 0 && selectedIndex === correct;
}

/**
 * Percentage score for an attempt.
 *
 * Weighted by points when the questions carry them; otherwise by the share of
 * correct answers, because a quiz whose questions have no points is not a quiz
 * worth zero — it is a quiz that never said how to weight itself.
 */
export function scoreAttempt(results: Array<{ passed: boolean; points?: number }>): number {
  if (!results.length) return 0;

  const totalPoints = results.reduce((sum, result) => sum + (result.points || 0), 0);
  if (totalPoints > 0) {
    const earned = results.reduce(
      (sum, result) => sum + (result.passed ? result.points || 0 : 0),
      0,
    );
    return Math.round((earned / totalPoints) * 100);
  }

  const correct = results.filter((result) => result.passed).length;
  return Math.round((correct / results.length) * 100);
}
