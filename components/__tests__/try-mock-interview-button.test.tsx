import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TryMockInterviewButton } from "@/components/projects/try-mock-interview-button";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const track = vi.fn();
vi.mock("@/lib/analytics", () => ({ analytics: { track: (...a: unknown[]) => track(...a) } }));

describe("TryMockInterviewButton", () => {
  it("routes to the demo walkthrough and tracks the click", () => {
    render(<TryMockInterviewButton source="nav" />);
    fireEvent.click(screen.getByRole("button"));
    expect(track).toHaveBeenCalledWith("mock_interview_banner_cta_clicked", { source: "nav" });
    expect(push).toHaveBeenCalledWith("/mock-interviews/demo?tour=offer");
  });
});
