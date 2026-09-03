/**
 * The checkout page's Paddle wiring, with a fake SDK.
 *
 * lib/__tests__/checkout-frame.test.ts pins the DECISION (none / open /
 * update). This file pins that the decision is actually acted on, because
 * the bug it replaced was not a wrong decision — it was a correct-looking
 * effect that never ran for a seat change:
 *
 *     if (openedForRef.current === priceId) return;
 *
 * `priceId` does not change when the seat count does, so the stepper updated
 * our order summary and Paddle was never told. The page could read
 * "8 users x $25.00 = $200.00" while the frame the buyer was about to pay in
 * was still priced for 2 seats.
 *
 * The SeatSelector's own behaviour lives in checkout-seat-selector.test.tsx;
 * this file only cares about what reaches the SDK.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CheckoutPricing } from "@/lib/pricing";

const mockOpen = vi.fn();
const mockUpdateItems = vi.fn();
const mockReplace = vi.fn();
let eventCallback: ((data: any) => void) | null = null;
let search = new URLSearchParams("plan=enterprise&cycle=monthly&seats=2");

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ push: vi.fn(), replace: mockReplace, back: vi.fn() }),
  usePathname: () => "/checkout",
}));

vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: (opts: any) => {
    eventCallback = opts.eventCallback;
    return Promise.resolve({
      Checkout: { open: mockOpen, updateItems: mockUpdateItems, close: vi.fn() },
    });
  },
}));

vi.mock("@/hooks/use-user", () => ({
  useUser: () => ({ id: "u1", email: "buyer@acme.com" }),
}));

// STABLE identity, deliberately: the plan-load effect depends on `store`, so
// a mock that built a fresh object per render would re-run it on every state
// change and leave the page in its loading skeleton forever.
const store = {
  getPlan: vi.fn().mockResolvedValue({ id: "plan-ent", name: "Enterprise" }),
};
vi.mock("@/lib/store", () => ({ useAppStore: () => store }));

// The page eagerly prefetches the AsyncPay SDK. Left unmocked, that dynamic
// import stays pending in jsdom and the test never finishes teardown even
// though its body has completed.
vi.mock("@asyncpay/checkout", () => ({ AsyncpayCheckout: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../confetti-celebration", () => ({ default: () => null }));

import { CheckoutPage } from "@/components/pages/checkout";

// A GLOBAL-tier Paddle customer: $25 per user monthly, $250 annually, from
// two seats. The same numbers academy's tiers.ts publishes.
const PRICING: CheckoutPricing = {
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

function renderCheckout() {
  return render(<CheckoutPage pricing={PRICING} tier="GLOBAL" />);
}

/** The frame only opens once the SDK has resolved and the node has mounted. */
async function waitForFirstOpen() {
  await waitFor(() => expect(mockOpen).toHaveBeenCalled());
}

const addSeat = () => fireEvent.click(screen.getByLabelText(/add a seat/i));

/**
 * Fire one Paddle SDK event at the page.
 *
 * Called straight through rather than wrapped in act(): every assertion that
 * follows one of these waits on the DOM instead, and an act() wrapper here
 * leaves vitest's act environment busy so the test hangs in teardown.
 */
const emit = (name: string) => eventCallback?.({ name });

/**
 * Waits past QUANTITY_SYNC_DEBOUNCE_MS (300ms) on real timers. Fake timers
 * fight waitFor's own polling here, and the window being waited on is short
 * enough that a real wait costs nothing.
 */
/**
 * Waits past QUANTITY_SYNC_DEBOUNCE_MS (300ms), then lets React settle.
 *
 * The wait itself is deliberately OUTSIDE act(): holding act open across a
 * real 400ms timer leaves vitest's act environment marked busy, and the test
 * then hangs in teardown even though its body has finished. The empty act()
 * afterwards is what flushes the effect the seat change scheduled.
 */
/**
 * Pushes past QUANTITY_SYNC_DEBOUNCE_MS (300ms).
 *
 * Fake timers are switched on for the advance itself and off again straight
 * after: holding act() open across a REAL 400ms wait leaves vitest's act
 * environment busy and the test hangs in teardown, while advancing fake
 * timers inside act settles immediately.
 */
