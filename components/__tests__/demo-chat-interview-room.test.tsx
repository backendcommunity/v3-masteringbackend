import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useRef } from "react";
import { DemoChatInterviewRoom } from "@/components/pages/mock-interviews/chat/demo-chat-interview-room";
import type { DemoControls } from "@/lib/mock-interview-tour";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// jsdom does not implement scrollIntoView.
window.HTMLElement.prototype.scrollIntoView = vi.fn();
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/lib/analytics", () => ({
  analytics: { track: vi.fn() },
}));
vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  return {
    ...actual,
    useAppStore: () => ({ submitMessageFeedback: vi.fn() }),
  };
});

function Harness({ onReady }: { onReady: (r: React.MutableRefObject<DemoControls | null>) => void }) {
  const ref = useRef<DemoControls | null>(null);
  onReady(ref);
  return <DemoChatInterviewRoom controlsRef={ref} />;
}

describe("DemoChatInterviewRoom", () => {
  it("plays scripted turns and reveals the canned report without network", () => {
    let ref!: React.MutableRefObject<DemoControls | null>;
    render(<Harness onReady={(r) => (ref = r)} />);
    // First AI question shown on mount.
    expect(screen.getByText(/rate limiter/i)).toBeTruthy();
    // Advance one Q+A pair.
    act(() => ref.current?.playNextTurn());
    expect(screen.getByText(/token-bucket/i)).toBeTruthy();
    // Reveal results.
    act(() => ref.current?.revealResult());
    expect(screen.getByText(/82/)).toBeTruthy();
  });
});
