// Task 5 fix-round-1 — coordinator's Finding 1: `useAppStore()` subscribes to
// the entire app store, so its object identity changes on ANY set() call
// anywhere in the app (e.g. navigation-bar.tsx's notification poll firing
// setLevelUpModal). The roster effect used to list `store` (and the always-
// fresh inline `onOpenChange`) in its deps, so an unrelated store update
// while the dialog was open re-ran the fetch and rebuilt `selected` from the
// server, wiping out any ticks the user hadn't saved yet. Fixed by dropping
// `store`/`onOpenChange` from the deps (matching the loadTeams/loadRoster
// precedent in components/pages/team.tsx) and keying the effect only on
// open/groupId/teamId/reloadToken.
//
// Also covers Finding 2: a failed roster fetch used to silently close the
// dialog (`onOpenChange(false)`) with no explanation. It now shows a
// toast.error, keeps the dialog open, and offers a retry.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { GroupMembersDialog } from "../group-members-dialog";
import type { TeamMember } from "@/lib/data";

const mockGetTeamMembers = vi.fn();
const mockSetTeamGroupMembers = vi.fn();

// Deliberately a fresh object literal on every call. That mirrors the real
// app: `useAppStore()` called without a selector re-subscribes to the whole
// store and hands back a new snapshot whenever ANY slice changes, so its
// identity is never stable across renders. Returning a new object here on
// every invocation reproduces that "unrelated set() elsewhere" scenario
// without needing to wire up the real store.
vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getTeamMembers: mockGetTeamMembers,
    setTeamGroupMembers: mockSetTeamGroupMembers,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const MEMBERS: TeamMember[] = [
  {
    id: "m1",
    role: "MEMBER",
    status: "ACTIVE",
    joinedAt: "2026-01-01",
    user: { id: "u1", name: "Ada Lovelace", email: "ada@acme.com" },
    groups: [],
  },
  {
    id: "m2",
    role: "MEMBER",
    status: "ACTIVE",
    joinedAt: "2026-01-01",
    user: { id: "u2", name: "Grace Hopper", email: "grace@acme.com" },
    groups: [],
  },
];

function setup(overrides: Partial<React.ComponentProps<typeof GroupMembersDialog>> = {}) {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  const utils = render(
    <GroupMembersDialog
      teamId="t1"
      groupId="g1"
      groupName="Platform"
      open
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      {...overrides}
    />,
  );
  return { onOpenChange, onSaved, ...utils };
}

describe("GroupMembersDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps a ticked box checked across an unrelated store identity change", async () => {
    mockGetTeamMembers.mockResolvedValue({ members: MEMBERS });
    const { rerender } = setup();

    const adaCheckbox = await screen.findByRole("checkbox", { name: /ada lovelace/i });
    expect(adaCheckbox).not.toBeChecked();

    fireEvent.click(adaCheckbox);
    expect(adaCheckbox).toBeChecked();

    // Simulate an unrelated store update elsewhere in the app (e.g. the
    // notification poll firing setLevelUpModal) by forcing a re-render while
    // the dialog stays open on the same group, with brand new prop function
    // identities — exactly what a parent re-render driven by an unrelated
    // store change would produce. The mocked useAppStore() above also hands
    // back a new object on every call, reproducing the store side of it too.
    rerender(
      <GroupMembersDialog
        teamId="t1"
        groupId="g1"
        groupName="Platform"
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /ada lovelace/i })).toBeChecked();
    // The roster must not have been re-fetched — a refetch is what rebuilds
    // `selected` from server state and discards the unsaved tick.
    expect(mockGetTeamMembers).toHaveBeenCalledTimes(1);
  });

  it("shows an error and offers a retry instead of silently closing when the roster fails to load", async () => {
    mockGetTeamMembers.mockRejectedValueOnce(new Error("network error"));
    const { onOpenChange } = setup();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();

    mockGetTeamMembers.mockResolvedValueOnce({ members: MEMBERS });
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByRole("checkbox", { name: /ada lovelace/i })).toBeInTheDocument();
  });
});
