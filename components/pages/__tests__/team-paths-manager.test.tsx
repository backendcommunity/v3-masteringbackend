/**
 * The manager's half of the team-paths screen — the authoring surface Task
 * 11 added UNDERNEATH the member view, never around it.
 *
 * The rule this file exists to hold: a plain member must keep seeing
 * exactly what they saw before any of this existed. Sub-project 3a shipped
 * a member view that rendered nothing because a canManage check had crept
 * upward over the whole page; the member's own tests live in
 * team-paths-member.test.tsx and still pass unchanged, and these add the
 * other direction — the manager gets the affordance, the member gets
 * neither the affordance nor the manager-only fetch that sits behind it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { TeamPathsPage } from "../team-paths";

const mockGetMyTeams = vi.fn();
const mockGetTeamPaths = vi.fn();
const mockGetTeamPath = vi.fn();
const mockSetPathSections = vi.fn();
const mockSetSectionItems = vi.fn();
const mockSearchAssignable = vi.fn();
const mockCreateTeamPath = vi.fn();
const mockUpdateTeamPath = vi.fn();
const mockArchiveTeamPath = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getMyTeams: mockGetMyTeams,
    getTeamPaths: mockGetTeamPaths,
    getTeamPath: mockGetTeamPath,
    setPathSections: mockSetPathSections,
    setSectionItems: mockSetSectionItems,
    searchAssignable: mockSearchAssignable,
    createTeamPath: mockCreateTeamPath,
    updateTeamPath: mockUpdateTeamPath,
    archiveTeamPath: mockArchiveTeamPath,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PATHS = [
  {
    id: "p1",
    title: "Backend Fundamentals",
    slug: "backend-fundamentals",
    summary: "Everything a new backend hire needs in week one.",
    sectionCount: 2,
    createdAt: "2026-08-01T00:00:00.000Z",
  },
];

const DETAIL = {
  id: "p1",
  title: "Backend Fundamentals",
  summary: null,
  sections: [
    { id: "sec-1", title: "Week 1 - HTTP", order: 0, items: [] },
  ],
};

const team = (role: "OWNER" | "ADMIN" | "MEMBER") => ({
  id: "t1",
  name: "Acme",
  ownerId: "o1",
  role,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTeamPaths.mockResolvedValue(PATHS);
  mockGetTeamPath.mockResolvedValue(DETAIL);
  mockSearchAssignable.mockResolvedValue([]);
  mockCreateTeamPath.mockResolvedValue({ id: "p9", title: "New", slug: "new" });
  mockUpdateTeamPath.mockResolvedValue({ id: "p1", title: "Renamed" });
  mockArchiveTeamPath.mockResolvedValue(undefined);
});

describe("the manager's half of the team-paths screen", () => {
  it("offers no authoring affordance to a plain member, and asks for no manager data", async () => {
    mockGetMyTeams.mockResolvedValue([team("MEMBER")]);
    render(<TeamPathsPage />);
    await screen.findByText("Backend Fundamentals");

    expect(screen.queryByRole("button", { name: /edit sections/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new path/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /rename/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /archive/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/manage paths/i)).not.toBeInTheDocument();
    // Not "handles the 403" — it never asks.
    expect(mockGetTeamPath).not.toHaveBeenCalled();
    expect(mockCreateTeamPath).not.toHaveBeenCalled();
    expect(mockUpdateTeamPath).not.toHaveBeenCalled();
    expect(mockArchiveTeamPath).not.toHaveBeenCalled();
  });

  it("still shows a manager their own member view, not just the manager tools", async () => {
    mockGetMyTeams.mockResolvedValue([team("OWNER")]);
    render(<TeamPathsPage />);

    // The member card — linked by slug — is still there for an OWNER.
    const link = await screen.findByRole("link", { name: /backend fundamentals/i });
    expect(link).toHaveAttribute("href", "/paths/backend-fundamentals");
    expect(screen.getByText("Manage paths")).toBeInTheDocument();
  });

  it("opens the section editor for the chosen path, and only then loads its sections", async () => {
    mockGetMyTeams.mockResolvedValue([team("ADMIN")]);
    render(<TeamPathsPage />);

    const edit = await screen.findByRole("button", { name: /edit sections/i });
    // Mounting the editor is what triggers the manager-only fetch — nothing
    // prefetches it behind the button.
    expect(mockGetTeamPath).not.toHaveBeenCalled();

    fireEvent.click(edit);
    await waitFor(() => expect(mockGetTeamPath).toHaveBeenCalledWith("t1", "p1"));
    expect(await screen.findByDisplayValue("Week 1 - HTTP")).toBeInTheDocument();
  });

  it("refreshes the list when the editor reports a save, and closes on cancel", async () => {
    mockGetMyTeams.mockResolvedValue([team("OWNER")]);
    mockSetPathSections.mockResolvedValue({ id: "p1", sectionCount: 1 });
    render(<TeamPathsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /edit sections/i }));
    await screen.findByDisplayValue("Week 1 - HTTP");
    expect(mockGetTeamPaths).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    // The card list is re-read so a renamed section count isn't stale, and
    // the dialog closes behind it.
    await waitFor(() => expect(mockGetTeamPaths).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByDisplayValue("Week 1 - HTTP")).not.toBeInTheDocument(),
    );
  });

  it("can bring a path into existence at all — R24", async () => {
    mockGetMyTeams.mockResolvedValue([team("OWNER")]);
    render(<TeamPathsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /new path/i }));
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "On-call Readiness" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create path/i }));

    await waitFor(() =>
      expect(mockCreateTeamPath).toHaveBeenCalledWith("t1", "On-call Readiness", undefined),
    );
    // The list behind it is re-read, so the new path is there to build.
    await waitFor(() => expect(mockGetTeamPaths).toHaveBeenCalledTimes(2));
  });

  it("opens the rename dialog prefilled from the path it was opened on", async () => {
    mockGetMyTeams.mockResolvedValue([team("OWNER")]);
    render(<TeamPathsPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /rename backend fundamentals/i }),
    );

    expect(screen.getAllByDisplayValue("Backend Fundamentals").length).toBeGreaterThan(0);
    expect(
      screen.getByDisplayValue("Everything a new backend hire needs in week one."),
    ).toBeInTheDocument();
    // Renaming is an update, never a second create.
    expect(mockCreateTeamPath).not.toHaveBeenCalled();
  });

  it("asks before archiving, and only archives on confirm", async () => {
    mockGetMyTeams.mockResolvedValue([team("OWNER")]);
    render(<TeamPathsPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /archive backend fundamentals/i }),
    );

    const confirm = await screen.findByRole("alertdialog");
    // Nothing has happened yet — this is the one that a developer has to
    // undo.
    expect(mockArchiveTeamPath).not.toHaveBeenCalled();
    expect(within(confirm).getByText(/developer/i)).toBeInTheDocument();

    fireEvent.click(within(confirm).getByRole("button", { name: /^archive$/i }));
    await waitFor(() => expect(mockArchiveTeamPath).toHaveBeenCalledWith("t1", "p1"));
    await waitFor(() => expect(mockGetTeamPaths).toHaveBeenCalledTimes(2));
  });

  it("keeps the archive confirmation open when the call fails", async () => {
    mockGetMyTeams.mockResolvedValue([team("OWNER")]);
    mockArchiveTeamPath.mockRejectedValueOnce(new Error("network error"));
    render(<TeamPathsPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /archive backend fundamentals/i }),
    );
    const confirm = await screen.findByRole("alertdialog");
    fireEvent.click(within(confirm).getByRole("button", { name: /^archive$/i }));

    await waitFor(() => expect(mockArchiveTeamPath).toHaveBeenCalled());
    // A confirmation that closed on failure would look exactly like one
    // that worked.
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(mockGetTeamPaths).toHaveBeenCalledTimes(1);
  });
});
