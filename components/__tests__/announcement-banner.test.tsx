import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const track = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: { track: (event: string, props?: unknown) => track(event, props) },
}));

describe("AnnouncementBanner", () => {
  beforeEach(() => {
    track.mockClear();
    window.localStorage.clear();
  });

  it("renders the mock interview promo and tracks a view", () => {
    render(<AnnouncementBanner />);
    expect(screen.getAllByText(/Mock Interview/i).length).toBeGreaterThan(0);
    expect(track).toHaveBeenCalledWith("mock_interview_banner_viewed", expect.anything());
  });

  it("hides after dismiss and persists", () => {
    const { rerender } = render(<AnnouncementBanner />);
    fireEvent.click(screen.getByLabelText(/dismiss/i));
    expect(track).toHaveBeenCalledWith("mock_interview_banner_dismissed", undefined);
    rerender(<AnnouncementBanner />);
    expect(screen.queryAllByText(/Mock Interview/i).length).toBe(0);
  });
});
