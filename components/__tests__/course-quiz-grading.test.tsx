import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CourseQuizPage } from "@/components/pages/course-quiz";

/**
 * The quiz a learner actually meets.
 *
 * 14 of the 16 stored quizzes look exactly like this: an `answer` index, no
 * `correctAnswer`, and no `points`. Grading them against `correctAnswer` scored
 * every attempt zero, and because `handleMarkComplete` only runs on a pass, a
 * required quiz left the learner unable to advance.
 */
const seededQuiz = {
  id: "quiz-1",
  title: "Scaling",
  description: "Two questions on scaling.",
  passingScore: 80,
  timeLimit: 20,
  enrolled: true,
  userQuiz: { id: "uq-1" },
  questions: [
    {
      question: "What best describes horizontal scaling?",
      options: ["More CPU on one server", "More servers behind a balancer"],
      answer: 1,
    },
    {
      question: "What does a work queue give each message?",
      options: ["Every worker", "Exactly one worker"],
      answer: 1,
    },
  ],
};

const submitQuiz = vi.fn().mockResolvedValue(undefined);
const getQuiz = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({ getQuiz, submitQuiz, startQuiz: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/components/confetti-celebration", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  getQuiz.mockResolvedValue(seededQuiz);
});

async function answerEveryQuestionCorrectly() {
  // Question 1: pick the correct option, advance, then question 2.
  const first = await screen.findByText(/horizontal scaling/i);
  expect(first).toBeInTheDocument();

  fireEvent.click(screen.getByText("More servers behind a balancer"));
  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  await screen.findByText(/work queue/i);
  fireEvent.click(screen.getByText("Exactly one worker"));
}

describe("CourseQuizPage — grading an index-shaped quiz", () => {
  it("scores a perfect attempt 100 and reports a pass", async () => {
    const handleQuizSubmit = vi.fn();

    render(
      <CourseQuizPage
        courseId="course-1"
        quizId="quiz-1"
        onNavigate={() => {}}
        handleQuizSubmit={handleQuizSubmit}
      />,
    );

    await answerEveryQuestionCorrectly();
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(submitQuiz).toHaveBeenCalled());

    // Was 0 on both counts: `correctAnswer` was undefined so nothing matched,
    // and with no points the score divided by zero.
    expect(submitQuiz.mock.calls[0][1].score).toBe(100);
    expect(handleQuizSubmit).toHaveBeenCalledWith(true);
  });

  it("still fails an attempt that is actually wrong", async () => {
    const handleQuizSubmit = vi.fn();

    render(
      <CourseQuizPage
        courseId="course-1"
        quizId="quiz-1"
        onNavigate={() => {}}
        handleQuizSubmit={handleQuizSubmit}
      />,
    );

    await screen.findByText(/horizontal scaling/i);
    fireEvent.click(screen.getByText("More CPU on one server"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/work queue/i);
    fireEvent.click(screen.getByText("Every worker"));
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(submitQuiz).toHaveBeenCalled());

    expect(submitQuiz.mock.calls[0][1].score).toBe(0);
    expect(handleQuizSubmit).toHaveBeenCalledWith(false);
  });

  it("sends the correct option's text back with each result", async () => {
    render(
      <CourseQuizPage
        courseId="course-1"
        quizId="quiz-1"
        onNavigate={() => {}}
        handleQuizSubmit={vi.fn()}
      />,
    );

    await answerEveryQuestionCorrectly();
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(submitQuiz).toHaveBeenCalled());

    // The review list reads this back; it used to render undefined.
    const items = submitQuiz.mock.calls[0][1].items;
    expect(items[0].correctAnswer).toBe("More servers behind a balancer");
  });
});
