import { describe, expect, it } from "vitest";
import { isPublicPath, PUBLIC_PATH_PREFIXES } from "@/lib/public-paths";

describe("isPublicPath", () => {
  it("treats /ai/payment as public so anonymous checkout isn't bounced to login", () => {
    expect(isPublicPath("/ai/payment")).toBe(true);
    expect(isPublicPath("/ai/payment?price=abc")).toBe(true);
  });

  it("treats /xpayment as public", () => {
    expect(isPublicPath("/xpayment")).toBe(true);
  });

  it("keeps existing public prefixes working", () => {
    expect(isPublicPath("/portfolios/someone")).toBe(true);
    expect(isPublicPath("/certifications/verify/abc123")).toBe(true);
  });

  it("treats /team/join/:token as public — the invitee has no session yet", () => {
    expect(isPublicPath("/team/join/abc123token")).toBe(true);
    // The bare /team management page (owner UI) stays protected.
    expect(isPublicPath("/team")).toBe(false);
  });

  it("does not mark unrelated protected routes as public", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/ai")).toBe(false);
  });

  it("every AUTH_PATHS entry middleware exempts from login-redirect is also registered here", () => {
    // middleware.ts hardcodes /ai/payment and /xpayment as auth-bypass routes;
    // the client-side gates (AuthProvider, api.ts interceptor) only consult
    // PUBLIC_PATH_PREFIXES, so both must stay listed here or the client will
    // redirect an anonymous visitor to /auth/login even though middleware let
    // the request through.
    expect(PUBLIC_PATH_PREFIXES).toEqual(
      expect.arrayContaining(["/ai/payment", "/xpayment"]),
    );
  });
});
