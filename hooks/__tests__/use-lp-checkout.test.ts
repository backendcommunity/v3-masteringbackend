/**
 * The LP's checkout hook, with fake SDKs. Pins two things: (1) status
 * starts "loading" and becomes "ready" only once a price has actually
 * resolved, and (2) whichever processor's price ID gets opened is the ID
 * from the SAME response the displayed price came from — this is the exact
 * bug class lib/pricing.ts warns about (a buyer quoted one price and
 * charged another).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockAsyncpayCheckout = vi.fn();
const mockPaddleOpen = vi.fn();

vi.mock("@asyncpay/checkout", () => ({
  AsyncpayCheckout: (...args: any[]) => mockAsyncpayCheckout(...args),
}));

vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: () =>
    Promise.resolve({ Checkout: { open: mockPaddleOpen } }),
}));

let apiGetResponse: any;
vi.mock("@/lib/api", () => ({
  api: { get: (...args: any[]) => Promise.resolve(apiGetResponse) },
}));

import { useLpCheckout } from "@/hooks/use-lp-checkout";

beforeEach(() => {
  mockAsyncpayCheckout.mockReset();
  mockPaddleOpen.mockReset();
});

describe("useLpCheckout", () => {
  it("starts loading and becomes ready with the resolved NG price", async () => {
    apiGetResponse = {
      data: {
        data: {
          tier: "NG",
          country: "NG",
          provider: "ASYNCPAY",
          currency: "NGN",
          monthly: 9999,
          annual: 99990,
          monthlyPriceId: "async-monthly-id",
          annualPriceId: "async-annual-id",
          enterprise: {
            tier: "NG",
            provider: "ASYNCPAY",
            currency: "NGN",
            monthlyPerUser: 15000,
            annualPerUser: 150000,
            minSeats: 2,
            selfServe: true,
            monthlyPriceId: "",
            annualPriceId: "",
          },
        },
      },
    };

    const { result } = renderHook(() => useLpCheckout());
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.priceLabel).toBe("₦9,999");
    expect(result.current.provider).toBe("ASYNCPAY");
  });

  it("opens AsyncPay with the price ID from the SAME response as the displayed price", async () => {
    apiGetResponse = {
      data: {
        data: {
          tier: "NG",
          country: "NG",
          provider: "ASYNCPAY",
          currency: "NGN",
          monthly: 9999,
          annual: 99990,
          monthlyPriceId: "async-monthly-id",
          annualPriceId: "async-annual-id",
          enterprise: {
            tier: "NG",
            provider: "ASYNCPAY",
            currency: "NGN",
            monthlyPerUser: 15000,
            annualPerUser: 150000,
            minSeats: 2,
            selfServe: true,
            monthlyPriceId: "",
            annualPriceId: "",
          },
        },
      },
    };

    const { result } = renderHook(() => useLpCheckout());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => {
      result.current.pay({ name: "Chinedu Okafor", email: "chinedu@example.com" });
    });

    expect(mockAsyncpayCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionPlanUUID: "async-monthly-id",
        customer: expect.objectContaining({ email: "chinedu@example.com" }),
      }),
    );
    expect(mockPaddleOpen).not.toHaveBeenCalled();
  });

  it("opens Paddle instead, for a visitor who resolves outside Nigeria", async () => {
    apiGetResponse = {
      data: {
        data: {
          tier: "GLOBAL",
          country: "US",
          provider: "PADDLE",
          currency: "USD",
          monthly: 19.99,
          annual: 199.99,
          monthlyPriceId: "pri_global_monthly",
          annualPriceId: "pri_global_annual",
          enterprise: {
            tier: "GLOBAL",
            provider: "PADDLE",
            currency: "USD",
            monthlyPerUser: 25,
            annualPerUser: 250,
            minSeats: 2,
            selfServe: true,
            monthlyPriceId: "",
            annualPriceId: "",
          },
        },
      },
    };

    const { result } = renderHook(() => useLpCheckout());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.priceLabel).toBe("$19.99");

    act(() => {
      result.current.pay({ name: "Sam Lee", email: "sam@example.com" });
    });

    await waitFor(() =>
      expect(mockPaddleOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ priceId: "pri_global_monthly" }],
          customer: expect.objectContaining({ email: "sam@example.com" }),
        }),
      ),
    );
    expect(mockAsyncpayCheckout).not.toHaveBeenCalled();
  });

  it("does not call pay() before pricing has resolved", () => {
    apiGetResponse = { data: { data: null } };
    const { result } = renderHook(() => useLpCheckout());
    act(() => {
      result.current.pay({ name: "Too Soon", email: "early@example.com" });
    });
    expect(mockAsyncpayCheckout).not.toHaveBeenCalled();
    expect(mockPaddleOpen).not.toHaveBeenCalled();
  });
});
