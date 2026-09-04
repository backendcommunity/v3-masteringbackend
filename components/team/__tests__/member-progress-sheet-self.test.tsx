// Finding 3 of the whole-branch review: GET /teams/:id/me was implemented,
// tested on the backend, and wired into the store as getMyTeamProgress — but
// nothing ever called it. `asSelf` is the smallest honest surface for it:
// the SAME sheet, pointed at the caller's own record instead of a roster
// entry, deliberately reusing one render path so the two views (owner-facing
// and self-facing) can never visually drift from the one backend resolver
// they both already share.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberProgressSheet } from "../member-progress-sheet";

const mockGetTeamMemberProgress = vi.fn();
const mockGetMyTeamProgress = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getTeamMemberProgress: mockGetTeamMemberProgress,
    getMyTeamProgress: mockGetMyTeamProgress,
  }),
}));

const PROGRESS = {
  user: { id: "u1", name: "Dev One", email: "dev1@acme.com", avatar: null },
  stats: { points: 10, level: 1, currentStreak: 1, longestStreak: 1, lastActivityAt: null },
  courses: [],
  paths: [],
  projects: [],
  quizzes: { taken: 0, passed: 0 },
  mockInterviews: { taken: 0, completed: 0, lastTakenAt: null },
  activity: [],
};

describe("MemberProgressSheet — asSelf mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches via getMyTeamProgress, never getTeamMemberProgress, when asSelf is true", async () => {
    mockGetMyTeamProgress.mockResolvedValue(PROGRESS);

    render(
      <MemberProgressSheet
        teamId="t1"
        memberId={null}
        asSelf
        open
        onOpenChange={vi.fn()}
      />,
    );

    await screen.findByText("Dev One");
    expect(mockGetMyTeamProgress).toHaveBeenCalledWith("t1");
    expect(mockGetTeamMemberProgress).not.toHaveBeenCalled();
  });

  it("still fetches via getTeamMemberProgress when asSelf is not set (the roster path is unchanged)", async () => {
    mockGetTeamMemberProgress.mockResolvedValue(PROGRESS);

    render(
      <MemberProgressSheet
        teamId="t1"
        memberId="m1"
        open
        onOpenChange={vi.fn()}
      />,
    );

    await screen.findByText("Dev One");
    expect(mockGetTeamMemberProgress).toHaveBeenCalledWith("t1", "m1");
    expect(mockGetMyTeamProgress).not.toHaveBeenCalled();
  });

  it("gives the dialog an accessible 'What your team can see about you' title while loading in asSelf mode", async () => {
    mockGetMyTeamProgress.mockReturnValue(new Promise(() => {}));

    render(
      <MemberProgressSheet
        teamId="t1"
        memberId={null}
        asSelf
        open
        onOpenChange={vi.fn()}
      />,
    );

    const dialog = await screen.findByRole("dialog", {
      name: /what your team can see about you/i,
    });
    expect(dialog).toBeInTheDocument();
  });
});
