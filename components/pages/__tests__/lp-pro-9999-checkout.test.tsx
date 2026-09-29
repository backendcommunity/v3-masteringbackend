/**
 * Pins that the page tracks a page-view on mount and renders the inline
 * checkout form (not a redirect, not a login prompt) — the two things
 * that distinguish this route from every other checkout surface in the
 * repo.
 *
 * `mockTrack` is created via `vi.hoisted()` rather than a plain top-level
 * `const`. Empirically (see task-6-report.md), this repo's Vitest 4.1.8
 * setup throws "Cannot access 'mockTrack' before initialization" for ANY
 * `vi.mock("@/...", () => ({ ... mockTrack ... }))` that references a
 * plain outer-scope "mock"-prefixed const when the mocked specifier is a
 * `@/`-aliased local module — reproduced with a trivial dummy component
 * and even with no component at all, and confirmed absent for bare
 * package specifiers (e.g. "@paddle/paddle-js" in
 * checkout-paddle-sync.test.tsx, which is why that file's equivalent
 * pattern works). `vi.hoisted()` is Vitest's own documented fix for
 * exactly this TDZ class of bug and changes no test semantics.
 *
 * The path test scopes its queries with `{ selector: "h3" }`: the path
 * titles are also named in the hero, the offer card and the FAQ, and
 * scoping keeps the assertion on the "What you get" blocks.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: mockTrack } }));

// Mutable so a test can put the page in the Nigerian branch. Default is
// null, which makes useCheckoutPricing fall back to the global tier: that
// is what every other test in this file renders against.
const { pricingState } = vi.hoisted(() => ({
  pricingState: { value: null as unknown },
}));
vi.mock("@/lib/api", () => ({
  api: { get: () => Promise.resolve({ data: { data: pricingState.value } }) },
}));

const NG_PRICING = {
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
};

// A visitor quoted outside Nigeria. Note that the default (null) is NOT
// this: with no data the price never resolves, so those tests render the
// page as it looks while the price is still loading.
const GLOBAL_PRICING = {
  ...NG_PRICING,
  tier: "GLOBAL",
  country: "US",
  provider: "PADDLE",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  monthlyPriceId: "pri_global_monthly",
  annualPriceId: "pri_global_annual",
};

// next/font/google only works through Next's own compiler (the SWC font
// plugin swaps it for a real loader at build time); under plain Vitest the
// real export throws. Stub it the way Next's own testing docs recommend —
// a function returning the shape callers actually read (`className`).
vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({
    className: "font-instrument-serif-mock",
    variable: "--font-instrument-serif",
  }),
}));

import { LpPro9999Page } from "@/components/pages/lp-pro-9999";

beforeEach(() => {
  mockTrack.mockReset();
  pricingState.value = null;
});

describe("LpPro9999Page", () => {
  it("tracks lp9999_viewed once on mount", () => {
    render(<LpPro9999Page />);
    expect(mockTrack).toHaveBeenCalledWith("lp9999_viewed", expect.anything());
  });

  it("renders the inline checkout form, not a login redirect prompt", () => {
    render(<LpPro9999Page />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByText(/log in/i)).not.toBeInTheDocument();
  });

  // The brief: two paths, and the difference between them obvious at a
  // glance. Each path is its own block in "What you get".
  it("sells two paths, Backend Engineering and AI Engineering", () => {
    render(<LpPro9999Page />);
    expect(
      screen.getByText("Backend Engineering", { selector: "h3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("AI Engineering", { selector: "h3" }),
    ).toBeInTheDocument();
  });

  // Each of these is a paid inclusion copied from the Pro column of
  // /pricing. A visitor who pays and cannot find one of them has been
  // mis-sold, so the page must keep naming them.
  it("names the platform inclusions beyond courses", () => {
    render(<LpPro9999Page />);
    // Scoped to list items: the FAQ answer names the same inclusions in
    // prose, so an unscoped query matches twice.
    const inclusions = screen
      .getAllByText(/.+/, { selector: "li > span" })
      .map((el) => el.textContent ?? "");
    expect(inclusions).toContain(
      "Backend projects, with a code review from our team on every submission",
    );
    expect(inclusions).toContain("Bite-size coding exercises in the playground");
    expect(inclusions).toContain(
      "Unlimited AI mock interviews, up to 30 minutes each",
    );
    expect(inclusions).toContain("Community forum access");
  });

  // "AI Engineering" is sold as a named selection of what exists, not as a
  // roadmap of its own: its route is the Python path's own milestones,
  // walked to the AI Engineering milestone. If a milestone is ever listed
  // that a buyer cannot walk on the day they pay, this test should fail.
  it("routes AI Engineering through the real Python path milestones", () => {
    render(<LpPro9999Page />);
    const milestones = screen
      .getAllByText(/.+/, { selector: "ol > li > span:last-child" })
      .map((el) => el.textContent ?? "");
    expect(milestones).toContain("Python Foundations");
    expect(milestones).toContain("Backend Engineering Core");
    expect(milestones).toContain("AI Engineering with Python");
    expect(milestones).toContain("Ship and defend");
    expect(screen.getByText(/Or the Java and Spring route/i)).toBeInTheDocument();
    // No roadmap by this name exists in production.
    expect(screen.queryByText(/Become an AI Engineer/i)).not.toBeInTheDocument();
  });

  // The Node.js and Rust paths carry one milestone each in production. They
  // are named as courses, never offered as a route to a job.
  it("does not advertise the single-milestone paths as paths", () => {
    render(<LpPro9999Page />);
    expect(
      screen.queryByText(/Become a (Node\.js|Rust) Backend Engineer/i),
    ).not.toBeInTheDocument();
  });

  // The brief moves the mission out of the hero to directly after "Our
  // learners work at": proof that this is a real company first, then the
  // reason the price is low.
  it("states the mission after the employers, not in the hero", () => {
    const { container } = render(<LpPro9999Page />);
    const mission = screen.getByText(
      /Our mission is to democratize backend and AI engineering\s+skills for/i,
    );
    expect(container.querySelector("header")).not.toContainElement(mission);
    const employers = screen.getByText(/Our learners work at/i);
    expect(
      employers.compareDocumentPosition(mission) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Once in the mission, once closing the page.
    expect(screen.getAllByText(/one million Africans/i).length).toBeGreaterThanOrEqual(2);

    // Masteringbackend is a product, not a training institute, and the
    // reader is never sorted into a demographic. Nor may the price ever be
    // sold as a floor.
    expect(screen.queryByText(/mission to train/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/opens (its|it) learning platform to young Africans/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/as low as/i)).not.toBeInTheDocument();
  });

  // The hero's "₦100k+" is a naira comparison. A visitor quoted in another
  // currency gets the same point without a figure that is not theirs.
  // It stays up while the price loads (the ads run in Nigeria), so the
  // test waits for the dollar quote before checking it has gone.
  it("keeps the naira bootcamp comparison out of a non-naira hero", async () => {
    pricingState.value = GLOBAL_PRICING;
    render(<LpPro9999Page />);
    expect(
      await screen.findByText(/Still thinking of paying for an expensive bootcamp\?/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/₦100k/)).not.toBeInTheDocument();
    expect(screen.getByText(/You don.t have to\./i)).toBeInTheDocument();
  });

  // The deadline is a real commitment to every visitor who sees it, so it
  // must appear in the hero and again at the checkout where the decision
  // is made. The struck-through ₦12,999 is deliberately NOT asserted here:
  // it renders only for visitors the pricing API quotes in naira, and this
  // suite runs on the global fallback. The next test pins that boundary.
  it("states the deadline at the top and at the checkout", () => {
    render(<LpPro9999Page />);
    expect(screen.getAllByText(/1 October 2026/).length).toBeGreaterThanOrEqual(2);
  });

  // Regional pricing invariant. The struck-through ₦12,999 is a COMPARISON
  // price: showing it to someone billed in dollars would claim a discount
  // against a figure they will never be charged. It renders only once the
  // API has quoted this visitor in naira, so on the global fallback (what
  // this suite runs on) it must be absent entirely.
  //
  // The decorative "₦9,999" that fills the headline and buttons while the
  // request is in flight is a separate, deliberate thing: it is never read
  // by the charge path, and is documented at the top of the page file.
  it("never shows the naira comparison price to a visitor quoted elsewhere", () => {
    render(<LpPro9999Page />);
    expect(screen.queryByText(/₦12,999/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Discounted until 1 October 2026/).length).toBeGreaterThanOrEqual(2);
  });

  // The strongest film anchors the hero; repeating the same card in the
  // proof grid made six learners look like one.
  it("does not repeat the hero testimonial in the proof grid", () => {
    render(<LpPro9999Page />);
    expect(
      screen.getAllByRole("button", {
        name: /Play: Max landed a job right after our bootcamp training/i,
      }),
    ).toHaveLength(1);
  });

  // Proof is the thing a cold visitor weighs hardest, so every written
  // review carries a full name. No anonymous card may return: one sitting
  // beside named ones reads as filler and drags the real ones down with it.
  it("attributes every written testimonial to a named person", () => {
    render(<LpPro9999Page />);
    expect(screen.queryByText(/^Masteringbackend learner$/)).not.toBeInTheDocument();
    ["Daniel Tinivella", "Agoro, Adegbenga B.", "Orevaoghene Eguwe"].forEach(
      (name) => expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1),
    );
  });

  // The institutional signal the page had none of. These are real figures;
  // if they ever change they must change here and on masteringbackend.com
  // together, so the two never contradict each other.
  it("shows the track record and where members work", () => {
    render(<LpPro9999Page />);
    expect(screen.getByText("1,000+")).toBeInTheDocument();
    expect(screen.getByText(/developers trained since 2021/i)).toBeInTheDocument();
    expect(screen.getByText("3,200+")).toBeInTheDocument();
    // Nigerian employers first: this page is for Nigerians, and a band of
    // only foreign names would not read as "people like me work there".
    ["Kuda", "Paystack", "Cowrywise", "Flutterwave", "Andela"].forEach((company) =>
      expect(screen.getByText(company)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Our learners work at/i)).toBeInTheDocument();
  });

  // A monthly subscription has no spots and no deadline. Borrowed scarcity
  // is the first thing a sceptical buyer catches, so no CTA may imply it.
  it("uses no scarcity language on its calls to action", () => {
    render(<LpPro9999Page />);
    const ctas = screen
      .getAllByRole("button")
      .map((b) => b.textContent ?? "")
      .join(" | ");
    expect(ctas).not.toMatch(/secure your spot/i);
    expect(ctas).not.toMatch(/spots? left|limited|hurry|last chance/i);
    // The brief: two path buttons instead of one generic CTA.
    expect(
      screen.getAllByRole("button", { name: /^Start Backend — /i }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByRole("button", { name: /^Start AI Engineering — /i }).length,
    ).toBeGreaterThanOrEqual(2);
  });

  // This is a production page for paid traffic: no placeholder, memo or
  // internal-team text may ever render (design review, 2026-09-16).
  it("renders no placeholder or internal-team text", () => {
    render(<LpPro9999Page />);
    expect(screen.queryByText(/Placeholder/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Answer needed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Two open decisions/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Methods to confirm/)).not.toBeInTheDocument();
  });

  it("a hero path CTA opens the checkout dialog with that path chosen", async () => {
    render(<LpPro9999Page />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: /^Start AI Engineering — /i })[0],
    );
    const dialog = await screen.findByRole("dialog");
    // The dialog carries its own form; the bottom-of-page form is still there.
    expect(screen.getAllByLabelText(/full name/i).length).toBe(2);
    expect(
      within(dialog).getByRole("button", { name: "AI Engineering" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(mockTrack).toHaveBeenCalledWith("lp9999_cta_clicked", {
      section: "hero",
      path: "ai-engineering",
    });
  });

  // The dialog and the bottom form share one path: switching it in one
  // switches it in the other, and the Pay button names the path.
  it("switches path from the checkout form's toggle", () => {
    render(<LpPro9999Page />);
    const form = screen.getByRole("group", { name: "Your path" });
    expect(
      within(form).getByRole("button", { name: "Backend" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(form).getByRole("button", { name: "AI Engineering" }));
    expect(
      within(form).getByRole("button", { name: "AI Engineering" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  // What 10,000 Nigerians actually see, which a dev machine cannot render:
  // the pricing API's CORS list does not admit localhost:3001, so the page
  // always falls back to the global tier there. This is the only place the
  // naira branch is exercised.
  it("shows the naira discount against ₦12,999 for a Nigerian visitor", async () => {
    pricingState.value = NG_PRICING;
    render(<LpPro9999Page />);

    const struck = await screen.findAllByText("₦12,999");
    expect(struck.length).toBeGreaterThanOrEqual(2);
    struck.forEach((el) => expect(el.tagName).toBe("S"));

    expect(screen.getAllByText(/1 October 2026/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/Discounted until/)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Start Backend — ₦9,999\/mo/ }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/Still thinking of spending ₦100k\+ on a bootcamp\?/),
    ).toBeInTheDocument();
    expect(screen.getByText(/New subscribers pay ₦12,999\/month after that/)).toBeInTheDocument();
  });
});
