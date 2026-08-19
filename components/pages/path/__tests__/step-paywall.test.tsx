import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepPaywall } from "@/components/pages/path/step-paywall";
import type { PathSession } from "@/lib/path-types";
import type { PublicPricing } from "@/lib/pricing";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/paths/backend-engineering/learn",
}));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
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
vi.mock("@/hooks/use-pricing", () => ({ usePricing: () => ngPricing }));

const purchaseHandlers: {
  onPurchased?: (id: string, method: string, success: boolean) => void;
} = {};
vi.mock("@/hooks/use-content-purchase", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/use-content-purchase")
  >("@/hooks/use-content-purchase");
  return {
    ...actual,
    useContentPurchase: (args: {
      onPurchased: (id: string, method: string, success: boolean) => void;
    }) => {
      purchaseHandlers.onPurchased = args.onPurchased;
      return {
        buyOnce: vi.fn(),
        redeemMB: vi.fn(),
        payWithAsyncpay: vi.fn(),
        paddleReady: true,
      };
    },
  };
});

const payment: PathSession["path"]["payment"] = {
  id: "path-1",
  kind: "path",
  amount: 29,
  paddlePriceId: "pri_test",
  isPremium: true,
};

describe("StepPaywall", () => {
  beforeEach(() => {
    purchaseHandlers.onPurchased = undefined;
  });

  it("IS the sheet — it renders immediately, with nothing in front of it", () => {
    render(
      <StepPaywall
        payment={payment}
        pathTitle="Backend Engineering"
        pathSlug="backend-engineering"
        onUnlock={vi.fn()}
      />,
    );
    const sheet = screen.getByRole("dialog");
    expect(sheet).toHaveAttribute("aria-modal", "true");
    expect(sheet.className).toContain("inset-x-0");
    expect(sheet.className).toContain("bottom-0");
    expect(
      screen.getByText(/out of free content\. Subscribe to keep going/i),
    ).toBeInTheDocument();
  });

  it("has no intermediate card — the deleted 'Unlock the full …' gate must not come back", () => {
    render(
      <StepPaywall
        payment={payment}
        pathTitle="Backend Engineering"
        pathSlug="backend-engineering"
        onUnlock={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Unlock the full/i)).not.toBeInTheDocument();
    // The card's own CTAs are gone too; the sheet owns the offer.
    expect(
      screen.queryByRole("button", { name: /Go Pro to unlock/i }),
    ).not.toBeInTheDocument();
    // Exactly one paywall on screen.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("renders no frosted scrim — content above the sheet stays at full brightness", () => {
    const { container } = render(
      <StepPaywall
        payment={payment}
        pathTitle="Backend Engineering"
        onUnlock={vi.fn()}
      />,
    );
    // The component's own output carries no scrim; the sheet portals to body.
    expect(container.innerHTML).not.toContain("bg-background/40");
    expect(container.innerHTML).not.toContain("backdrop-blur-[2px]");
  });

  it("points its exit at the path when a slug is supplied", () => {
    render(
      <StepPaywall
        payment={payment}
        pathTitle="Backend Engineering"
        pathSlug="backend-engineering"
        onUnlock={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: "Back to path" })).toHaveAttribute(
      "href",
      "/paths/backend-engineering",
    );
  });

  it("unlocks on a SUCCESSFUL purchase", () => {
    const onUnlock = vi.fn();
    render(
      <StepPaywall
        payment={payment}
        pathTitle="Backend Engineering"
        onUnlock={onUnlock}
      />,
    );
    purchaseHandlers.onPurchased?.("path-1", "mb", true);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("keeps the wall up when a purchase FAILS — never strands the learner", () => {
    const onUnlock = vi.fn();
    render(
      <StepPaywall
        payment={payment}
        pathTitle="Backend Engineering"
        onUnlock={onUnlock}
      />,
    );
    purchaseHandlers.onPurchased?.("path-1", "mb", false);
    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("hides the MB rail when the path carries no price", () => {
    render(
      <StepPaywall
        payment={{ ...payment, amount: null }}
        pathTitle="Backend Engineering"
        onUnlock={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /Redeem/ })).not.toBeInTheDocument();
  });
});
