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
 * The fourth test's four `getByText` queries are scoped with
 * `{ selector: "h3" }`. Without it, each query throws "multiple elements
 * found": the hero paragraph is one literal text node ("...Python,
 * Advanced Java, AntiGravity, and AI Engineering...") that itself
 * substring-matches three of the four regexes, colliding with the OFFER
 * section's own `<h3>` course-card titles. Scoping to `h3` — where course
 * titles actually live — resolves the ambiguity without touching the
 * hero copy or weakening the assertion.
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

  it("names all four course tracks from the offer", () => {
    render(<LpPro9999Page />);
    expect(screen.getByText(/AI Engineering/i, { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByText(/Python Programming/i, { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByText(/AntiGravity/i, { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByText(/Advanced Java/i, { selector: "h3" })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /secure your spot for/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // The dialog carries its own form; the bottom-of-page form is still there.
    expect(screen.getAllByLabelText(/full name/i).length).toBe(2);
    expect(mockTrack).toHaveBeenCalledWith("lp9999_cta_clicked", { section: "hero" });
  });
});
