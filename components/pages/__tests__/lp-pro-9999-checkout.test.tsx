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
 * The platform test scopes its queries with `{ selector: "h3" }`: the
 * pillar headings are the only `<h3>`s in the "What you get" section, and
 * scoping keeps the assertion off the course chips and the hero copy,
 * which repeat some of the same words.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

  // The campaign sells the platform, not a bundle of four courses. These
  // three pillars and their inclusions are the offer; if a pillar stops
  // rendering, the page is back to selling a course list.
  it("names the three stages of the platform in the offer", () => {
    render(<LpPro9999Page />);
    expect(
      screen.getByText(/Every course and learning path/i, { selector: "h3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Real projects, not long videos/i, { selector: "h3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Get ready for the job/i, { selector: "h3" }),
    ).toBeInTheDocument();
  });

  // Each of these is a paid inclusion copied from the Pro column of
  // /pricing. A visitor who pays for "the whole platform" and cannot find
  // one of them has been mis-sold, so the page must keep naming them.
  it("names the platform inclusions beyond courses", () => {
    render(<LpPro9999Page />);
    // Scoped to the pillar list items: the new "What exactly do I get"
    // FAQ answer names the same inclusions in prose, so an unscoped query
    // matches twice.
    const inclusions = screen
      .getAllByText(/.+/, { selector: "li > span" })
      .map((el) => el.textContent ?? "");
    expect(inclusions).toContain(
      "All projects, with code review on each submission",
    );
    expect(inclusions).toContain(
      "Bite-size practice exercises in the playground",
    );
    expect(inclusions).toContain(
      "Unlimited AI mock interviews, up to 30 minutes each",
    );
    expect(inclusions).toContain("Community forum access");
  });

  // "Show them exactly what they get." The paths section names every
  // milestone of the two paths that actually run end to end in production,
  // and AI Engineering appears as what it is: a milestone on the Python
  // path, not a path of its own. If a path is ever listed that a buyer
  // cannot walk on the day they pay, this is the test that should fail.
  it("lists the Python path milestones, AI Engineering among them", () => {
    render(<LpPro9999Page />);
    expect(
      screen.getByText(/Become a Python Backend Engineer/i, { selector: "h3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Become a Java and Spring Backend Engineer/i, {
        selector: "h3",
      }),
    ).toBeInTheDocument();
    const milestones = screen
      .getAllByText(/.+/, { selector: "ol > li > span:last-child" })
      .map((el) => el.textContent ?? "");
    expect(milestones).toContain("Python Foundations");
    expect(milestones).toContain("AI Engineering with Python");
    expect(milestones).toContain("Ship and defend");
    expect(milestones).toContain("Building RESTful APIs");
  });

  // The Node.js and Rust paths carry one milestone each in production. They
  // are named as courses, never offered as a route to a job.
  it("does not advertise the single-milestone paths as paths", () => {
    render(<LpPro9999Page />);
    expect(
      screen.queryByText(/Become a (Node\.js|Rust) Backend Engineer/i),
    ).not.toBeInTheDocument();
  });

  // The mission is what makes the price make sense: cheap invites
  // suspicion, "we are reaching for a million people" turns cheap into
  // purposeful. It opens the hero and closes it, and both halves address
  // the reader directly rather than describing them in the third person.
  it("opens and closes the hero with the mission, in second person", () => {
    render(<LpPro9999Page />);
    expect(
      screen.getByText(/Our mission is to democratize backend and AI engineering\s+skills for/i),
    ).toBeInTheDocument();
    // "We are building the platform" read as work in progress on a page
    // asking to be paid today. The platform is live; the mission is the
    // thing still in progress, and only the mission may say so.
    expect(screen.queryByText(/we are building the platform/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Everything you need is already on the platform/i),
    ).toBeInTheDocument();
    // Twice by design: once in the hero, once closing the page.
    expect(screen.getAllByText(/one million Africans/i).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/because we are opening this to one million of you/i),
    ).toBeInTheDocument();

    // Masteringbackend is a product, not a training institute. "We train
    // you" framing makes the subscription read as a course someone enrols
    // in, which is the wrong mental model for a self-serve platform.
    expect(screen.queryByText(/mission to train/i)).not.toBeInTheDocument();

    // Third-person framing sorts the reader into a demographic; it must not
    // come back. Nor may the price ever be sold as a floor.
    expect(
      screen.queryByText(/opens (its|it) learning platform to young Africans/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/as low as/i)).not.toBeInTheDocument();
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

  // The strongest quote anchors the hero; repeating the same card in the
  // proof grid made six learners look like one.
  it("does not repeat the hero testimonial in the proof grid", () => {
    render(<LpPro9999Page />);
    expect(screen.getAllByText(/Literally immediately after the bootcamp/i)).toHaveLength(1);
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
    expect(screen.getAllByRole("button", { name: /start learning/i }).length,
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

  it("the hero CTA opens the checkout dialog with name and email fields", async () => {
    render(<LpPro9999Page />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /start learning for/i })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // The dialog carries its own form; the bottom-of-page form is still there.
    expect(screen.getAllByLabelText(/full name/i).length).toBe(2);
    expect(mockTrack).toHaveBeenCalledWith("lp9999_cta_clicked", { section: "hero" });
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
      screen.getAllByRole("button", { name: /Start learning for ₦9,999/ }).length,
    ).toBeGreaterThanOrEqual(2);
  });
});
