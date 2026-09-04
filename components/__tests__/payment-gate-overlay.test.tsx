import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  PaymentGateOverlay,
  truncateForSubheading,
} from "@/components/payment-gate-overlay";
import type { PublicPricing } from "@/lib/pricing";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/courses/distributed-systems",
}));

const track = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: { track: (event: string, props?: unknown) => track(event, props) },
}));

// The one-off rails talk to Paddle and the store; neither belongs in a
// render test, and the hook is exercised through its own call sites.
const buyOnce = vi.fn();
// Resolves false by default = "inline could not start", which is the path
// that must always land the buyer on /checkout rather than nowhere.
const subscribe = vi.fn(async () => false);
vi.mock("@/hooks/use-content-purchase", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/use-content-purchase")
  >("@/hooks/use-content-purchase");
  return {
    ...actual,
    useContentPurchase: () => ({
      buyOnce,
      subscribe,
      payWithAsyncpay: vi.fn(),
    }),
  };
});

vi.mock("@/hooks/use-pricing", () => ({
  usePricing: () => null,
  useCheckoutPricing: () => null,
}));
vi.mock("@/hooks/use-user", () => ({ useUser: () => ({ points: 3200 }) }));

const ngPricing: PublicPricing = {
  tier: "NG",
  country: "NG",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  enterprise: {
    tier: "NG",
    currency: "NGN",
    monthlyPerUser: 15000,
    annualPerUser: 150000,
    minSeats: 2,
    selfServe: false,
  },
};

const usPricing: PublicPricing = {
  ...ngPricing,
  tier: "GLOBAL",
  country: "US",
  currency: "USD",
  monthly: 15,
  annual: 150,
};

function renderGate(props: Partial<React.ComponentProps<typeof PaymentGateOverlay>> = {}) {
  return render(
    <PaymentGateOverlay
      open
      onClose={vi.fn()}
      itemTitle="Distributed Systems in Practice"
      variant="centered"
      pricing={ngPricing}
      {...props}
    />,
  );
}

