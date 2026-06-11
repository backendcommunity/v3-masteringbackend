import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  markActivity,
  registerActivitySource,
  isIdle,
  __setLastActivityForTests,
  IDLE_TIMEOUT_MS,
} from "../activity";

describe("activity engine", () => {
  beforeEach(() => {
    __setLastActivityForTests(Date.now());
    vi.restoreAllMocks();
  });

  it("is not idle right after activity", () => {
    markActivity();
    expect(isIdle()).toBe(false);
  });

  it("is idle once timeout elapsed with no active source", () => {
    __setLastActivityForTests(Date.now() - IDLE_TIMEOUT_MS - 1000);
    expect(isIdle()).toBe(true);
  });

  it("is NOT idle while an activity source is held (e.g. video playing)", () => {
    __setLastActivityForTests(Date.now() - IDLE_TIMEOUT_MS - 1000);
    const release = registerActivitySource();
    expect(isIdle()).toBe(false);
    release();
    expect(isIdle()).toBe(true);
  });

  it("markActivity resets the idle clock", () => {
    __setLastActivityForTests(Date.now() - IDLE_TIMEOUT_MS - 1000);
    expect(isIdle()).toBe(true);
    markActivity();
    expect(isIdle()).toBe(false);
  });

  it("ref-counts sources: still busy until all released", () => {
    __setLastActivityForTests(Date.now() - IDLE_TIMEOUT_MS - 1000);
    const r1 = registerActivitySource();
    const r2 = registerActivitySource();
    r1();
    expect(isIdle()).toBe(false);
    r2();
    expect(isIdle()).toBe(true);
  });
});
