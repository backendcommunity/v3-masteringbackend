import { describe, it, expect } from "vitest";
import { safeRedirectPath, sanitizeRedirect } from "@/lib/safe-redirect";
import { routes } from "@/lib/routes";

// Pins the XSS fix on the `redirect` query param. The regional-pricing
// upsell renders this value as an <a href> ("Continue with the free plan"
// on /pricing), so an unsanitised `?redirect=javascript:alert(1)` is a
// script-executing link, not merely an open redirect. Every hostile shape
// below must resolve to the fallback, and every legitimate in-app path must
// survive untouched.
describe("safeRedirectPath", () => {
  it("accepts a normal same-origin path", () => {
    expect(safeRedirectPath("/paths/backend-engineering/learn")).toBe(
      "/paths/backend-engineering/learn",
    );
  });

  it("accepts a path with a query string and hash", () => {
    expect(safeRedirectPath("/courses/nodejs?tab=lessons#intro")).toBe(
      "/courses/nodejs?tab=lessons#intro",
    );
  });

  it("accepts the bare root path", () => {
    expect(safeRedirectPath("/")).toBe("/");
  });

  it("rejects a javascript: URL (the href XSS sink)", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBeNull();
  });

  it("rejects a javascript: URL that survived a leading slash trick", () => {
    // A browser strips CR/LF/tab out of a URL before parsing it.
    expect(safeRedirectPath("/\tjavascript:alert(1)")).toBeNull();
    expect(safeRedirectPath("java\nscript:alert(1)")).toBeNull();
  });

  it("rejects a protocol-relative URL", () => {
    expect(safeRedirectPath("//evil.com")).toBeNull();
    expect(safeRedirectPath("//evil.com/pwn")).toBeNull();
  });

  it("rejects a backslash protocol-relative URL", () => {
    expect(safeRedirectPath("/\\evil.com")).toBeNull();
  });

  it("rejects an absolute off-site URL", () => {
    expect(safeRedirectPath("https://evil.com")).toBeNull();
    expect(safeRedirectPath("http://evil.com/pwn")).toBeNull();
  });

  it("rejects a path with an encoded scheme", () => {
    expect(safeRedirectPath("%6aavascript:alert(1)")).toBeNull();
    expect(safeRedirectPath("/%2f%2fevil.com")).toBeNull();
    expect(safeRedirectPath("/%5c%5cevil.com")).toBeNull();
  });

  it("rejects a data: URL", () => {
    expect(
      safeRedirectPath("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="),
    ).toBeNull();
  });

  it("rejects malformed percent-encoding rather than guessing", () => {
    expect(safeRedirectPath("/%E0%A4%A")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(safeRedirectPath("")).toBeNull();
    expect(safeRedirectPath("   ")).toBeNull();
  });

  it("rejects null and undefined", () => {
    expect(safeRedirectPath(null)).toBeNull();
    expect(safeRedirectPath(undefined)).toBeNull();
  });

  it("rejects a bare relative path with no leading slash", () => {
    // Would resolve against the current directory rather than the app root —
    // not dangerous, but not a destination we ever generate.
    expect(safeRedirectPath("dashboard")).toBeNull();
  });
});

describe("sanitizeRedirect", () => {
  it("passes a safe path through", () => {
    expect(sanitizeRedirect("/paths/x/learn")).toBe("/paths/x/learn");
  });

  it("falls back to the dashboard for every hostile shape", () => {
    for (const hostile of [
      "javascript:alert(1)",
      "//evil.com",
      "https://evil.com",
      "/%2f%2fevil.com",
      "",
      null,
      undefined,
    ]) {
      expect(sanitizeRedirect(hostile)).toBe(routes.dashboard);
    }
  });

  it("honours an explicit fallback", () => {
    expect(sanitizeRedirect("javascript:alert(1)", "")).toBe("");
    expect(sanitizeRedirect(null, "/pricing")).toBe("/pricing");
  });
});
