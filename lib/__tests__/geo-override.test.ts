import { describe, it, expect } from "vitest";
import { withGeoOverride } from "@/lib/geo-override";

describe("withGeoOverride", () => {
  it("leaves the href unchanged when there is no __geo in the current URL", () => {
    const searchParams = new URLSearchParams("");
    expect(withGeoOverride("/checkout?plan=pro&cycle=annual", searchParams)).toBe(
      "/checkout?plan=pro&cycle=annual",
    );
  });

  it("leaves the href unchanged when searchParams is null", () => {
    expect(withGeoOverride("/checkout?plan=pro&cycle=annual", null)).toBe(
      "/checkout?plan=pro&cycle=annual",
    );
  });

  it("appends __geo to an href with no existing query string", () => {
    const searchParams = new URLSearchParams("__geo=NG");
    expect(withGeoOverride("/checkout", searchParams)).toBe("/checkout?__geo=NG");
  });

  it("appends __geo to an href that already has query parameters", () => {
    const searchParams = new URLSearchParams("__geo=NG");
    expect(withGeoOverride("/checkout?plan=pro&cycle=annual", searchParams)).toBe(
      "/checkout?plan=pro&cycle=annual&__geo=NG",
    );
  });

  it("percent-encodes a value that needs encoding", () => {
    const searchParams = new URLSearchParams();
    searchParams.set("__geo", "N G&x=1");
    expect(withGeoOverride("/checkout", searchParams)).toBe(
      `/checkout?__geo=${encodeURIComponent("N G&x=1")}`,
    );
  });

  it("composes with an existing redirect param instead of clobbering it", () => {
    const searchParams = new URLSearchParams("__geo=NG");
    const href = `/pricing?redirect=${encodeURIComponent("/courses/foo")}`;
    expect(withGeoOverride(href, searchParams)).toBe(
      `/pricing?redirect=${encodeURIComponent("/courses/foo")}&__geo=NG`,
    );
  });
});
