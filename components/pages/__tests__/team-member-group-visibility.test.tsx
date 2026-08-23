// Group labels are colleague information, not management information.
//
// The design puts each member's groups on GET /teams/:id/members — the roster
// every ACTIVE member can read — rather than on /progress, which is OWNER and
// ADMIN only, precisely so a plain MEMBER can still see who is in which
// department. It gives /members the ?groupId= parameter for the same reason:
// filtering only the progress endpoints would leave a MEMBER holding a group
// filter that visibly did nothing.
//
// Both were lost in the UI. The labels were rendered inside a block that
// returns null when the member has no progress row, and a MEMBER's progress
// map is always empty because they never receive /progress at all; the group
// fetch itself was gated on canManage. The result was a MEMBER seeing neither
// filter nor label, while the API happily returned both.
//
// These tests pin the MEMBER's view specifically. The OWNER's view is covered
// elsewhere; what is easy to regress is the non-manager path, because the
// obvious-looking `canManage &&` reads like a safe default here and is not.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TeamPage } from "../team";

const mockGetMyTeams = vi.fn();
const mockGetTeamMembers = vi.fn();
const mockGetTeamProgress = vi.fn();
const mockGetTeamGroups = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamMembers: mockGetTeamMembers,
    getTeamProgress: mockGetTeamProgress,
    getTeamGroups: mockGetTeamGroups,
    previewSeat: vi.fn(),
    inviteMember: vi.fn(),
    removeTeamMember: vi.fn(),
    changeTeamMemberRole: vi.fn(),
    transferTeamOwnership: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-user", () => ({
  useUser: () => ({ id: "u-dev2", name: "Dev Two" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const MEMBER_TEAM = {
  id: "t1",
  name: "Acme",
  ownerId: "owner1",
  role: "MEMBER" as const,
  subscription: { status: "active", seats: 5, paidSeats: 5 },
};

const ROSTER_MEMBERS = [
  {
    id: "m-dev1",
    role: "MEMBER",
    status: "ACTIVE",
    joinedAt: "2026-08-22T00:00:00.000Z",
    user: { id: "u-dev1", name: "Dev One", email: "dev1@acme.com", avatar: null },
    groups: [{ id: "g1", name: "Platform" }],
  },
  {
    id: "m-dev3",
    role: "MEMBER",
    status: "ACTIVE",
    joinedAt: "2026-08-22T00:00:00.000Z",
    user: { id: "u-dev3", name: "Dev Three", email: "dev3@acme.com", avatar: null },
    groups: [],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([MEMBER_TEAM]);
  mockGetTeamGroups.mockResolvedValue([{ id: "g1", name: "Platform", memberCount: 1 }]);
  // A MEMBER never reaches /progress. If TeamPage ever called it for them the
  // rejection would surface here rather than passing silently.
  mockGetTeamProgress.mockRejectedValue(new Error("403 — progress is manager-only"));
  // No `usage` key: the API omits seat figures entirely for a non-manager.
  mockGetTeamMembers.mockResolvedValue({ members: ROSTER_MEMBERS });
});

describe("a MEMBER's Members tab", () => {
  it("labels each row with its groups even though the viewer has no progress figures", async () => {
    render(<TeamPage onNavigate={vi.fn()} />);

    await screen.findByText("dev1@acme.com");
    await waitFor(() => expect(screen.getByText("Platform")).toBeInTheDocument());

    // The label is the roster's, not progress's — nothing management-only
    // rode in alongside it.
    expect(screen.queryByText(/of \d+ courses/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view progress/i })).not.toBeInTheDocument();
  });

  it("offers the group filter, so ?groupId= on the roster is reachable by the people it was added for", async () => {
    render(<TeamPage onNavigate={vi.fn()} />);

    await screen.findByText("dev1@acme.com");
    await waitFor(() => expect(mockGetTeamGroups).toHaveBeenCalledWith("t1"));
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("does not promise that seats are counted team-wide when the viewer cannot see seats at all", async () => {
    render(<TeamPage onNavigate={vi.fn()} />);
    await screen.findByText("dev1@acme.com");

    // The caveat exists because the seat count sits directly above the roster.
    // A MEMBER receives no `usage`, so there is no seat count on screen and
    // the sentence would point at nothing.
    expect(screen.queryByText(/seats are counted for the whole team/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/seats used/i)).not.toBeInTheDocument();
  });
});