describe("PaymentGateOverlay", () => {
  beforeEach(() => {
    push.mockClear();
    track.mockClear();
    buyOnce.mockClear();
    subscribe.mockClear();
    subscribe.mockResolvedValue(false);
  });

  it("leads with the subscribe headline and names the gated item", () => {
    renderGate();
    expect(
      screen.getByText(/out of free content\. Subscribe to keep going/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Unlock Distributed Systems in Practice/i),
    ).toBeInTheDocument();
  });

  it("quotes exactly one number — the monthly rate it charges", () => {
    renderGate();
    expect(screen.getByText("₦9,999")).toBeInTheDocument();
    expect(screen.getByText("per month")).toBeInTheDocument();
    // The annual alternative is gone: a panel that charges monthly should not
    // put a second, different number in front of the buyer.
    expect(screen.queryByText(/billed annually/)).not.toBeInTheDocument();
    expect(screen.queryByText(/₦8,333/)).not.toBeInTheDocument();
  });

  it("quotes dollars for a global visitor", () => {
    renderGate({ pricing: usPricing });
    expect(screen.getByText("$15.00")).toBeInTheDocument();
    expect(screen.getByText("per month")).toBeInTheDocument();
  });

  it("names the payment methods the buyer's region will actually get", () => {
    renderGate();
    expect(screen.getByText(/Card · Bank transfer · USSD/)).toBeInTheDocument();

    renderGate({ pricing: usPricing });
    expect(screen.getByText(/Card · PayPal · Apple Pay/)).toBeInTheDocument();
  });

  it("shows NO price at all until the region resolves", () => {
    renderGate({ pricing: undefined });
    expect(screen.getByRole("button", { name: "Subscribe Now" })).toBeInTheDocument();
    expect(screen.queryByText(/billed annually/)).not.toBeInTheDocument();
    expect(screen.queryByText(/₦/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  describe("Subscribe opens payment in place, and never dead-ends", () => {
    it("asks for the MONTHLY cycle — the rate this panel puts on screen", async () => {
      subscribe.mockResolvedValue(true);
      renderGate();
      fireEvent.click(screen.getByRole("button", { name: "Subscribe Now" }));
      // Charging the annual price while quoting a monthly one (or the
      // reverse) is the exact failure regional pricing exists to prevent.
      await waitFor(() => expect(subscribe).toHaveBeenCalledWith("monthly"));
    });

    it("leads with the same rate it charges", async () => {
      renderGate();
      // ₦9,999 is the monthly rate; ₦8,333 is the annual equivalent. The hero
      // number and the cycle passed to subscribe() have to be the same deal,
      // so this fails the moment one is changed without the other.
      const hero = screen.getByText("₦9,999");
      expect(hero).toBeInTheDocument();
      expect(screen.getByText("per month")).toBeInTheDocument();
    });

    it("stays on the page when the processor opened in place", async () => {
      subscribe.mockResolvedValue(true);
      renderGate();
      fireEvent.click(screen.getByRole("button", { name: "Subscribe Now" }));
      await waitFor(() => expect(subscribe).toHaveBeenCalled());
      // The whole point: the learner keeps the lesson they were reading.
      expect(push).not.toHaveBeenCalled();
    });

    it("falls back to /checkout when inline cannot start", async () => {
      // Enterprise, a missing price ID, a blocked SDK — all report false, and
      // all must still leave the buyer somewhere they can pay.
      subscribe.mockResolvedValue(false);
      renderGate();
      fireEvent.click(screen.getByRole("button", { name: "Subscribe Now" }));
      await waitFor(() =>
        expect(push).toHaveBeenCalledWith("/checkout?plan=pro&cycle=monthly"),
      );
    });
  });

  it("hides the one-off rail for an item that is not sold separately", () => {
    renderGate({
      purchasable: { id: "path-1", amount: 29 },
      allowOneTime: false,
    });
    expect(screen.queryByRole("button", { name: /Buy once/ })).not.toBeInTheDocument();
  });

  it("offers the one-off rail for a separately purchasable course", () => {
    renderGate({ purchasable: { id: "course-1", amount: 49 } });
    fireEvent.click(screen.getByRole("button", { name: /Buy once/ }));
    expect(buyOnce).toHaveBeenCalledTimes(1);
  });

  it("never offers a points/MB rail — that rail was removed", () => {
    renderGate({ purchasable: { id: "course-1", amount: 49 } });
    expect(screen.queryByRole("button", { name: /Redeem/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/MB/)).not.toBeInTheDocument();
  });

  it("offers all three exits: continue free, tell us why, compare plans", () => {
    const onContinueFree = vi.fn();
    renderGate({ onContinueFree });

    fireEvent.click(
      screen.getByRole("button", { name: "Continue with the free plan" }),
    );
    expect(onContinueFree).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "payment_gate_continue_free",
      expect.anything(),
    );

    // Asserted BEFORE the feedback dialog opens: Radix marks the rest of the
    // tree aria-hidden while a nested modal is up, so a role query would
    // stop seeing this link afterwards.
    expect(
      screen.getByRole("link", { name: "Compare all plans" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tell us why" }));
    expect(track).toHaveBeenCalledWith(
      "payment_gate_tell_us_why",
      expect.anything(),
    );
  });

  describe("long titles cannot destabilise the panel", () => {
    it("leaves a normal title untouched", () => {
      expect(truncateForSubheading("Distributed Systems in Practice")).toBe(
        "Distributed Systems in Practice",
      );
    });

    it("truncates a very long title on a word boundary", () => {
      const long =
        "Advanced Distributed Systems, Consensus and Replication for Backend Engineers";
      const out = truncateForSubheading(long);
      expect(out.length).toBeLessThanOrEqual(48);
      expect(out.endsWith("\u2026")).toBe(true);
      const stem = out.slice(0, -1);
      // A prefix of the original, cut where a space was — not a mid-word chop
      // that would read as a rendering glitch.
      expect(long.startsWith(stem)).toBe(true);
      expect(long.charAt(stem.length)).toBe(" ");
    });

    it("keeps the personalisation claim intact — it is the whole point", () => {
      renderGate({
        itemTitle:
          "Advanced Distributed Systems, Consensus and Replication for Backend Engineers",
      });
      // Clamping the LINE would have cut this tail instead, removing the only
      // part of the sentence doing persuasive work.
      expect(
        screen.getByText(/get lessons entirely personalized to you/),
      ).toBeInTheDocument();
    });
  });

  // Mobile is the harder half: the side composition is hidden below sm, the
  // sheet is a fixed-height grid, and touch targets have a floor. None of that
  // is visible in a desktop render, so it gets pinned here.
  describe("mobile", () => {
    it("still shows brand on phones, where the side panel is hidden", () => {
      renderGate();
      const dialog = screen.getByRole("dialog");
      const side = dialog.querySelector('[class*="hidden"][class*="sm:block"]');
      expect(side).toBeTruthy();
      // …so something branded has to take its place below sm, or a phone gets
      // a plain white box on the highest-intent surface in the funnel.
      const band = dialog.querySelector('[class*="sm:hidden"][class*="#0E1F33"]');
      expect(band).toBeTruthy();
    });

    it("lets the content column scroll instead of overflowing the sheet", () => {
      renderGate({ variant: "sheet", exitLabel: "Back to path" });
      const panel = screen
        .getByRole("dialog")
        .querySelector('[class*="overflow-y-auto"]') as HTMLElement;
      // In a grid row, overflow-y-auto is inert without min-h-0: the row sizes
      // to content and blows past the shell's max-h rather than scrolling.
      expect(panel.className).toContain("min-h-0");
    });

    it("keeps every control at a 44px touch target on mobile", () => {
      renderGate({ purchasable: { id: "c1", amount: 49 } });
      const dialog = screen.getByRole("dialog");
      dialog.querySelectorAll("button, a[href]").forEach((el) => {
        const c = el.className;
        if (!c.includes("h-9") && !c.includes("h-11")) return;
        // size="sm" is h-9 (36px). Anything using it must lift to h-11 below sm.
        if (c.includes("h-9")) expect(c).toContain("h-11");
      });
    });

    it("gives the primary CTA the full width on mobile", () => {
      renderGate();
      const cta = screen.getByRole("button", { name: "Subscribe Now" });
      expect(cta.className).toContain("w-full");
      expect(cta.className).toContain("sm:w-auto");
    });
  });

  // These four behaviours came free with the dialog library the overlay no
  // longer uses. They are now hand-rolled in the component, so they need
  // pinning — a paywall that traps or strands keyboard users is worse than
  // one that looks slightly off.
  describe("modal behaviours (hand-rolled, no dialog library)", () => {
    it("renders nothing at all when closed", () => {
      renderGate({ open: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("exposes itself as a modal dialog labelled by its headline", () => {
      renderGate();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "payment-gate-headline");
    });

    it("dismisses on Escape (centered variant only)", () => {
      const onClose = vi.fn();
      renderGate({ onClose });
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("locks page scroll while open and restores it on unmount", () => {
      const { unmount } = renderGate();
      expect(document.body.style.overflow).toBe("hidden");
      unmount();
      expect(document.body.style.overflow).not.toBe("hidden");
    });

    it("wraps Tab from the last control back to the first instead of escaping to the page", () => {
      renderGate();
      const dialog = screen.getByRole("dialog");
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      last.focus();
      fireEvent.keyDown(dialog, { key: "Tab" });
      expect(document.activeElement).toBe(first);
    });

    it("wraps Shift+Tab from the first control to the last", () => {
      renderGate();
      const dialog = screen.getByRole("dialog");
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      first.focus();
      fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(last);
    });

    it("closes on a backdrop click but not on a click inside the panel", () => {
      const onClose = vi.fn();
      renderGate({ onClose });
      const dialog = screen.getByRole("dialog");
      fireEvent.mouseDown(dialog);
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.mouseDown(dialog.parentElement as HTMLElement);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── Bottom sheet ─────────────────────────────────────────────────────
  // The in-lesson shell is a deliberate hard wall: it covers the lesson
  // instead of veiling it, and the exit button is the only way past.
  describe("sheet variant", () => {
    function renderSheet(
      props: Partial<React.ComponentProps<typeof PaymentGateOverlay>> = {},
    ) {
      return render(
        <PaymentGateOverlay
          open
          onClose={vi.fn()}
          itemTitle="Payment Flow Test Path"
          variant="sheet"
          exitLabel="Back to path"
          exitHref="/paths/backend-engineering"
          pricing={ngPricing}
          {...props}
        />,
      );
    }

    it("does NOT dismiss on Escape — the wall is the point", () => {
      const onClose = vi.fn();
      renderSheet({ onClose });
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("has no close (X) control", () => {
      renderSheet();
      expect(
        screen.queryByRole("button", { name: "Close" }),
      ).not.toBeInTheDocument();
    });

    it("is flush to the left, right and bottom edges, and opaque", () => {
      renderSheet();
      const sheet = screen.getByRole("dialog");
      expect(sheet.className).toContain("fixed");
      expect(sheet.className).toContain("inset-x-0");
      expect(sheet.className).toContain("bottom-0");
      // Opaque, so the scrim behind can never show through the sheet itself.
      // Fixed white rather than bg-background: the panel is light in EVERY
      // theme, and that constant brightness against the page is where the
      // design gets its pull. A theme token would match the page tone in dark
      // mode and erase the separation entirely.
      expect(sheet.className).toContain("bg-white");
      expect(sheet.className).not.toContain("bg-background");
      expect(sheet.className).not.toContain("backdrop-blur");
    });

    it("veils the page with a full-viewport scrim that DIMS without blurring", () => {
      renderSheet();
      const sheet = screen.getByRole("dialog");
      const scrim = sheet.previousElementSibling as HTMLElement;
      expect(scrim).toBeTruthy();
      expect(scrim).toHaveAttribute("aria-hidden", "true");
      // Full viewport — it covers the top nav too, not just the body.
      expect(scrim.className).toContain("fixed");
      expect(scrim.className).toContain("inset-0");
      // Navy rather than black: a neutral-black veil greys the page out,
      // where the brand navy keeps it looking like the product.
      expect(scrim.className).toContain("bg-[#0E1F33]/60");
      // The whole point: dimmed, not defocused. A blurred scrim was rejected.
      expect(scrim.className).not.toContain("backdrop-blur");
      expect(scrim.className).not.toContain("backdrop-filter");
      // Scrim strictly below the sheet, both inside the same portal.
      expect(scrim.className).toContain("z-[99]");
      expect(sheet.className).toContain("z-[100]");
      expect(scrim.parentElement).toBe(sheet.parentElement);
    });

    it("does NOT dismiss when the scrim is clicked — it is decoration, not an affordance", () => {
      const onClose = vi.fn();
      renderSheet({ onClose });
      const scrim = screen.getByRole("dialog")
        .previousElementSibling as HTMLElement;
      fireEvent.mouseDown(scrim);
      fireEvent.click(scrim);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("carries no backdrop-filter used to veil the page", () => {
      renderSheet();
      const sheet = screen.getByRole("dialog");
      const blurred = sheet.querySelectorAll('[class*="backdrop-blur"]');
      // Blur is permitted as decoration INSIDE the opaque sheet but never as a
      // veil over the page. Asserted by intent rather than by any element's
      // current styling: what matters is that no blurred element spans the
      // viewport.
      blurred.forEach((el) => {
        expect(el.className).not.toContain("fixed");
        expect(el.className).not.toContain("inset-0");
      });
    });

    it("offers exactly one exit, and it navigates rather than dismissing", () => {
      renderSheet();
      const exit = screen.getByRole("link", { name: "Back to path" });
      expect(exit).toHaveAttribute("href", "/paths/backend-engineering");
      // The soft exits belong to the dismissible variant only.
      expect(
        screen.queryByRole("button", { name: "Continue with the free plan" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Compare all plans" }),
      ).not.toBeInTheDocument();
    });

    it("keeps the feedback exit and the subscribe CTA reachable", () => {
      renderSheet();
      expect(
        screen.getByRole("button", { name: "Subscribe Now" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Tell us why" }),
      ).toBeInTheDocument();
    });

    it("still traps Tab inside the sheet — losing Escape makes this critical", () => {
      renderSheet();
      const sheet = screen.getByRole("dialog");
      const focusables = sheet.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      last.focus();
      fireEvent.keyDown(sheet, { key: "Tab" });
      expect(document.activeElement).toBe(first);
    });

    it("still locks page scroll", () => {
      const { unmount } = renderSheet();
      expect(document.body.style.overflow).toBe("hidden");
      unmount();
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });
});
