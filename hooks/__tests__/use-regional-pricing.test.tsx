/**
 * Regression: the pricing pages quoted USD to Nigerian visitors.
 *
 * The fix is that pricing is fetched from the BROWSER, where the connection
 * belongs to the visitor and the API's edge resolves the right country with
 * nothing forwarded. See lib/__tests__/regional-pricing-is-client-side.test.ts
 * for why no amount of server-side header forwarding could work.
 *
 * These tests pin the behaviour that fix depends on.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const get = vi.fn();
vi.mock("@/lib/api", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import { useRegionalPricing } from "@/hooks/use-pricing";
import { GLOBAL_FALLBACK } from "@/lib/pricing";

const NG = {
  tier: "NG",
  country: "NG",
  provider: "ASYNCPAY",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  monthlyPriceId: "",
  annualPriceId: "",
  enterprise: {
    tier: "NG",
    provider: "ASYNCPAY",
    currency: "NGN",
    monthlyPerUser: 15000,
    annualPerUser: 150000,
    minSeats: 2,
    selfServe: false,
    monthlyPriceId: "",
    annualPriceId: "",
  },
};

describe("useRegionalPricing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/pricing");
  });

  it("hits the public pricing endpoint and returns the visitor's region", async () => {
    get.mockResolvedValue({ data: { data: NG } });

    const { result } = renderHook(() => useRegionalPricing());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(get).toHaveBeenCalledWith("/public/pricing", {
      params: undefined,
    });
    expect(result.current!.tier).toBe("NG");
    expect(result.current!.currency).toBe("NGN");
    expect(result.current!.monthly).toBe(9999);
  });

  /**
   * The whole point of moving the fetch: no price is claimed until the region
   * is known. A placeholder amount that swaps currency is worse than a wait.
   */
  it("returns null before the response arrives", () => {
    get.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useRegionalPricing());

    expect(result.current).toBeNull();
  });

  it("skips the request entirely when disabled", () => {
    const { result } = renderHook(() => useRegionalPricing(false));

    expect(get).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  // Fail-closed: an outage over-quotes. It must never hand out naira or PPP.
  it("falls back to the most expensive tier when the request fails", async () => {
    get.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() =>
      useRegionalPricing(true, GLOBAL_FALLBACK),
    );

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current!.tier).toBe("GLOBAL");
    expect(result.current!.currency).toBe("USD");
  });

  it("stays null on failure when no fallback was given", async () => {
    get.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useRegionalPricing());

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  /**
   * An older API deployment can answer without the nested Enterprise object.
   * Half a price is not a price: the whole object is replaced by the
   * fail-closed one rather than patched.
   */
  it("replaces a malformed enterprise block with the global one", async () => {
    get.mockResolvedValue({
      data: { data: { ...NG, enterprise: { monthlyPerUser: 15000 } } },
    });

    const { result } = renderHook(() => useRegionalPricing());

    await waitFor(() => expect(result.current).not.toBeNull());
    // Pro's own naira amounts survive — only the broken half is discarded.
    expect(result.current!.currency).toBe("NGN");
    expect(result.current!.monthly).toBe(9999);
    expect(result.current!.enterprise).toEqual(GLOBAL_FALLBACK.enterprise);
  });

  /**
   * `__geo` is the developer override that makes the NG and PPP tiers
   * testable on localhost, which sends no geo header at all. It has to ride
   * on the request now that the request comes from the browser. Inert in
   * staging and production — academy's resolveCountryWithOverride returns
   * early without reading the param unless its own context is LOCAL/DEVELOP.
   */
  it("forwards the __geo developer override from the URL", async () => {
    window.history.replaceState({}, "", "/pricing?__geo=NG");
    get.mockResolvedValue({ data: { data: NG } });

    renderHook(() => useRegionalPricing());

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(get).toHaveBeenCalledWith("/public/pricing", {
      params: { __geo: "NG" },
    });
  });
});
