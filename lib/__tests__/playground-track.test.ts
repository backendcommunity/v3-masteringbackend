import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeEditDebouncer } from "@/lib/playground-track";

describe("makeEditDebouncer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires once per window per file", () => {
    const track = vi.fn();
    const onEdit = makeEditDebouncer(track, 30_000);
    onEdit("app.ts");
    onEdit("app.ts");
    onEdit("app.ts");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({ file_ext: "ts" });
    vi.advanceTimersByTime(30_000);
    onEdit("app.ts");
    expect(track).toHaveBeenCalledTimes(2);
  });

  it("tracks distinct files independently", () => {
    const track = vi.fn();
    const onEdit = makeEditDebouncer(track, 30_000);
    onEdit("a.ts");
    onEdit("b.js");
    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenNthCalledWith(2, { file_ext: "js" });
  });
});
