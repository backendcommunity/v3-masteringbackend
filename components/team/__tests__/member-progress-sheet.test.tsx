// Regression test for the coordinator's E2E finding on Task 8: while
// `progress` is still loading, `DialogContent` rendered with no
// `DialogTitle`/`DialogDescription` at all, which Radix treats as an
// accessibility error (an unnamed dialog for the whole fetch) and logs to
// the console on every open. The fix moves the header outside the
// `progress ? ... : ...` branch so the dialog always has an accessible name,
// swapping only the body between a spinner and the loaded content.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberProgressSheet } from "../member-progress-sheet";

const mockGetTeamMemberProgress = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getTeamMemberProgress: mockGetTeamMemberProgress,
  }),
}));

describe("MemberProgressSheet — accessible name while loading", () => {
  it("gives the dialog an accessible name and description before progress has loaded", async () => {
    // Never resolves — pins the component in its loading state for the
    // assertion below.
    mockGetTeamMemberProgress.mockReturnValue(new Promise(() => {}));

    render(
      <MemberProgressSheet
        teamId="t1"
        memberId="m1"
        open
        onOpenChange={vi.fn()}
      />,
    );

    // Radix requires DialogContent to have a DialogTitle (and ideally a
    // description) to be accessible; querying by role+name is exactly what
    // a screen reader announcement depends on, so this fails if the title
    // is missing or only rendered once `progress` resolves.
    const dialog = await screen.findByRole("dialog", {
      name: /member progress/i,
    });
    expect(dialog).toHaveAccessibleDescription(/loading this member's progress/i);
  });
});
