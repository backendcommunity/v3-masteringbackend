import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { openGithubPopup } from "@/lib/github-popup";

describe("openGithubPopup", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens a centered 600x700 popup named github-connect", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue({ closed: false } as any);
    openGithubPopup("https://github.com/apps/foo/installations/new", vi.fn());
    expect(openSpy).toHaveBeenCalledWith(
      "https://github.com/apps/foo/installations/new",
      "github-connect",
      expect.stringContaining("width=600,height=700"),
    );
  });

  it("calls onClose once the popup reports closed", () => {
    const popup = { closed: false };
    vi.spyOn(window, "open").mockReturnValue(popup as any);
    const onClose = vi.fn();
    openGithubPopup("https://example.com", onClose);

    vi.advanceTimersByTime(500);
    expect(onClose).not.toHaveBeenCalled();

    popup.closed = true;
    vi.advanceTimersByTime(500);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Further polling stops after close — advancing more time doesn't call again.
    vi.advanceTimersByTime(2000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
