import { describe, expect, it, vi } from "vitest";

import { getPlaygroundMode } from "../playground-mode";

describe("getPlaygroundMode (frontend)", () => {
  it("returns the explicit mode when set", () => {
    expect(getPlaygroundMode({ playgroundConfig: { mode: "terminal" } } as any)).toBe("terminal");
  });
  it("falls back to frontend when frontendPreview is truthy", () => {
    expect(getPlaygroundMode({ playgroundConfig: { frontendPreview: true } } as any)).toBe("frontend");
  });
  it("defaults to rest-api", () => {
    expect(getPlaygroundMode({} as any)).toBe("rest-api");
  });
  it("never reads frontendURL or baseRepository", () => {
    expect(
      getPlaygroundMode({ frontendURL: "https://x.test", baseRepository: "https://git.test" } as any),
    ).toBe("rest-api");
  });
  it("rejects an unknown stored mode value, logs it, and falls back to rest-api rather than frontendPreview", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      getPlaygroundMode({ playgroundConfig: { mode: "bogus", frontendPreview: true } } as any),
    ).toBe("rest-api");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
