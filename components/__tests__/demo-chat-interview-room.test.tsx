import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useRef } from "react";
import { DemoChatInterviewRoom } from "@/components/pages/mock-interviews/chat/demo-chat-interview-room";
import type { DemoControls } from "@/lib/mock-interview-tour";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// jsdom does not implement scrollIntoView or matchMedia.
window.HTMLElement.prototype.scrollIntoView = vi.fn();
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
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

// Monaco (CodeEditorPanel) and Excalidraw (WhiteboardPanel) are heavy native
// modules that do not run in jsdom. Mock the panel modules with lightweight
// stubs that expose the data-tour anchors. The unit goal is the demo room's
// state machine + workspace presence, not the editors themselves.
vi.mock(
  "@/components/pages/mock-interviews/chat/code-editor-panel",
  () => ({
    CodeEditorPanel: () => <div data-tour="mi-code" />,
  }),
);
vi.mock(
  "@/components/pages/mock-interviews/chat/whiteboard-panel",
  () => ({
    WhiteboardPanel: () => <div data-tour="mi-whiteboard" />,
  }),
);

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

    // C1 regression: timer must be visible on mount (demo is in-progress, not auto-completed).
    expect(document.querySelector('[data-tour="mi-timer"]')).not.toBeNull();
    // Score 82 must NOT appear before results are revealed.
    expect(screen.queryByText(/82/)).toBeNull();

    // Workspace anchor present on mount (CodeEditorPanel stub renders it).
    expect(document.querySelector('[data-tour="mi-code"]')).not.toBeNull();

    // Advance one Q+A pair.
    act(() => ref.current?.playNextTurn());
    expect(screen.getByText(/token-bucket/i)).toBeTruthy();

    // showCode switches to the code editor panel (anchor stays present).
    act(() => ref.current?.showCode());
    expect(document.querySelector('[data-tour="mi-code"]')).not.toBeNull();

    // Reveal results.
    act(() => ref.current?.revealResult());
    // Score 82 appears only after revealResult().
    expect(screen.getByText(/82/)).toBeTruthy();
  });
});
