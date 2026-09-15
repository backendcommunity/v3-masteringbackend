import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TeamRemovalBanner } from "@/components/team-removal-banner";
import type { PublicPricing } from "@/lib/pricing";
import type { TeamRemovalNotice } from "@/lib/data";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/hooks/use-user", () => ({ useUser: () => ({ id: "u1" }) }));

// The banner must ask for pricing ONLY when it is actually going to show one.
// The spy records the `enabled` argument so the gate itself is under test —
// an ungated call would add a /public/pricing request to every page load for
// every user, not just the handful who were removed from a team.
let pricingValue: PublicPricing | null = null;
const usePricingSpy = vi.fn();
vi.mock("@/hooks/use-pricing", () => ({
  usePricing: (enabled?: boolean) => {
    usePricingSpy(enabled);
    return pricingValue;
  },
}));

let notice: TeamRemovalNotice = { show: false, teamName: null, removedAt: null };
const getTeamRemovalNotice = vi.fn(async () => notice);
// One stable object: `useAppStore()` has no selector in this repo and returns a
// stable state object, which the component's effect depends on. A fresh object
// per render here would make that effect loop forever.
const storeStub = { getTeamRemovalNotice };
vi.mock("@/lib/store", () => ({ useAppStore: () => storeStub }));

const basePricing: PublicPricing = {
  tier: "GLOBAL",
  country: "US",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  enterprise: {
    tier: "GLOBAL",
    currency: "USD",
    monthlyPerUser: 29.99,
    annualPerUser: 299.99,
    minSeats: 2,
    selfServe: true,
  },
};

const pppPricing: PublicPricing = {
  ...basePricing,
  tier: "PPP",
  country: "IN",
  currency: "USD",
  monthly: 6.99,
  annual: 69.99,
};

const ngPricing: PublicPricing = {
  ...basePricing,
  tier: "NG",
  country: "NG",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
};

const removed: TeamRemovalNotice = {
  show: true,
  teamName: "Acme Engineering",
  removedAt: "2026-09-14T10:00:00.000Z",
};

describe("TeamRemovalBanner", () => {
  beforeEach(() => {
    push.mockClear();
    usePricingSpy.mockClear();
    getTeamRemovalNotice.mockClear();
    window.sessionStorage.clear();
    notice = { show: false, teamName: null, removedAt: null };
    pricingValue = null;
  });

  it("renders nothing, and never requests pricing, when show is false", async () => {
    const { container } = render(<TeamRemovalBanner />);
    await waitFor(() => expect(getTeamRemovalNotice).toHaveBeenCalled());
    expect(container.textContent).toBe("");
    expect(usePricingSpy).toHaveBeenCalledWith(false);
    expect(usePricingSpy).not.toHaveBeenCalledWith(true);
  });

  it("GLOBAL shows the 50POFF code, the discount pill, and both halved prices computed from the fetched amounts", async () => {
    notice = removed;
    pricingValue = basePricing;
    const { container } = render(<TeamRemovalBanner />);

    await screen.findByText(/Your Pro access through/i);
    expect(container.textContent).toContain("Acme Engineering");
    expect(screen.getByText("50POFF")).toBeInTheDocument();
    expect(screen.getByText("50% OFF")).toBeInTheDocument();

    // The originals are struck through; the halves are computed, never literal.
    const struck = Array.from(container.querySelectorAll("s")).map(
      (el) => el.textContent,
    );
    expect(struck).toEqual(["$19.99", "$199.99"]);
    expect(container.textContent).toContain("$9.99");
    expect(container.textContent).toContain("$99.99");

    expect(usePricingSpy).toHaveBeenCalledWith(true);
  });

  it("PPP shows its real regional prices and NEITHER the code NOR the discount pill", async () => {
    notice = removed;
    pricingValue = pppPricing;
    const { container } = render(<TeamRemovalBanner />);

    await screen.findByText(/Your Pro access through/i);
    expect(container.textContent).toContain("$6.99");
    expect(container.textContent).toContain("$69.99");
    expect(screen.queryByText("50POFF")).toBeNull();
    expect(screen.queryByText("50% OFF")).toBeNull();
    expect(container.querySelectorAll("s").length).toBe(0);
  });

  it("NG shows naira prices and NEITHER the code NOR the discount pill", async () => {
    notice = removed;
    pricingValue = ngPricing;
    const { container } = render(<TeamRemovalBanner />);

    await screen.findByText(/Your Pro access through/i);
    expect(container.textContent).toContain("₦9,999");
    expect(container.textContent).toContain("₦99,990");
    expect(screen.queryByText("50POFF")).toBeNull();
    expect(screen.queryByText("50% OFF")).toBeNull();
    expect(container.querySelectorAll("s").length).toBe(0);
  });

  it("renders the message and the CTA but no figures while pricing is still loading", async () => {
    notice = removed;
    pricingValue = null;
    const { container } = render(<TeamRemovalBanner />);

    await screen.findByText(/Your Pro access through/i);
    expect(screen.getByRole("button", { name: /get pro/i })).toBeInTheDocument();
    expect(container.textContent).not.toContain("$");
    expect(container.textContent).not.toContain("₦");
    expect(container.textContent).not.toContain("50POFF");
    expect(container.textContent).not.toContain("50% OFF");
  });

  it("dismissal hides it and persists for the rest of the session", async () => {
    notice = removed;
    pricingValue = basePricing;
    const first = render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);

    fireEvent.click(screen.getByLabelText(/dismiss/i));
    expect(first.container.textContent).toBe("");
    expect(
      window.sessionStorage.getItem("mb_team_removal_banner_dismissed"),
    ).toBe("1");

    // A fresh mount in the same session stays hidden — and does not even ask
    // the API, since a dismissed banner has nothing to decide.
    getTeamRemovalNotice.mockClear();
    first.unmount();
    const second = render(<TeamRemovalBanner />);
    await waitFor(() => expect(second.container.textContent).toBe(""));
    expect(getTeamRemovalNotice).not.toHaveBeenCalled();
  });

  it("sends the CTA to checkout", async () => {
    notice = removed;
    pricingValue = basePricing;
    render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);

    fireEvent.click(screen.getByRole("button", { name: /get pro/i }));
    expect(push).toHaveBeenCalledWith("/checkout?plan=pro&cycle=monthly");
  });
});
