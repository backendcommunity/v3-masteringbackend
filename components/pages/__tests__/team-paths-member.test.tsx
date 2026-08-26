/**
 * A team's custom paths, as a plain MEMBER sees them.
 *
 * Sub-project 3a shipped a member view that rendered nothing at all — the
 * API served a member's data fine, but every piece of UI sat behind a
 * canManage check. So this page is built and tested for the plain-member
 * path FIRST, completely standing alone, before a single manager/authoring
 * affordance exists (Task 11 adds those). That's also why this file never
 * calls the manager-only endpoints (getTeamPath, createTeamPath,
 * updateTeamPath, archiveTeamPath, setPathSections, setSectionItems) — not
 * "handle their 403 gracefully", just never call them here.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TeamPathsPage } from "../team-paths";

const mockGetMyTeams = vi.fn();
const mockGetTeamPaths = vi.fn();
const mockGetTeamPath = vi.fn();
const mockCreateTeamPath = vi.fn();
const mockUpdateTeamPath = vi.fn();
const mockArchiveTeamPath = vi.fn();
const mockSetPathSections = vi.fn();
const mockSetSectionItems = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamPaths: mockGetTeamPaths,
    getTeamPath: mockGetTeamPath,
    createTeamPath: mockCreateTeamPath,
    updateTeamPath: mockUpdateTeamPath,
    archiveTeamPath: mockArchiveTeamPath,
    setPathSections: mockSetPathSections,
    setSectionItems: mockSetSectionItems,
  }),
}));

const MEMBER_TEAM = { id: "t1", name: "Acme", ownerId: "o1", role: "MEMBER" as const };

const PATHS = [
  {
    // `id` deliberately does NOT look like `slug` — a card built from
    // `path.id` instead of `path.slug` must fail the link-target test below.
    id: "uuid-abc-123",
    title: "Backend Fundamentals",
    slug: "backend-fundamentals",
    summary: "Everything a new backend hire needs in week one.",
    sectionCount: 4,
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "uuid-def-456",
    title: "On-call Readiness",
    slug: "on-call-readiness",
    summary: null,
    sectionCount: 1,
    createdAt: "2026-08-10T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMyTeams.mockResolvedValue([MEMBER_TEAM]);
  mockGetTeamPaths.mockResolvedValue(PATHS);
});

describe("a member's team-paths screen", () => {
  it("shows their team's paths as cards — title, summary, section count", async () => {
    render(<TeamPathsPage />);

    await screen.findByText("Backend Fundamentals");
    expect(
      screen.getByText("Everything a new backend hire needs in week one."),
    ).toBeInTheDocument();
    expect(screen.getByText(/4 sections/i)).toBeInTheDocument();

    expect(screen.getByText("On-call Readiness")).toBeInTheDocument();
    expect(screen.getByText(/1 section\b/i)).toBeInTheDocument();
  });

  it("links a card by SLUG, never by id — a link built from id is a 404 wearing a link's clothes", async () => {
    render(<TeamPathsPage />);

    const link = await screen.findByRole("link", { name: /backend fundamentals/i });
    expect(link).toHaveAttribute("href", "/paths/backend-fundamentals");
    // Pin the negative directly: it must NOT be the id, even though a
    // careless `routes.pathDetail(path.id)` would still produce *a* href.
    expect(link).not.toHaveAttribute("href", "/paths/uuid-abc-123");
  });

  it("reads plainly when the team has no paths", async () => {
    mockGetTeamPaths.mockResolvedValue([]);
    render(<TeamPathsPage />);

    expect(await screen.findByText(/no paths/i)).toBeInTheDocument();
  });

  it("never calls the manager-only path endpoints for a plain member", async () => {
    render(<TeamPathsPage />);
    await screen.findByText("Backend Fundamentals");

    // Not merely "handles the 403" — it must not ask in the first place.
    expect(mockGetTeamPath).not.toHaveBeenCalled();
    expect(mockCreateTeamPath).not.toHaveBeenCalled();
    expect(mockUpdateTeamPath).not.toHaveBeenCalled();
    expect(mockArchiveTeamPath).not.toHaveBeenCalled();
    expect(mockSetPathSections).not.toHaveBeenCalled();
    expect(mockSetSectionItems).not.toHaveBeenCalled();
  });

  it("leaves a usable screen with a retry when the fetch fails, not a dead one", async () => {
    mockGetTeamPaths.mockRejectedValueOnce(new Error("network error"));
    render(<TeamPathsPage />);

    const retry = await screen.findByRole("button", { name: /try again/i });
    expect(retry).toBeInTheDocument();

    mockGetTeamPaths.mockResolvedValueOnce(PATHS);
    fireEvent.click(retry);

    await screen.findByText("Backend Fundamentals");
    await waitFor(() => expect(mockGetTeamPaths).toHaveBeenCalledTimes(2));
  });
});
