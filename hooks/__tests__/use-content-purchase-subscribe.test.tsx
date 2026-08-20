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

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (m: string) => toastError(m),
    success: (m: string) => toastSuccess(m),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light" }) }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@/lib/store", () => ({ useAppStore: () => ({}) }));
const fetchUser = vi.fn(async () => ({ data: { isPremium: false } as any }));
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


describe("AsyncPay — a failed start always reaches the buyer", () => {
  beforeEach(() => {
    asyncpayCheckout.mockClear();
    toastError.mockClear();
  });

  it("reports an HTTP failure that rejects WITHOUT calling onError", async () => {
    // A 401 from initialize-payment-request (bad key) rejects the promise
    // having rendered nothing and never calls onError. That combination used
    // to be completely silent: click Subscribe, nothing happens at all.
    asyncpayCheckout.mockRejectedValueOnce(new Error("401"));
    const { result } = await setup(NG);
    await act(async () => {
      await result.current.subscribe("monthly");
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("does not tell the buyer twice when onError AND the rejection both fire", async () => {
    asyncpayCheckout.mockImplementationOnce((opts: any) => {
      opts?.onError?.({ error_description: "declined" });
      return Promise.reject(new Error("declined"));
    });
    const { result } = await setup(NG);
    await act(async () => {
      await result.current.subscribe("monthly");
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});


describe("AsyncPay — already subscribed is recovery, not failure", () => {
  beforeEach(() => {
    asyncpayCheckout.mockClear();
    toastError.mockClear();
    toastSuccess.mockClear();
  });

  it("re-checks entitlement instead of telling a paying buyer to try again", async () => {
    // The exact loop this fixes: the buyer HAS paid, AsyncPay refuses a second
    // subscription, and "couldn't start checkout, try again" sends them round
    // the same circle forever while our side has simply not caught up.
    asyncpayCheckout.mockRejectedValueOnce({
      error: "CUSTOMER_ALREADY_SUBSCRIBED_TO_PLAN",
      error_description: "This resource requires the customer not to have an active subscription",
    });

    const { result } = await setup(NG);
    await act(async () => {
      await result.current.subscribe("monthly");
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(toastError).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/already subscribed/i),
    );
  });

  it("still reports a genuine failure as a failure", async () => {
    asyncpayCheckout.mockRejectedValueOnce({ error: "INCORRECT_PUBLIC_KEY" });
    const { result } = await setup(NG);
    await act(async () => {
      await result.current.subscribe("monthly");
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});


describe("Paddle — a failed checkout always reaches the buyer", () => {
  beforeEach(() => {
    paddleOpen.mockClear();
    toastError.mockClear();
    toastSuccess.mockClear();
    fetchUser.mockReset();
    fetchUser.mockResolvedValue({ data: { isPremium: false } });
  });

  it("says something when Paddle errors, instead of nothing at all", async () => {
    // The regression. This hook handled checkout.loaded, closed and completed
    // and had NO error case, so a declined card or a rejected price left the
    // buyer staring at a Subscribe button that had visibly done nothing.
    const { result } = await setup(GLOBAL);
    await act(async () => {
      await result.current.subscribe("monthly");
    });

    act(() =>
      paddleEvents.fire?.({
        name: "checkout.error",
        data: { error: { code: "transaction_payment_declined" } },
      }),
    );

    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("treats an already-subscribed error as recovery, exactly as AsyncPay does", async () => {
    // Symmetry with the AsyncPay suite above. A buyer whose payment HAS landed
    // must not be told to try again on either rail.
    fetchUser.mockResolvedValue({ data: { isPremium: true } });
    const { result } = await setup(GLOBAL);
    await act(async () => {
      await result.current.subscribe("monthly");
    });

    act(() =>
      paddleEvents.fire?.({
        name: "checkout.error",
        data: { error: { code: "subscription_already_exists" } },
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(toastError).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/already subscribed/i),
    );
  });

  it("keeps the wall up when the error arrives BEFORE the frame loads", async () => {
    // Ordering trap: checkout.error can precede checkout.loaded. Clearing the
    // in-flight flag on error would make that later loaded event look like a
    // one-off purchase, dismissing the caller's paywall and stranding the
    // buyer on content they still cannot open — the same class of bug as
    // reading custom_data off the wrong level of the payload.
    const onCheckoutOpened = vi.fn();
    const { result } = await (async () => {
      const r = renderHook(() =>
        useContentPurchase({
          data: {},
          pricing: GLOBAL,
          onPurchased: vi.fn(),
          onCheckoutOpened,
        }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      return r;
    })();

    await act(async () => {
      await result.current.subscribe("monthly");
    });

    act(() =>
      paddleEvents.fire?.({
        name: "checkout.error",
        data: { error: { code: "transaction_payment_declined" } },
      }),
    );
    act(() =>
      paddleEvents.fire?.({
        name: "checkout.loaded",
        data: { custom_data: { method: "subscription", id: "pro" } },
      }),
    );

    expect(onCheckoutOpened).not.toHaveBeenCalled();
  });
});

describe("post-purchase destination", () => {
  beforeEach(() => {
    asyncpayCheckout.mockClear();
    fetchUser.mockReset();
  });

  it("hands control to the caller instead of reloading, when it asks", async () => {
    // Onboarding is why this exists: a hard reload there re-mounts the wizard
    // and throws away every answer the learner just gave, when the page they
    // want is the lesson their path was built around.
    fetchUser.mockResolvedValue({ data: { isPremium: true } });
    const onPremiumConfirmed = vi.fn();
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, reload },
    });

    const { result } = renderHook(() =>
      useContentPurchase({
        data: {},
        pricing: NG,
        onPurchased: vi.fn(),
        onPremiumConfirmed,
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.subscribe("monthly");
    });

    const opts = asyncpayCheckout.mock.calls[0]?.[0] as
      | { onSuccess?: () => void }
      | undefined;
    await act(async () => {
      opts?.onSuccess?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onPremiumConfirmed).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  });

  it("applies to PADDLE too, not just AsyncPay", async () => {
    // Both providers funnel into the same confirm step, but they arrive by
    // completely different routes — AsyncPay through its onSuccess callback,
    // Paddle through a checkout.completed event on a callback registered once
    // at mount. Proving one says nothing about the other.
    fetchUser.mockResolvedValue({ data: { isPremium: true } });
    const onPremiumConfirmed = vi.fn();
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, reload },
    });

    const { result } = renderHook(() =>
      useContentPurchase({
        data: {},
        pricing: GLOBAL,
        onPurchased: vi.fn(),
        onPremiumConfirmed,
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.subscribe("monthly");
    });

    // Paddle's real payload shape: custom_data nested under data.
    await act(async () => {
      paddleEvents.fire?.({
        name: "checkout.completed",
        data: { custom_data: { method: "subscription", id: "pro" } },
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onPremiumConfirmed).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  });

  it("still reloads by default when no destination is given", async () => {
    // The paywall relies on this: entitlement changes the whole page, and
    // re-booting with isPremium already true beats re-deriving it in place.
    fetchUser.mockResolvedValue({ data: { isPremium: true } });
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, reload },
    });

    const { result } = renderHook(() =>
      useContentPurchase({ data: {}, pricing: GLOBAL, onPurchased: vi.fn() }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.subscribe("monthly");
    });
    await act(async () => {
      paddleEvents.fire?.({
        name: "checkout.completed",
        data: { custom_data: { method: "subscription", id: "pro" } },
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(reload).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  });
});
