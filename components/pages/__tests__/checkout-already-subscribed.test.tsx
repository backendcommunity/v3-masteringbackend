/**
 * Regression: ISSUE-001 — checkout told Enterprise customers they were on Pro
 * Found by /qa on 2026-09-03
 * Report: .gstack/qa-reports/qa-report-localhost-3002-2026-09-03.md
 *
 * `isPro` is `user.isPremium`, which is true for Enterprise too, so the
 * already-subscribed card hardcoded "You're on Pro" for every paying
 * customer — including a team that had just bought per-seat Enterprise.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CheckoutPricing } from "@/lib/pricing";

let currentUser: any = null;

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("plan=enterprise&cycle=annual"),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/checkout",
}));
vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: () => Promise.resolve(undefined),
}));
vi.mock("@asyncpay/checkout", () => ({ AsyncpayCheckout: vi.fn() }));
vi.mock("@/hooks/use-user", () => ({ useUser: () => currentUser }));

const store = {
  getPlan: vi.fn().mockResolvedValue({ id: "plan-ent", name: "Enterprise" }),
};
vi.mock("@/lib/store", () => ({ useAppStore: () => store }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../confetti-celebration", () => ({ default: () => null }));

import { CheckoutPage } from "@/components/pages/checkout";

const PRICING = {
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
    monthlyPerUser: 25,
    annualPerUser: 250,
    minSeats: 2,
    selfServe: true,
    monthlyPriceId: "pri_ent_monthly",
    annualPriceId: "pri_ent_annual",
  },
} as unknown as CheckoutPricing;

const subscriber = (subscription: Record<string, unknown> | null) => ({
  id: "u1",
  email: "owner@acme.com",
  isPremium: true,
  subscription,
});

describe("the already-subscribed card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.getPlan.mockResolvedValue({ id: "plan-ent", name: "Enterprise" });
  });

  it("names Enterprise for an Enterprise subscriber", async () => {
    currentUser = subscriber({ name: "Enterprise", expiry: null });
    render(<CheckoutPage pricing={PRICING} tier="GLOBAL" />);

    expect(await screen.findByText("You're on Enterprise")).toBeInTheDocument();
    expect(screen.queryByText("You're on Pro")).not.toBeInTheDocument();
  });

  it("still names Pro for a Pro subscriber", async () => {
    currentUser = subscriber({ name: "Pro", expiry: null });
    render(<CheckoutPage pricing={PRICING} tier="GLOBAL" />);

    expect(await screen.findByText("You're on Pro")).toBeInTheDocument();
  });

  // The plan record is the fallback when the subscription row carries no name
  // of its own — some providers write only the joined plan.
  it("falls back to the plan record's name", async () => {
    currentUser = subscriber({ plan: { name: "Enterprise" }, expiry: null });
    render(<CheckoutPage pricing={PRICING} tier="GLOBAL" />);

    expect(await screen.findByText("You're on Enterprise")).toBeInTheDocument();
  });

  /**
   * With no name anywhere, say so rather than guess. Guessing "Pro" is
   * exactly what produced the original bug.
   */
  it("names no plan at all rather than guessing", async () => {
    currentUser = subscriber({ expiry: null });
    render(<CheckoutPage pricing={PRICING} tier="GLOBAL" />);

    expect(
      await screen.findByText("You already have a subscription"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/You're on/)).not.toBeInTheDocument();
  });
});
