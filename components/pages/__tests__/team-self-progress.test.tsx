// Finding 3 of the whole-branch review: `GET /teams/:id/me` was implemented
// and wired into the store but nothing rendered it. This pins the control
// added to /team/members — "What your team can see about you" — being
// visible to every ACTIVE member, including a plain MEMBER who cannot manage
// the team, since seeing your own record is not a manager action.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TeamPage } from "../team";

const mockGetMyTeams = vi.fn();
const mockGetTeamMembers = vi.fn();
const mockGetTeamProgress = vi.fn();
const mockGetMyTeamProgress = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamMembers: mockGetTeamMembers,
    getTeamProgress: mockGetTeamProgress,
    getMyTeamProgress: mockGetMyTeamProgress,
    getTeamMemberProgress: vi.fn(),
    previewSeat: vi.fn(),
    inviteMember: vi.fn(),
    removeTeamMember: vi.fn(),
    changeTeamMemberRole: vi.fn(),
    transferTeamOwnership: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-user", () => ({
  useUser: () => ({ id: "member1", name: "Plain Member" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const MEMBER_TEAM = {
  id: "t1",
  name: "Acme",
  ownerId: "owner1",
  role: "MEMBER" as const,
  subscription: { status: "active" },
};

const ROSTER = {
  members: [
    {
      id: "m1",
      role: "MEMBER" as const,
      status: "ACTIVE" as const,
      joinedAt: new Date().toISOString(),
      user: { id: "member1", name: "Plain Member", email: "m@acme.com" },
    },
  ],
  // No `usage` key — a plain MEMBER's roster response omits it entirely.
};

describe("TeamPage — self-progress control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'What your team can see about you' to a plain MEMBER, who cannot manage the team", async () => {
    mockGetMyTeams.mockResolvedValue([MEMBER_TEAM]);
    mockGetTeamMembers.mockResolvedValue(ROSTER);

    render(<TeamPage onNavigate={vi.fn()} />);

    const control = await screen.findByRole("button", {
      name: /what your team can see about you/i,
    });
    expect(control).toBeInTheDocument();
    // A MEMBER cannot invite — proves this isn't gated behind canManage.
    expect(
      screen.queryByRole("button", { name: /invite member/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the MemberProgressSheet via getMyTeamProgress when clicked", async () => {
    mockGetMyTeams.mockResolvedValue([MEMBER_TEAM]);
    mockGetTeamMembers.mockResolvedValue(ROSTER);
    mockGetMyTeamProgress.mockResolvedValue({
      user: { id: "member1", name: "Plain Member", email: "m@acme.com", avatar: null },
      stats: { points: 5, level: 1, currentStreak: 0, longestStreak: 0, lastActivityAt: null },
      courses: [],
      paths: [],
      projects: [],
      quizzes: { taken: 0, passed: 0 },
      mockInterviews: { taken: 0, completed: 0, lastTakenAt: null },
      activity: [],
    });

    render(<TeamPage onNavigate={vi.fn()} />);

    const control = await screen.findByRole("button", {
      name: /what your team can see about you/i,
    });
    fireEvent.click(control);

    await waitFor(() => expect(mockGetMyTeamProgress).toHaveBeenCalledWith("t1"));
  });
});
