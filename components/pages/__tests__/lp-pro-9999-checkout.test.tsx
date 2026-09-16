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

vi.mock("@/lib/api", () => ({
  api: { get: () => Promise.resolve({ data: { data: null } }) },
}));

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

  // The hero borrows the bootcamp's credibility, and must say HOW the
  // training is the same rather than merely assert that it is.
  it("ties the hero to the bootcamp's method, not just its name", () => {
    render(<LpPro9999Page />);
    expect(
      screen.getByText(/built the way we train the AI Engineering Bootcamp cohorts: in order, by building, with your code reviewed/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/as low as/i)).not.toBeInTheDocument();
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
});
