import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import type { CheckoutCapablePricing } from "@/hooks/use-pricing";

// The rail under test is the one that moves money, so the two SDKs are the
// only things stubbed. Everything about WHICH price and WHICH processor is
// real.
const paddleOpen = vi.fn();
// Captures the eventCallback so tests can fire Paddle's real payloads at it.
const paddleEvents: { fire: ((e: unknown) => void) | null } = { fire: null };
vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: vi.fn(async (opts: { eventCallback?: (e: unknown) => void }) => {
    paddleEvents.fire = opts?.eventCallback ?? null;
    return { Checkout: { open: paddleOpen } };
  }),
}));

const asyncpayCheckout = vi.fn(async (_opts?: any) => undefined);
vi.mock("@asyncpay/checkout", () => ({
  AsyncpayCheckout: (opts: unknown) => asyncpayCheckout(opts),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn() } }));
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light" }) }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@/lib/store", () => ({ useAppStore: () => ({}) }));
const fetchUser = vi.fn(async () => ({ data: { isPremium: false } }));
vi.mock("@/lib/auth", () => ({ fetchUser: () => fetchUser() }));
vi.mock("@/lib/user-store", () => ({ setStoredUser: vi.fn() }));
vi.mock("@/hooks/use-user", () => ({
  useUser: () => ({ email: "learner@example.com", name: "Ada L", country: "NG" }),
}));

import { useContentPurchase } from "@/hooks/use-content-purchase";

const NG: CheckoutCapablePricing = {
  tier: "NG",
  country: "NG",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  provider: "ASYNCPAY",
  monthlyPriceId: "ng-monthly",
  annualPriceId: "ng-annual",
  enterprise: {
    tier: "NG",
    currency: "NGN",
    monthlyPerUser: 15000,
    annualPerUser: 150000,
    minSeats: 2,
    selfServe: false,
  },
} as unknown as CheckoutCapablePricing;

const GLOBAL: CheckoutCapablePricing = {
  ...NG,
  tier: "GLOBAL",
  country: "US",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  provider: "PADDLE",
  monthlyPriceId: "us-monthly",
  annualPriceId: "us-annual",
} as unknown as CheckoutCapablePricing;

async function setup(
  pricing: CheckoutCapablePricing | null,
  planName: "Pro" | "Enterprise" = "Pro",
) {
  const onPurchased = vi.fn();
  const { result } = renderHook(() =>
    useContentPurchase({ data: {}, pricing, planName, onPurchased }),
  );
  // initializePaddle resolves on a microtask, and the instance only lands in
  // state afterwards. Without flushing, every Paddle assertion here would be
  // testing the pre-init window rather than the rail.
  await act(async () => {
    await Promise.resolve();
  });
  return { result, onPurchased };
}

describe("subscribe() — provider routing", () => {
  beforeEach(() => {
    paddleOpen.mockClear();
    asyncpayCheckout.mockClear();
  });

  it("opens AsyncPay for a Nigerian buyer", async () => {
    const { result } = await setup(NG);
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.subscribe("monthly");
    });
    expect(started).toBe(true);
    expect(asyncpayCheckout).toHaveBeenCalled();
    expect(paddleOpen).not.toHaveBeenCalled();
  });

  it("opens Paddle for everyone else", async () => {
    const { result } = await setup(GLOBAL);
    await act(async () => {
      await result.current.subscribe("annual");
    });
    expect(paddleOpen).toHaveBeenCalled();
    expect(asyncpayCheckout).not.toHaveBeenCalled();
  });
});

describe("subscribe() — the price charged matches the price shown", () => {
  beforeEach(() => {
    paddleOpen.mockClear();
    asyncpayCheckout.mockClear();
  });

  it("uses the ANNUAL price id when annual was quoted", async () => {
    const { result } = await setup(GLOBAL);
    await act(async () => {
      await result.current.subscribe("annual");
    });
    expect(paddleOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ priceId: "us-annual", quantity: 1 }],
      }),
    );
  });

  it("uses the MONTHLY price id when monthly was quoted", async () => {
    // Onboarding quotes the plain monthly rate while the paywall quotes the
    // annual equivalent. A hardcoded cycle here would charge one of them a
    // price they were never shown.
    const { result } = await setup(GLOBAL);
    await act(async () => {
      await result.current.subscribe("monthly");
    });
    expect(paddleOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ priceId: "us-monthly", quantity: 1 }],
      }),
    );
  });

  it("pins the country to the same response that produced the price", async () => {
    // Left to itself Paddle geo-detects and can bill a tier we never quoted —
    // the bug that made an earlier inline attempt charge a Nigerian buyer the
    // legacy USD amount after quoting ₦9,999.
    const { result } = await setup(GLOBAL);
    await act(async () => {
      await result.current.subscribe("annual");
    });
    expect(paddleOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          address: { countryCode: "US" },
        }),
      }),
    );
  });
});

describe("subscribe() — refuses rather than guessing", () => {
  beforeEach(() => {
    paddleOpen.mockClear();
    asyncpayCheckout.mockClear();
  });

  it("reports failure for Enterprise, which needs the seat selector", async () => {
    const { result } = await setup(GLOBAL, "Enterprise");
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.subscribe("annual");
    });
    expect(started).toBe(false);
    expect(paddleOpen).not.toHaveBeenCalled();
  });

  it("reports failure with no pricing at all", async () => {
    const { result } = await setup(null);
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.subscribe("annual");
    });
    expect(started).toBe(false);
  });

  it("reports failure when the tier carries no price id for that cycle", async () => {
    const { result } = await setup({
      ...GLOBAL,
      annualPriceId: "",
    } as CheckoutCapablePricing);
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.subscribe("annual");
    });
    // False means the caller sends them to /checkout. Opening a checkout with
    // an empty price id would fail in front of the buyer instead.
    expect(started).toBe(false);
    expect(paddleOpen).not.toHaveBeenCalled();
  });
});


