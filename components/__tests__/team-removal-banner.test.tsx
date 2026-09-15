import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  TeamRemovalBanner,
  resetTeamRemovalNoticeCache,
} from "@/components/team-removal-banner";
import type { PublicPricing } from "@/lib/pricing";
import type { TeamRemovalNotice } from "@/lib/data";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// Mutable: the same tab can hand over from one signed-in user to the next
// (shared browser), and both the notice cache and the dismissal must notice.
let currentUser: { id: string; isPremium?: boolean } | null = { id: "u1" };
vi.mock("@/hooks/use-user", () => ({ useUser: () => currentUser }));

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
    currentUser = { id: "u1" };
    // Module state: without this, one case's cached notice answers the next.
    resetTeamRemovalNoticeCache();
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
      window.sessionStorage.getItem("mb_team_removal_banner_dismissed_u1"),
    ).toBe("1");

    // A fresh mount in the same session stays hidden — and does not even ask
    // the API, since a dismissed banner has nothing to decide.
    getTeamRemovalNotice.mockClear();
    first.unmount();
    const second = render(<TeamRemovalBanner />);
    await waitFor(() => expect(second.container.textContent).toBe(""));
    expect(getTeamRemovalNotice).not.toHaveBeenCalled();
  });

  // DashboardLayout is NOT a shared Next.js layout — it is rendered inside each
  // of ~67 separate page.tsx trees, so this banner unmounts and remounts on
  // every in-app navigation. Without a session cache that is one policy query
  // per page view, which is the exact load the brief kept off /auth/me.
  // Only a NEGATIVE answer is cached for the session — that population is
  // almost everybody, and it's the load this cache exists to keep off every
  // page view. A POSITIVE answer is deliberately NOT cached across mounts
  // (see the next test): caching it would let a stale "you lost access"
  // survive a purchase or a mid-session re-add, with nothing left to
  // invalidate it once dismissal already skips the request.
  it("requests the notice once per logged-in session, not once per navigation, for a negative answer", async () => {
    notice = { show: false, teamName: null, removedAt: null };
    pricingValue = null;

    const first = render(<TeamRemovalBanner />);
    await waitFor(() => expect(getTeamRemovalNotice).toHaveBeenCalledTimes(1));
    first.unmount();

    // A second mount is a navigation, not a new session — the cached
    // negative answer must carry over rather than firing a second query.
    render(<TeamRemovalBanner />);
    // Nothing renders for a negative answer either time, so there is no DOM
    // change to await — flush the effect's microtasks under act() instead.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getTeamRemovalNotice).toHaveBeenCalledTimes(1);
  });

  // The self-healing half of the fix: a POSITIVE answer is never persisted
  // across mounts, so the very next navigation re-checks live instead of
  // trusting a cache nothing invalidates. This is what closes the purchase
  // race (the webhook may not have landed yet when the celebration redirects
  // to /team/setup) and the re-added-mid-session case, with no reset to wire
  // or forget for either.
  it("re-checks a positive answer on the next mount, since only negative answers are cached for the session", async () => {
    notice = removed;
    pricingValue = basePricing;

    const first = render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);
    first.unmount();

    // No explicit reset call — the recheck must happen on its own.
    render(<TeamRemovalBanner />);
    await waitFor(() =>
      expect(getTeamRemovalNotice).toHaveBeenCalledTimes(2),
    );
  });

  // Guards the cache's keying: a bare module-level cache would hand user A's
  // notice to user B after a same-tab logout/login.
  it("asks again when a different user is signed in", async () => {
    notice = removed;
    pricingValue = basePricing;

    const first = render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);
    first.unmount();

    currentUser = { id: "u2" };
    render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);

    expect(getTeamRemovalNotice).toHaveBeenCalledTimes(2);
  });

  it("does not let one user's dismissal suppress the next user's banner in the same tab", async () => {
    notice = removed;
    pricingValue = basePricing;

    const a = render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);
    fireEvent.click(screen.getByLabelText(/dismiss/i));
    expect(a.container.textContent).toBe("");
    a.unmount();

    // B signs in in the same tab: sessionStorage survives, but B is separately
    // entitled to their own offer.
    currentUser = { id: "u2" };
    const b = render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);
    b.unmount();

    // ...and A's dismissal still holds for A.
    currentUser = { id: "u1" };
    const againAsA = render(<TeamRemovalBanner />);
    await waitFor(() => expect(againAsA.container.textContent).toBe(""));
  });

  it("sends the CTA to checkout", async () => {
    notice = removed;
    pricingValue = basePricing;
    render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);

    fireEvent.click(screen.getByRole("button", { name: /get pro/i }));
    expect(push).toHaveBeenCalledWith("/checkout?plan=pro&cycle=monthly");
  });

  // The cache stores a PROMISE, and a rejection is folded to `null` inside it.
  // That is deliberate, but it means one failed request decides the rest of the
  // session — so it has to be the SAFE outcome (no banner, no crash) and it has
  // to be pinned. The banner is mounted in the shell of ~67 pages; a throw here
  // takes down every one of them, not just this strip.
  //
  // Mutation-checked: deleting the `.catch(() => null)` in loadNoticeOnce
  // fails the run as an Unhandled Rejection (vitest exits 1), not as an
  // assertion — worth knowing if this ever needs debugging.
  // Cheap, robust guard: costs no request and is correct whenever the user
  // object is fresh. Must win even when the notice itself says show: true —
  // e.g. right after a purchase, before anything has invalidated the cache.
  it("renders nothing for a user whose user object already says they have Pro, even when the notice says show: true", async () => {
    notice = removed;
    pricingValue = basePricing;
    currentUser = { id: "u1", isPremium: true };

    const { container } = render(<TeamRemovalBanner />);
    await waitFor(() => expect(getTeamRemovalNotice).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  // The purchase-invalidation path: a successful Pro purchase must be able to
  // force the next mount to re-check rather than serve the stale "ended"
  // answer for the rest of the page load.
  it("issues a new request on the next mount after resetTeamRemovalNoticeCache is called", async () => {
    notice = removed;
    pricingValue = basePricing;

    const first = render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);
    first.unmount();

    resetTeamRemovalNoticeCache();

    render(<TeamRemovalBanner />);
    await screen.findByText(/Your Pro access through/i);

    expect(getTeamRemovalNotice).toHaveBeenCalledTimes(2);
  });

  it("shows nothing and does not retry when the notice request fails", async () => {
    notice = removed;
    pricingValue = basePricing;
    getTeamRemovalNotice.mockRejectedValueOnce(new Error("Network down"));

    const first = render(<TeamRemovalBanner />);
    await waitFor(() => expect(first.container.textContent).toBe(""));
    first.unmount();

    // A navigation after the failure. The cached `null` answers it — the
    // failure is not retried on every page view, which is the whole reason
    // the promise rather than the value is cached.
    const second = render(<TeamRemovalBanner />);
    await waitFor(() => expect(second.container.textContent).toBe(""));
    expect(getTeamRemovalNotice).toHaveBeenCalledTimes(1);
  });
});
