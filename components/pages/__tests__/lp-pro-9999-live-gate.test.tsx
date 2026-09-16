/**
 * FINDING-001 regression (design review, 2026-09-16): unfinished content on
 * the ₦9,999 landing page (placeholder testimonials, the open-decision memo,
 * unanswered FAQ rows, the un-wired hero video poster) renders only while
 * NEXT_PUBLIC_LP_9999_LIVE is off. Once the page is live for paid traffic,
 * none of it reaches a buyer.
 *
 * IS_LIVE is a module-level constant read at import time, so each case
 * resets the module registry and re-imports the page after setting the env.
 * Mocks mirror lp-pro-9999-checkout.test.tsx (vi.hoisted for the `@/`
 * TDZ quirk, and the next/font/google stub).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: mockTrack } }));

vi.mock("@/lib/api", () => ({
  api: { get: () => Promise.resolve({ data: { data: null } }) },
}));

vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({
    className: "font-instrument-serif-mock",
    variable: "--font-instrument-serif",
  }),
}));

const ORIGINAL_LIVE = process.env.NEXT_PUBLIC_LP_9999_LIVE;

async function renderWithLive(value: string | undefined) {
  if (value === undefined) delete process.env.NEXT_PUBLIC_LP_9999_LIVE;
  else process.env.NEXT_PUBLIC_LP_9999_LIVE = value;
  vi.resetModules();
  const { LpPro9999Page } = await import("@/components/pages/lp-pro-9999");
  return render(<LpPro9999Page />);
}

afterEach(() => {
  if (ORIGINAL_LIVE === undefined) delete process.env.NEXT_PUBLIC_LP_9999_LIVE;
  else process.env.NEXT_PUBLIC_LP_9999_LIVE = ORIGINAL_LIVE;
});

describe("LpPro9999Page live gate", () => {
  it("while not live, placeholders render so the team can see what is still missing", async () => {
    await renderWithLive(undefined);
    expect(screen.getAllByText(/^Placeholder:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Two open decisions/)).toBeInTheDocument();
    expect(screen.getAllByText(/Answer needed/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /play overview/i }),
    ).toBeInTheDocument();
  });

  it("once live, no placeholder, memo, unanswered FAQ, or un-wired video reaches a buyer", async () => {
    await renderWithLive("true");
    expect(screen.queryByText(/^Placeholder:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Two open decisions/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Answer needed/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /play overview/i }),
    ).not.toBeInTheDocument();
    // The gate hides unfinished content only; the page itself still sells.
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByText(/Everything\. One price\. No stress\./)).toBeInTheDocument();
  });
});
