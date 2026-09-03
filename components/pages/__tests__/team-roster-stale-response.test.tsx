// Finding 1 (team-groups review): loadRoster had no staleness guard. The
// sibling progress effect protects itself with a `cancelled` flag; loadRoster
// called setRoster(data) unconditionally, and rosterLoading's `finally`
// cleared unconditionally too.
//
// Before the group filter existed, loadRoster had exactly one driver
// (selectedTeamId) and a slower-but-earlier response arriving after a
// faster-but-later one was near-unreachable. The filter gives the roster a
// second driver a viewer can flip quickly: pick Platform, then pick Data
// before Platform's response has landed. If Platform's response is slower
// and arrives second, last-write-wins overwrites Data's already-rendered
// roster with Platform's members, while the caption (driven directly by
// groupFilter, not by the response) still reads "Showing Data." — a roster
// under the wrong department's name.
//
// This test drives exactly that ordering: request Platform (slow), then
// Data (fast), and asserts the roster that ends up on screen is the one
// that was requested LAST, not the one that RESOLVED last.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
  useUser: () => ({ id: "u-owner", name: "Owner" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock the shadcn/Radix Select with a plain native <select> so the test can
// drive it with a normal `fireEvent.change` — Radix's pointer-capture/portal
// machinery doesn't run under jsdom. Same pattern as
// components/pages/__tests__/team-overview-filter-failure.test.tsx.
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid="group-filter-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const TEAM = {
  id: "t1",
  name: "Acme",
  ownerId: "u-owner",
  role: "OWNER" as const,
  subscription: { status: "active", seats: 5, paidSeats: 5 },
};

const GROUPS = [
  { id: "platform", name: "Platform", memberCount: 1 },
  { id: "data", name: "Data", memberCount: 1 },
];

function member(id: string, email: string) {
  return {
    id,
    role: "MEMBER",
    status: "ACTIVE",
    joinedAt: "2026-08-22T00:00:00.000Z",
    user: { id: `u-${id}`, name: id, email, avatar: null },
    groups: [],
  };
}

const ALL_MEMBERS = [member("p1", "platform@acme.com"), member("d1", "data@acme.com")];
const PLATFORM_MEMBERS = [member("p1", "platform@acme.com")];
const DATA_MEMBERS = [member("d1", "data@acme.com")];

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([TEAM]);
  mockGetTeamGroups.mockResolvedValue(GROUPS);
  mockGetTeamProgress.mockResolvedValue({ members: [] });
});

describe("TeamPage — roster last-write-wins", () => {
  it("keeps the LAST-requested group's roster even if an earlier request resolves later", async () => {
    mockGetTeamMembers.mockImplementation((_teamId: string, groupId?: string) => {
      if (groupId === "platform") return delay(60, { members: PLATFORM_MEMBERS });
      if (groupId === "data") return delay(5, { members: DATA_MEMBERS });
      return Promise.resolve({ members: ALL_MEMBERS });
    });

    render(<TeamPage onNavigate={vi.fn()} />);

    // Initial unfiltered load.
    await screen.findByText("platform@acme.com");

    const select = await screen.findByTestId("group-filter-select");

    // Pick Platform (slow, 60ms), then quickly pick Data (fast, 5ms) before
    // Platform's response has landed.
    fireEvent.change(select, { target: { value: "platform" } });
    fireEvent.change(select, { target: { value: "data" } });

    // Data resolves first (5ms) — its roster renders.
    await screen.findByText("data@acme.com");

    // Wait past Platform's 60ms response so it has a chance to land.
    await new Promise((r) => setTimeout(r, 100));

    // The viewer is still looking at Data, both by caption and by roster —
    // Platform's late response must not have won.
    await waitFor(() => {
      expect(screen.getByText(/showing/i)).toHaveTextContent("Data");
    });
    expect(screen.getByText("data@acme.com")).toBeInTheDocument();
    expect(screen.queryByText("platform@acme.com")).not.toBeInTheDocument();
  });
});
