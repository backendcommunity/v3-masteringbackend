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
});
