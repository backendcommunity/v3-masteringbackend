import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// forwardedGeoHeaders reads the inbound request through next/headers, which
// only exists inside a server render.
const incomingHeaders = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => incomingHeaders.get(k) ?? null }),
}));

import {
  fetchPricing,
  forwardedGeoHeaders,
  GLOBAL_FALLBACK,
} from "@/lib/pricing.server";

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

describe("GLOBAL_FALLBACK", () => {
  it("carries NO price ids — they are the API's to serve, from its channel rows", () => {
    // A mirrored copy here would be a third source for one fact, and the
    // stale copy would be the one deciding what a buyer is charged. With no
    // id, /checkout classifies itself unavailable (lib/checkout-readiness.ts)
    // instead of opening a checkout against an unconfirmed price.
    expect(GLOBAL_FALLBACK.monthlyPriceId).toBe("");
    expect(GLOBAL_FALLBACK.annualPriceId).toBe("");
    expect(GLOBAL_FALLBACK.enterprise.monthlyPriceId).toBe("");
    expect(GLOBAL_FALLBACK.enterprise.annualPriceId).toBe("");
  });

  it("still fails closed to the most expensive tier's AMOUNTS", () => {
    expect(GLOBAL_FALLBACK.tier).toBe("GLOBAL");
    expect(GLOBAL_FALLBACK.monthly).toBe(19.99);
    expect(GLOBAL_FALLBACK.annual).toBe(199.99);
    expect(GLOBAL_FALLBACK.enterprise.monthlyPerUser).toBe(25);
    expect(GLOBAL_FALLBACK.enterprise.annualPerUser).toBe(250);
  });
});

/**
 * What crosses the server-render hop.
 *
 * This forwarded only the three COUNTRY headers, and staging served USD to
 * Nigeria for real: Cloudflare knew the visitor was in NG but was not adding
 * CF-IPCountry to the origin request, so nothing was forwarded, and the API
 * geolocated the frontend server instead of the visitor. An unresolved country
 * maps to the GLOBAL tier, so nothing errored — it just quoted the wrong price.
 */
describe("forwardedGeoHeaders", () => {
  beforeEach(() => incomingHeaders.clear());

  it("forwards the country header when the edge sends one", async () => {
    incomingHeaders.set("cf-ipcountry", "NG");

    await expect(forwardedGeoHeaders()).resolves.toEqual({
      "cf-ipcountry": "NG",
    });
  });

  /**
   * Cloudflare rejects an inbound `cf-connecting-ip` with error 1000, and the
   * API sits behind Cloudflare too — so the header we RECEIVE cannot be the
   * header we SEND. Read cf-connecting-ip, send true-client-ip.
   */
  it("re-sends the Cloudflare client IP as true-client-ip", async () => {
    incomingHeaders.set("cf-connecting-ip", "102.89.34.71");

    await expect(forwardedGeoHeaders()).resolves.toEqual({
      "true-client-ip": "102.89.34.71",
    });
  });

  it("never sends cf-connecting-ip, whatever the name it arrived under", async () => {
    incomingHeaders.set("cf-connecting-ip", "102.89.34.71");

    const sent = await forwardedGeoHeaders();
    expect(sent).not.toHaveProperty("cf-connecting-ip");
  });

  it("passes true-client-ip straight through", async () => {
    incomingHeaders.set("true-client-ip", "102.89.34.71");

    await expect(forwardedGeoHeaders()).resolves.toEqual({
      "true-client-ip": "102.89.34.71",
    });
  });

  /**
   * x-forwarded-for is deliberately NOT forwarded. It is a list a visitor can
   * prepend to, and the country derived from it selects a pricing tier — so
   * forwarding it would let anyone shop for the cheapest region.
   */
  it("never forwards x-forwarded-for", async () => {
    incomingHeaders.set("x-forwarded-for", "102.89.34.71, 8.8.8.8");

    await expect(forwardedGeoHeaders()).resolves.toEqual({});
  });

  it("sends nothing when the request carries nothing", async () => {
    await expect(forwardedGeoHeaders()).resolves.toEqual({});
  });
});