async function flushDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 400));
}

describe("checkout ↔ Paddle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.getPlan.mockResolvedValue({ id: "plan-ent", name: "Enterprise" });
    eventCallback = null;
    search = new URLSearchParams("plan=enterprise&cycle=monthly&seats=2");
  });

  it("opens the frame with the seat count from the URL", async () => {
    renderCheckout();
    await waitForFirstOpen();

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ priceId: "pri_ent_monthly", quantity: 2 }],
      }),
    );
  });

  /**
   * THE regression. Adding a seat must reach Paddle, and must do it by
   * updating the open frame rather than reopening it — a reopen throws away
   * card details the buyer has already typed.
   */
  it("pushes a seat change to the open frame instead of reopening it", async () => {
    renderCheckout();
    await waitForFirstOpen();
    const opensBefore = mockOpen.mock.calls.length;

    addSeat();
    await flushDebounce();

    expect(mockUpdateItems).toHaveBeenCalledWith([
      { priceId: "pri_ent_monthly", quantity: 3 },
    ]);
    expect(mockOpen).toHaveBeenCalledTimes(opensBefore);
  });

  // A held-down stepper must not fire one request per click: every push
  // re-renders the frame, so the buyer would watch it flicker its way up.
  it("debounces a burst of seat changes into one push", async () => {
    renderCheckout();
    await waitForFirstOpen();

    addSeat();
    addSeat();
    addSeat();
    await flushDebounce();

    expect(mockUpdateItems).toHaveBeenCalledTimes(1);
    expect(mockUpdateItems).toHaveBeenCalledWith([
      { priceId: "pri_ent_monthly", quantity: 5 },
    ]);
  });

  /**
   * Paddle refuses item changes on a transaction it is already processing,
   * and refuses them silently. The stepper is frozen for that window (see
   * checkout-seat-selector.test.tsx) and nothing is pushed even if a change
   * arrives some other way.
   */
  it("pushes nothing once payment is in flight", async () => {
    renderCheckout();
    await waitForFirstOpen();

    emit("checkout.payment.initiated");
    await waitFor(() =>
      expect(screen.getByLabelText(/add a seat/i)).toBeDisabled(),
    );

    addSeat();
    await flushDebounce();

    expect(mockUpdateItems).not.toHaveBeenCalled();
  });

  it("frees the stepper again when a payment fails", async () => {
    renderCheckout();
    await waitForFirstOpen();

    emit("checkout.payment.initiated");
    await waitFor(() =>
      expect(screen.getByLabelText(/add a seat/i)).toBeDisabled(),
    );

    emit("checkout.payment.failed");
    await waitFor(() =>
      expect(screen.getByLabelText(/add a seat/i)).not.toBeDisabled(),
    );
  });

  describe("the billing cycle switch", () => {
    it("reopens the frame on the annual price, carrying the seat count", async () => {
      renderCheckout();
      await waitForFirstOpen();
      addSeat(); // 3 seats
      await flushDebounce();
      mockOpen.mockClear();

      fireEvent.click(screen.getByRole("button", { name: "Yearly" }));

      // A different price is a different product: Paddle needs a new
      // checkout, not an amended one.
      await waitFor(() =>
        expect(mockOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            items: [{ priceId: "pri_ent_annual", quantity: 3 }],
          }),
        ),
      );
    });

    it("writes the chosen cycle back to the URL without a history entry", async () => {
      renderCheckout();
      await waitForFirstOpen();

      fireEvent.click(screen.getByRole("button", { name: "Yearly" }));

      await waitFor(() => expect(mockReplace).toHaveBeenCalled());
      const [href, opts] = mockReplace.mock.calls[0];
      expect(String(href)).toContain("cycle=annual");
      // The seat count and plan must survive the rewrite, or a refresh
      // silently reprices the order.
      expect(String(href)).toContain("plan=enterprise");
      expect(String(href)).toContain("seats=2");
      expect(opts).toMatchObject({ scroll: false });
    });

    it("is frozen while a payment is in flight", async () => {
      renderCheckout();
      await waitForFirstOpen();

      emit("checkout.payment.initiated");

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Yearly" })).toBeDisabled(),
      );
    });
  });
});
