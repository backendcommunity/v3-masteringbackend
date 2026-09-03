import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression: every Nigerian visitor to staging was quoted USD.
 *
 * The four pricing routes resolved the visitor's region on the SERVER. That
 * cannot work, and the reason is not a bug anyone can patch: the API decides
 * the region from the geo headers its own Cloudflare zone writes onto the
 * inbound request, and an edge describes whoever opened the connection. A
 * server render therefore asks "where is the visitor?" and is truthfully told
 * where the app server is.
 *
 * Measured against the deployed staging API, from a Nigerian address:
 *
 *   no headers                    -> tier NG   (the caller IS the visitor)
 *   X-Vercel-IP-Country: US       -> tier NG   (forwarded header never read)
 *   CF-IPCountry: US              -> tier NG   (overwritten by the edge)
 *   True-Client-IP: 8.8.8.8       -> tier NG   (forwarded header never read)
 *   CF-Connecting-IP: 8.8.8.8     -> 403       (Cloudflare error 1000)
 *
 * Two previous fixes tried to forward the visitor's country and IP to the API
 * and both failed for that reason, so this test pins the SHAPE of the fix
 * rather than any particular header: the routes must not fetch pricing at
 * all. A price in server-rendered HTML is the defect.
 *
 * Source-level assertions on purpose. The failure had no runtime symptom to
 * assert against — the page returned 200, logged nothing, and rendered a
 * perfectly valid GLOBAL price. Only the absence of the server fetch
 * distinguishes the fixed page from the broken one.
 */

const ROUTES = [
  "app/pricing/page.tsx",
  "app/pricing/enterprise/page.tsx",
  "app/checkout/page.tsx",
  "app/subscription/plans/page.tsx",
];

const read = (rel: string) =>
  readFileSync(join(process.cwd(), rel), "utf8");

describe("the pricing routes never resolve a region on the server", () => {
  it.each(ROUTES)("%s does not fetch pricing", (route) => {
    const src = read(route);
    expect(src).not.toMatch(/fetchPricing/);
    expect(src).not.toMatch(/pricing\.server/);
  });

  /**
   * next/headers is how a server component would read the visitor's country
   * or IP in order to forward it. Both attempts at this bug did exactly that.
   */
  it.each(ROUTES)("%s does not read request headers", (route) => {
    expect(read(route)).not.toMatch(/next\/headers/);
  });

  /**
   * `force-dynamic` existed ONLY because these pages rendered one region's
   * price into the HTML. With no server-side price there is nothing
   * region-specific to keep out of the cache, and leaving the directive in
   * place would quietly signal that a server fetch is still expected here.
   */
  it.each(ROUTES)("%s is not pinned to dynamic rendering", (route) => {
    // The directive itself, not the words — these files discuss `force-dynamic`
    // in prose to explain why it was removed.
    expect(read(route)).not.toMatch(/export\s+const\s+dynamic\s*=/);
  });
});

describe("the client-side fetch is the only pricing source", () => {
  it("lives in hooks/use-pricing.ts and is marked a client module", () => {
    const src = read("hooks/use-pricing.ts");
    expect(src).toMatch(/^"use client";/);
    expect(src).toMatch(/\/public\/pricing/);
  });

  /**
   * The header-forwarding module is gone, not merely unused. Left on disk it
   * would be imported again by the next person wiring up a pricing surface —
   * its name reads like the right tool for the job.
   */
  it("has no server-side pricing module left to import", () => {
    expect(() => read("lib/pricing.server.ts")).toThrow();
  });

  /**
   * Fail-closed, unchanged: an unreachable API must quote the most expensive
   * tier, never naira or PPP, and must carry no price IDs so checkout
   * classifies itself unavailable instead of billing against a stale id.
   */
  it("falls back to the most expensive tier with no price IDs", async () => {
    const { GLOBAL_FALLBACK } = await import("@/lib/pricing");
    expect(GLOBAL_FALLBACK.tier).toBe("GLOBAL");
    expect(GLOBAL_FALLBACK.currency).toBe("USD");
    expect(GLOBAL_FALLBACK.monthlyPriceId).toBe("");
    expect(GLOBAL_FALLBACK.annualPriceId).toBe("");
    expect(GLOBAL_FALLBACK.enterprise.monthlyPriceId).toBe("");
    expect(GLOBAL_FALLBACK.enterprise.annualPriceId).toBe("");
  });
});
