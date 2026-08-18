import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPricing, GLOBAL_FALLBACK } from "@/lib/pricing.server";

const ORIGINAL_ENV = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:8081/api/v3";
  global.fetch = vi.fn();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = ORIGINAL_ENV;
});

function okResponse(data: unknown) {
  return { ok: true, json: async () => ({ success: true, data }) };
}

// Pins the /pricing and /checkout -> fetchPricing -> API wiring for the
// dev-only __geo override: the page's own query param must ride along as a
// query param on the outgoing request, verbatim, with no client-side gating
// (the API is the only place that decides whether to honour it — see
// resolveCountryWithOverride in academy).
describe("fetchPricing __geo forwarding", () => {
  it("appends ?__geo=<value> to the request URL when an override is given", async () => {
    (global.fetch as any).mockResolvedValue(okResponse({ tier: "NG" }));

    await fetchPricing({ "cf-ipcountry": "US" }, "NG");

    const [calledUrl] = (global.fetch as any).mock.calls[0];
    expect(new URL(calledUrl).searchParams.get("__geo")).toBe("NG");
  });

  it("still forwards the real geo headers alongside the override", async () => {
    (global.fetch as any).mockResolvedValue(okResponse({ tier: "NG" }));

    await fetchPricing({ "cf-ipcountry": "US" }, "NG");

    const [, options] = (global.fetch as any).mock.calls[0];
    expect(options.headers).toEqual({ "cf-ipcountry": "US" });
  });

  it("omits __geo entirely when no override is given", async () => {
    (global.fetch as any).mockResolvedValue(okResponse({ tier: "GLOBAL" }));

    await fetchPricing({ "cf-ipcountry": "US" });

    const [calledUrl] = (global.fetch as any).mock.calls[0];
    expect(new URL(calledUrl).searchParams.has("__geo")).toBe(false);
  });

  it("falls back to GLOBAL_FALLBACK if the request fails, override or not", async () => {
    (global.fetch as any).mockRejectedValue(new Error("network down"));

    const result = await fetchPricing({}, "NG");

    expect(result).toEqual(GLOBAL_FALLBACK);
  });
});
