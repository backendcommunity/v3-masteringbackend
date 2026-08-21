// Regression test for the coordinator's Task 12 fix-round-1 finding: the
// roster (and its `usage.available` seat count) is a SECOND, sequential
// round-trip after the team list loads. Enabling "Invite member" before it
// resolves lets InviteDialog receive `seatsAvailable={roster?.usage?.available
// ?? 0}` — a fallback zero, not a real "at capacity" reading — which routes a
// team that actually has a free seat through the paid confirmation and sends
// `buySeat: true`, charging for capacity it didn't need to buy.
//
// Scoped tightly to this one bug rather than a full TeamPage test suite —
// broader coverage for team.tsx/member-row.tsx is a deferred, tracked gap
// (see task-12-report.md), not part of this fix.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TeamPage } from "../team";

const mockGetMyTeams = vi.fn();
const mockGetTeamMembers = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamMembers: mockGetTeamMembers,
    previewSeat: vi.fn(),
    inviteMember: vi.fn(),
    removeTeamMember: vi.fn(),
    changeTeamMemberRole: vi.fn(),
    transferTeamOwnership: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-user", () => ({
  useUser: () => ({ id: "owner1", name: "Owner" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const TEAM = {
  id: "t1",
  name: "Acme",
  ownerId: "owner1",
  role: "OWNER" as const,
  subscription: { status: "active", seats: 5, paidSeats: 5 },
};

describe("TeamPage — Invite member gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables Invite member until the roster (and its live seat usage) has actually loaded", async () => {
    mockGetMyTeams.mockResolvedValue([TEAM]);
    // Never resolves during the first assertion — simulates the roster's
    // second, sequential round-trip still being in flight.
    let resolveRoster: (value: unknown) => void = () => {};
    mockGetTeamMembers.mockReturnValue(
      new Promise((resolve) => {
        resolveRoster = resolve;
      }),
    );

    render(<TeamPage onNavigate={vi.fn()} />);

    const inviteButton = await screen.findByRole("button", {
      name: /invite member/i,
    });
    expect(inviteButton).toBeDisabled();

    resolveRoster({
      members: [],
      usage: {
        paidSeats: 5,
        activeMembers: 1,
        pendingInvites: 0,
        used: 1,
        available: 4,
      },
    });

    await waitFor(() => expect(inviteButton).not.toBeDisabled());
  });

  it("keeps Invite member disabled if the roster fetch fails outright, instead of falling back to an enabled button with a fabricated seat count", async () => {
    mockGetMyTeams.mockResolvedValue([TEAM]);
    mockGetTeamMembers.mockRejectedValue(new Error("network error"));

    render(<TeamPage onNavigate={vi.fn()} />);

    const inviteButton = await screen.findByRole("button", {
      name: /invite member/i,
    });
    await waitFor(() => expect(inviteButton).toBeDisabled());
  });
});
