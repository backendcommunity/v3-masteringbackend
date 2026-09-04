/**
 * Pending invites on the roster.
 *
 * A sent-but-unaccepted invite occupies a seat: it is counted in
 * `usage.used`, which is what the "N of M seats used" line reports. Until
 * this section existed, an admin read "3 of 5 seats used" beside a list of
 * one person, with no way to find who held the other two — and no way to
 * cancel a typo, which held a paid seat for the fourteen days until the
 * invite expired. On a team at the two-seat minimum that is half the capacity
 * they bought.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { TeamPage } from "../team";

const mockGetMyTeams = vi.fn();
const mockGetTeamMembers = vi.fn();
const mockGetTeamProgress = vi.fn();
const mockGetTeamGroups = vi.fn();
const mockRevokeTeamInvite = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamMembers: mockGetTeamMembers,
    getTeamProgress: mockGetTeamProgress,
    getTeamGroups: mockGetTeamGroups,
    revokeTeamInvite: mockRevokeTeamInvite,
    previewSeat: vi.fn(),
    inviteMember: vi.fn(),
    removeTeamMember: vi.fn(),
    changeTeamMemberRole: vi.fn(),
    transferTeamOwnership: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/hooks/use-user", () => ({ useUser: () => ({ id: "owner-1" }) }));

const OWNER_MEMBER = {
  id: "m1",
  role: "OWNER",
  status: "ACTIVE",
  joinedAt: "2026-09-01T00:00:00.000Z",
  user: { id: "owner-1", name: "Harness Tester", email: "owner@acme.com" },
  groups: [],
};

const INVITES = [
  {
    id: "inv-1",
    email: "typo@acme.com",
    createdAt: "2026-09-02T00:00:00.000Z",
    expiresAt: "2026-09-16T00:00:00.000Z",
  },
  {
    id: "inv-2",
    email: "second@acme.com",
    createdAt: "2026-09-02T00:00:00.000Z",
    expiresAt: "2026-09-16T00:00:00.000Z",
  },
];

const roster = (overrides: Record<string, unknown> = {}) => ({
  members: [OWNER_MEMBER],
  usage: { used: 3, paidSeats: 5, available: 2, activeMembers: 1, pendingInvites: 2, subscribed: true },
  invites: INVITES,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([
    { id: "t1", name: "Harness Engineering", ownerId: "owner-1", role: "OWNER" },
  ]);
  mockGetTeamMembers.mockResolvedValue(roster());
  mockGetTeamProgress.mockResolvedValue({ members: [] });
  mockGetTeamGroups.mockResolvedValue([]);
  mockRevokeTeamInvite.mockResolvedValue({ success: true });
});

describe("pending invites on the roster", () => {
  it("names everyone holding a seat, not just the people who joined", async () => {
    render(<TeamPage onNavigate={vi.fn()} />);
    await screen.findByText("3 of 5 seats used");

    expect(screen.getByText(/invited, not yet joined/i)).toBeInTheDocument();
    expect(screen.getByText("typo@acme.com")).toBeInTheDocument();
    expect(screen.getByText("second@acme.com")).toBeInTheDocument();
  });

  it("cancels an invite and refetches so the seat line agrees", async () => {
    render(<TeamPage onNavigate={vi.fn()} />);
    await screen.findByText("typo@acme.com");

    // After the cancel, the roster comes back with one fewer invite and one
    // fewer seat used — the API frees the seat as part of the same call.
    mockGetTeamMembers.mockResolvedValue(
      roster({
        usage: { used: 2, paidSeats: 5, available: 3, activeMembers: 1, pendingInvites: 1, subscribed: true },
        invites: [INVITES[1]],
      }),
    );

    fireEvent.click(screen.getAllByRole("button", { name: /cancel invite/i })[0]);

    await waitFor(() =>
      expect(mockRevokeTeamInvite).toHaveBeenCalledWith("t1", "inv-1"),
    );
    await waitFor(() =>
      expect(screen.getByText("2 of 5 seats used")).toBeInTheDocument(),
    );
    expect(screen.queryByText("typo@acme.com")).not.toBeInTheDocument();
  });

  // The section is driven by `invites`, which the API sends only to
  // OWNER/ADMIN. A plain member's response omits the key entirely.
  it("shows nothing when the viewer is not a manager", async () => {
    mockGetTeamMembers.mockResolvedValue({ members: [OWNER_MEMBER] });
    render(<TeamPage onNavigate={vi.fn()} />);
    await screen.findByText(/team roster/i);

    expect(
      screen.queryByText(/invited, not yet joined/i),
    ).not.toBeInTheDocument();
  });

  it("shows nothing when every invite has been accepted", async () => {
    mockGetTeamMembers.mockResolvedValue(roster({ invites: [] }));
    render(<TeamPage onNavigate={vi.fn()} />);
    await screen.findByText(/team roster/i);

    expect(
      screen.queryByText(/invited, not yet joined/i),
    ).not.toBeInTheDocument();
  });
});
