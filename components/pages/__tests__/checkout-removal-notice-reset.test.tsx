/**
 * Pins the ONLY thing that hides the team-removal banner immediately after a
 * successful purchase.
 *
 * Neither checkout success path refetches the user object, so the banner's
 * own `isPremium` guard can't see a purchase that just happened — the sole
 * mechanism is `resetTeamRemovalNoticeCache()`, called from the Paddle
 * `checkout.completed` handler and the AsyncPay `onSuccess` handler. A prior
 * whole-branch review deleted both calls and the rest of the suite (banner
 * tests included) stayed green, because nothing exercised the WIRING —
 * only the reset function's own behaviour was tested. This file closes that
 * gap: it fails if either call site is removed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CheckoutPricing } from "@/lib/pricing";

// vi.mock factories are hoisted above the top of the file, so the spy has to
// be created through vi.hoisted rather than a plain module-level const.
const { resetTeamRemovalNoticeCache } = vi.hoisted(() => ({
  resetTeamRemovalNoticeCache: vi.fn(),
}));
vi.mock("@/components/team-removal-banner", () => ({
  resetTeamRemovalNoticeCache,
}));

let eventCallback: ((data: any) => void) | null = null;
let asyncpayOptions: any = null;
let search = new URLSearchParams("cycle=monthly");

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/checkout",
}));

vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: (opts: any) => {
    eventCallback = opts.eventCallback;
    return Promise.resolve({
      Checkout: { open: vi.fn(), updateItems: vi.fn(), close: vi.fn() },
    });
  },
}));

vi.mock("@asyncpay/checkout", () => ({
  AsyncpayCheckout: (opts: any) => {
    asyncpayOptions = opts;
    return Promise.resolve(undefined);
  },
}));

vi.mock("@/hooks/use-user", () => ({
  useUser: () => ({ id: "u1", email: "buyer@acme.com" }),
}));

const store = {
  getPlan: vi.fn().mockResolvedValue({ id: "plan-pro", name: "Pro" }),
};
vi.mock("@/lib/store", () => ({ useAppStore: () => store }));

vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../confetti-celebration", () => ({ default: () => null }));

import { CheckoutPage } from "@/components/pages/checkout";

// Pro, priced through Paddle — the default `?plan=` (absent means Pro).
const PADDLE_PRICING: CheckoutPricing = {
  country: "US",
  provider: "PADDLE",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  monthlyPriceId: "pri_pro_monthly",
  annualPriceId: "pri_pro_annual",
  enterprise: {
    tier: "GLOBAL",
    provider: "PADDLE",
    currency: "USD",
    monthlyPerUser: 29.99,
    annualPerUser: 299.99,
    minSeats: 2,
    selfServe: true,
    monthlyPriceId: "pri_ent_monthly",
    annualPriceId: "pri_ent_annual",
  },
} as unknown as CheckoutPricing;

// Pro, priced through AsyncPay — the NG rail.
const ASYNCPAY_PRICING: CheckoutPricing = {
  country: "NG",
  provider: "ASYNCPAY",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  monthlyPriceId: "asyncpay-plan-uuid-monthly",
  annualPriceId: "asyncpay-plan-uuid-annual",
  enterprise: {
    tier: "NG",
    provider: "ASYNCPAY",
    currency: "NGN",
    monthlyPerUser: 15000,
    annualPerUser: 150000,
    minSeats: 2,
    selfServe: true,
    monthlyPriceId: "asyncpay-ent-uuid-monthly",
    annualPriceId: "asyncpay-ent-uuid-annual",
  },
} as unknown as CheckoutPricing;

describe("checkout success invalidates the removal-notice cache", () => {
  beforeEach(() => {
    resetTeamRemovalNoticeCache.mockClear();
    store.getPlan.mockClear();
    store.getPlan.mockResolvedValue({ id: "plan-pro", name: "Pro" });
    eventCallback = null;
    asyncpayOptions = null;
    search = new URLSearchParams("cycle=monthly");
  });

  it("resets the cache when Paddle reports checkout.completed", async () => {
    render(<CheckoutPage pricing={PADDLE_PRICING} tier="GLOBAL" />);

    await waitFor(() => expect(eventCallback).not.toBeNull());
    expect(resetTeamRemovalNoticeCache).not.toHaveBeenCalled();

    eventCallback!({ name: "checkout.completed" });

    expect(resetTeamRemovalNoticeCache).toHaveBeenCalledTimes(1);
  });

  it("resets the cache when AsyncPay reports onSuccess", async () => {
    render(<CheckoutPage pricing={ASYNCPAY_PRICING} tier="NG" />);

    const subscribeButtons = await screen.findAllByRole("button", {
      name: "Subscribe",
    });
    fireEvent.click(subscribeButtons[0]);

    await waitFor(() => expect(asyncpayOptions?.onSuccess).toBeTypeOf("function"));
    expect(resetTeamRemovalNoticeCache).not.toHaveBeenCalled();

    asyncpayOptions.onSuccess();

    expect(resetTeamRemovalNoticeCache).toHaveBeenCalledTimes(1);
  });
});