describe("subscribe() — the wall survives a cancelled processor window", () => {
  beforeEach(() => {
    paddleOpen.mockClear();
    asyncpayCheckout.mockClear();
  });

  it("does not dismiss the caller's sheet when AsyncPay is closed", async () => {
    const onCheckoutOpened = vi.fn();
    const { result } = await (async () => {
      const onPurchased = vi.fn();
      const r = renderHook(() =>
        useContentPurchase({
          data: {},
          pricing: NG,
          onPurchased,
          onCheckoutOpened,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      return { result: r.result };
    })();

    await act(async () => {
      await result.current.subscribe("monthly");
    });

    // Fire the SDK's own close callback, as a buyer backing out would.
    const opts = asyncpayCheckout.mock.calls[0]?.[0] as
      | { onClose?: () => void }
      | undefined;
    act(() => opts?.onClose?.());

    // Backing out must leave them ON the paywall. Dismissing it here would
    // strand them on content they still cannot open.
    expect(onCheckoutOpened).not.toHaveBeenCalled();
  });

  it("marks the CTA busy while the backend catches up", async () => {
    fetchUser.mockResolvedValue({ data: { isPremium: false } });
    const { result } = await setup(NG);
    await act(async () => {
      await result.current.subscribe("monthly");
    });
    expect(result.current.confirmingPurchase).toBe(false);

    const opts = asyncpayCheckout.mock.calls[0]?.[0] as
      | { onSuccess?: () => void }
      | undefined;
    act(() => opts?.onSuccess?.());

    // The SDK saying "paid" is not the backend saying "entitled". Until it
    // does, the button must not be clickable again.
    expect(result.current.confirmingPurchase).toBe(true);
  });
});


describe("Paddle event payload — the shape the SDK actually sends", () => {
  beforeEach(() => {
    paddleOpen.mockClear();
    asyncpayCheckout.mockClear();
  });

  it("never dismisses the caller's sheet when a SUBSCRIPTION frame loads", async () => {
    const onCheckoutOpened = vi.fn();
    const onPurchased = vi.fn();
    const { result } = renderHook(() =>
      useContentPurchase({
        data: {},
        pricing: GLOBAL,
        onPurchased,
        onCheckoutOpened,
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.subscribe("monthly");
    });

    // The REAL shape: PaddleEventData is { name, data: CheckoutEventsData },
    // so custom_data is nested under `data`. Reading event.custom_data — as
    // this hook used to — yields undefined, which made every subscription
    // look like a one-off and closed the paywall the instant the frame
    // loaded. That is the bug this test exists for.
    act(() =>
      paddleEvents.fire?.({
        name: "checkout.loaded",
        data: { custom_data: { method: "subscription", id: "pro" } },
      }),
    );

    expect(onCheckoutOpened).not.toHaveBeenCalled();
  });

  it("still dismisses it for a ONE-OFF purchase, which is what that hook is for", async () => {
    const onCheckoutOpened = vi.fn();
    renderHook(() =>
      useContentPurchase({
        data: { id: "course-1", type: "course" },
        onPurchased: vi.fn(),
        onCheckoutOpened,
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    // No subscribe() call, so nothing is in flight and the payload says
    // nothing about a subscription.
    act(() =>
      paddleEvents.fire?.({
        name: "checkout.loaded",
        data: { custom_data: { method: "individual", id: "course-1" } },
      }),
    );

    expect(onCheckoutOpened).toHaveBeenCalledTimes(1);
  });

  it("reads the id and method from event.data.custom_data on completion", async () => {
    const onPurchased = vi.fn();
    renderHook(() =>
      useContentPurchase({
        data: { id: "course-1", type: "course" },
        onPurchased,
        onCheckoutOpened: vi.fn(),
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    act(() =>
      paddleEvents.fire?.({
        name: "checkout.completed",
        data: { custom_data: { id: "course-1", method: "individual" } },
      }),
    );

    // Previously this reported (undefined, undefined) because the fields were
    // read one level too high.
    expect(onPurchased).toHaveBeenCalledWith("course-1", "individual", true);
  });
});


describe("AsyncPay — a late rejection must not look like a failed start", () => {
  beforeEach(() => {
    paddleOpen.mockClear();
    asyncpayCheckout.mockClear();
  });

  it("reports success as soon as the SDK is handed the checkout", async () => {
    // The SDK's promise settles when the payment FLOW ends — a closed window
    // or a declined card rejects it. Awaiting that made subscribe() report
    // "could not start", and the caller then navigated to /checkout on top of
    // a modal the SDK had already rendered. That is the reported bug.
    asyncpayCheckout.mockRejectedValueOnce(new Error("buyer closed the window"));

    const { result } = await setup(NG);
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.subscribe("monthly");
    });

    expect(asyncpayCheckout).toHaveBeenCalled();
    // True means "the processor has it" — the caller stays put.
    expect(started).toBe(true);
  });

  it("does report failure when the SDK throws before rendering anything", async () => {
    asyncpayCheckout.mockImplementationOnce(() => {
      throw new Error("validation failed");
    });

    const { result } = await setup(NG);
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.subscribe("monthly");
    });

    // Nothing was shown, so routing to /checkout is the honest outcome.
    expect(started).toBe(false);
  });
});
