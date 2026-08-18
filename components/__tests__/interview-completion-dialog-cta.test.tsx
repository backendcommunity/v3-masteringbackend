import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InterviewCompletionDialog } from "@/components/pages/mock-interviews/chat/interview-completion-dialog";

// Hoisted mocks — factories must not reference module-level variables.
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/mock-interviews/demo",
}));

vi.mock("@/lib/analytics", () => ({
  analytics: { track: vi.fn() },
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMockInterviewTemplates: () => Promise.resolve([]),
    getCourses: () => Promise.resolve([]),
    createBookmark: vi.fn(),
    scheduleInterviewFromTemplate: vi.fn(),
  }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Pull analytics after mock is installed.
import { analytics } from "@/lib/analytics";
const mockTrack = analytics.track as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockPush.mockReset();
  mockTrack.mockReset();
});

describe("InterviewCompletionDialog — access-aware CTA", () => {
  it("hasFullAccess=true + source=demo: shows 'Start a real interview', pushes /mock-interviews, tracks demo_cta_clicked with path=start_real", () => {
    render(
      <InterviewCompletionDialog
        open={true}
        onClose={vi.fn()}
        overallScore={82}
        hasFullAccess={true}
        source="demo"
      />,
    );

    const btn = screen.getByRole("button", { name: /start a real interview/i });
    expect(btn).toBeTruthy();

    fireEvent.click(btn);

    expect(mockPush).toHaveBeenCalledWith("/mock-interviews");
    expect(mockTrack).toHaveBeenCalledWith(
      "mock_interview_demo_cta_clicked",
      expect.objectContaining({ path: "start_real" }),
    );
    expect(mockPush).not.toHaveBeenCalledWith(
      "/pricing?redirect=%2Fmock-interviews%2Fdemo",
    );
  });

  it("hasFullAccess=false + source=demo: shows 'Unlock Full Access', pushes /subscription/plans, tracks demo_cta_clicked with path=upgrade", () => {
    render(
      <InterviewCompletionDialog
        open={true}
        onClose={vi.fn()}
        overallScore={82}
        hasFullAccess={false}
        source="demo"
      />,
    );

    const btn = screen.getByRole("button", { name: /unlock full access/i });
    expect(btn).toBeTruthy();

    fireEvent.click(btn);

    expect(mockPush).toHaveBeenCalledWith(
      "/pricing?redirect=%2Fmock-interviews%2Fdemo",
    );
    expect(mockTrack).toHaveBeenCalledWith(
      "mock_interview_demo_cta_clicked",
      expect.objectContaining({ path: "upgrade" }),
    );
    expect(mockPush).not.toHaveBeenCalledWith("/mock-interviews");
  });

  it("no new props (backward compat): footer is 'Unlock Full Access' -> /subscription/plans, no demo_cta_clicked fired", () => {
    render(
      <InterviewCompletionDialog
        open={true}
        onClose={vi.fn()}
        overallScore={55}
      />,
    );

    const btn = screen.getByRole("button", { name: /unlock full access/i });
    expect(btn).toBeTruthy();

    fireEvent.click(btn);

    expect(mockPush).toHaveBeenCalledWith(
      "/pricing?redirect=%2Fmock-interviews%2Fdemo",
    );
    const demoCalls = mockTrack.mock.calls.filter(
      (c) => c[0] === "mock_interview_demo_cta_clicked",
    );
    expect(demoCalls).toHaveLength(0);
  });
});
