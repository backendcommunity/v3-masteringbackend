import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReturnRecapModal } from "../journey/return-recap-modal";
import { useAppStore } from "@/lib/store";

vi.mock("@/lib/journey-analytics", () => ({
  recapShown: vi.fn(), recapFeedback: vi.fn(), recapCta: vi.fn(), recapDismissed: vi.fn(), welcomeBackShown: vi.fn(),
}));

const ITEM_RECAP = {
  eventId: "e1", surface: "ITEM", itemType: "COURSE", itemId: "c1", tier: "MONTH",
  awayText: "When you left a month ago, you were on Intro to the OpenAI API, in Working with the OpenAI API.",
  recap: { courseTitle: "Working with the OpenAI API", chapterTitle: "Intro to the OpenAI API", intro: "Here's what you covered.", keyPoints: [{ heading: "APIs", body: "Like a waiter between your code and the model." }], source: "INSIGHT" },
  bridge: "This set the stage for what's next.",
  nextStep: { title: "Handling responses", type: "VIDEO", goal: "the goal is to handle responses" },
  stats: { xpEarned: 0, currentStreak: 5, isStreakActive: true },
};

beforeEach(() => { useAppStore.setState({ returnRecap: null } as any); vi.clearAllMocks(); });

describe("ReturnRecapModal", () => {
  it("renders nothing when no recap", () => {
    render(<ReturnRecapModal />);
    expect(screen.queryByText("Your recent learnings")).toBeNull();
  });
  it("renders away text, re-teach, next step and CTA for an item recap", async () => {
    useAppStore.setState({ returnRecap: ITEM_RECAP } as any);
    render(<ReturnRecapModal />);
    expect(screen.getByText("Your recent learnings")).toBeInTheDocument();
    expect(screen.getByText(/a month ago/i)).toBeInTheDocument();
    expect(screen.getByText(/APIs/)).toBeInTheDocument();
    expect(screen.getByText(/Handling responses/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resume learning/i })).toBeInTheDocument();
  });
  it("does not show a lost streak (no negative streak wording)", () => {
    useAppStore.setState({ returnRecap: { ...ITEM_RECAP, stats: { xpEarned: 0, currentStreak: 0, isStreakActive: false } } } as any);
    render(<ReturnRecapModal />);
    expect(screen.queryByText(/lost/i)).toBeNull();
  });
});
