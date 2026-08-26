/**
 * Team paths get their own shelf on the Learning Paths catalogue, named after
 * the team that built them — the way "Start for Free" sits above ALL COURSES
 * on the Courses page. They are NOT mixed into the main grid, because a path
 * your company wrote for you is a different kind of thing from the catalogue.
 *
 * The partition is `ownerTeamId`, which already rides the /roadmaps response —
 * no second request decides who sees what. The backend has already filtered
 * that list to paths the viewer's active teams own, so anything with an
 * ownerTeamId here is a path this viewer is entitled to see. This file's job
 * is to prove the SPLIT is right, not to re-prove the visibility rule.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LearningPathsPage } from "../learning-paths";

const mockGetRoadmaps = vi.fn();
const mockGetBookmarks = vi.fn();
const mockGetMyTeams = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getRoadmaps: mockGetRoadmaps,
    getBookmarks: mockGetBookmarks,
    getMyTeams: mockGetMyTeams,
    createBookmark: vi.fn(),
    deleteBookmark: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-user", () => ({ useUser: () => ({ isPremium: true }) }));
vi.mock("@/lib/analytics", () => ({
  analytics: { page: vi.fn(), track: vi.fn() },
}));

const mockStartItem = vi.fn();
vi.mock("@/lib/start-flow", () => ({
  startItem: (...args: unknown[]) => mockStartItem(...args),
}));

const CATALOGUE_PATH = {
  id: "rm-cat-1",
  slug: "backend-engineering",
  title: "Backend Engineering",
  summary: "The complete path from zero to job-ready.",
  ownerTeamId: null,
  topics: [],
};

const ACME_PATH = {
  // id deliberately unlike slug — a card built from `id` fails the link test.
  id: "rm-acme-9",
  slug: "acme-q3-payments-onboarding",
  title: "Acme Q3 Payments Onboarding",
  summary: "Internal onboarding for the payments team.",
  ownerTeamId: "team-acme",
  topics: [],
};

const GLOBEX_PATH = {
  id: "rm-globex-4",
  slug: "globex-pricing-rewrite",
  title: "Globex Pricing Rewrite",
  summary: "How we are rebuilding pricing.",
  ownerTeamId: "team-globex",
  topics: [],
};

const ACME = {
  id: "team-acme",
  name: "Acme Engineering",
  ownerId: "o1",
  role: "MEMBER" as const,
  subscription: null,
};
const GLOBEX = {
  id: "team-globex",
  name: "Globex Ltd",
  ownerId: "o2",
  role: "OWNER" as const,
  subscription: null,
};

/** The main grid, i.e. everything below the ALL PATHS divider. */
const catalogueGrid = () => screen.getByTestId("all-paths-grid");

beforeEach(() => {
  vi.resetAllMocks();
  mockGetBookmarks.mockResolvedValue({ bookmarks: [] });
  mockGetMyTeams.mockResolvedValue([ACME]);
  mockGetRoadmaps.mockResolvedValue({
    roadmaps: [CATALOGUE_PATH, ACME_PATH],
  });
});

describe("Learning Paths — the team shelf", () => {
  it("gives a team's paths their own section, headed with the team's name", async () => {
    render(<LearningPathsPage />);

    // Catches: rendering the section under a generic heading when the team
    // name was available, or not rendering it at all.
    expect(await screen.findByText("Acme Engineering")).toBeTruthy();

    const shelf = screen.getByTestId("team-shelf-team-acme");
    expect(shelf.textContent).toContain("Acme Q3 Payments Onboarding");
  });

  it("keeps team paths OUT of the main catalogue grid", async () => {
    render(<LearningPathsPage />);
    await screen.findByText("Acme Engineering");

    // Catches the whole point of the change: leaving team paths mixed in, so
    // they render twice. Asserting on the grid subtree specifically, because
    // the title legitimately appears once on the shelf above it.
    expect(catalogueGrid().textContent).not.toContain(
      "Acme Q3 Payments Onboarding",
    );
    expect(catalogueGrid().textContent).toContain("Backend Engineering");
  });

  it("counts only catalogue paths on the All paths tab", async () => {
    render(<LearningPathsPage />);
    await screen.findByText("Acme Engineering");

    // Catches a count that still includes paths shown above the grid it
    // labels — two roadmaps came back, one belongs on the shelf.
    const allTab = screen.getByRole("button", { name: /All paths/i });
    expect(allTab.textContent).toContain("1");
  });

  it("opens a team path by slug, never by id", async () => {
    render(<LearningPathsPage />);
    await screen.findByText("Acme Engineering");

    fireEvent.click(screen.getByText("Acme Q3 Payments Onboarding"));

    // Catches a card built from `path.id` — a 404 wearing a link's clothes.
    await waitFor(() => expect(mockStartItem).toHaveBeenCalled());
    const arg = mockStartItem.mock.calls[0][0] as {
      type: string;
      slug: string;
    };
    expect(arg.type).toBe("path");
    expect(arg.slug).toBe("acme-q3-payments-onboarding");
  });

  it("gives each team its own section for someone on two teams", async () => {
    mockGetMyTeams.mockResolvedValue([ACME, GLOBEX]);
    mockGetRoadmaps.mockResolvedValue({
      roadmaps: [CATALOGUE_PATH, ACME_PATH, GLOBEX_PATH],
    });
    render(<LearningPathsPage />);

    expect(await screen.findByText("Acme Engineering")).toBeTruthy();
    expect(screen.getByText("Globex Ltd")).toBeTruthy();

    // Catches one flat shelf that conflates two teams' curricula.
    expect(screen.getByTestId("team-shelf-team-acme").textContent).not.toContain(
      "Globex Pricing Rewrite",
    );
    expect(
      screen.getByTestId("team-shelf-team-globex").textContent,
    ).not.toContain("Acme Q3 Payments Onboarding");
  });

  it("shows no shelf at all for someone on no team", async () => {
    mockGetMyTeams.mockResolvedValue([]);
    mockGetRoadmaps.mockResolvedValue({ roadmaps: [CATALOGUE_PATH] });
    render(<LearningPathsPage />);

    await screen.findByText("Backend Engineering");
    // Catches an empty headed shelf rendering for everyone.
    expect(screen.queryByTestId(/^team-shelf-/)).toBeNull();
    expect(screen.queryByText(/Paths your team has put together/i)).toBeNull();
  });

  it("narrows the shelf itself with the search box", async () => {
    // Two paths on ONE team, so the shelf survives the search and the
    // assertion is about its CONTENTS. Searching for something that matches
    // nothing would hide the shelf via the page's empty state instead, which
    // proves nothing about whether filters reach the shelf.
    mockGetRoadmaps.mockResolvedValue({
      roadmaps: [
        CATALOGUE_PATH,
        ACME_PATH,
        {
          id: "rm-acme-2",
          slug: "acme-oncall",
          title: "Acme On-call Readiness",
          summary: "Pager duty, runbooks, escalation.",
          ownerTeamId: "team-acme",
          topics: [],
        },
      ],
    });
    render(<LearningPathsPage />);
    await screen.findByText("Acme Engineering");

    const shelf = () => screen.getByTestId("team-shelf-team-acme");
    expect(shelf().textContent).toContain("Acme On-call Readiness");

    fireEvent.change(screen.getByPlaceholderText(/Search paths/i), {
      target: { value: "payments" },
    });

    // Catches a shelf built from the unfiltered set — it would still show
    // both while the grid below it narrowed.
    await waitFor(() =>
      expect(shelf().textContent).not.toContain("Acme On-call Readiness"),
    );
    expect(shelf().textContent).toContain("Acme Q3 Payments Onboarding");
  });

  it("hides the shelf when the filters exclude every team path", async () => {
    render(<LearningPathsPage />);
    await screen.findByText("Acme Engineering");

    // "Backend Engineering" is catalogue-only, so the grid still has a result
    // and the page's empty state does NOT fire — the shelf has to hide itself.
    fireEvent.change(screen.getByPlaceholderText(/Search paths/i), {
      target: { value: "Backend Engineering" },
    });

    await waitFor(() =>
      expect(screen.queryByTestId("team-shelf-team-acme")).toBeNull(),
    );
    expect(screen.queryByText("Acme Engineering")).toBeNull();
    expect(catalogueGrid().textContent).toContain("Backend Engineering");
  });

  it("still shows the paths when the team lookup fails, under a generic heading", async () => {
    mockGetMyTeams.mockRejectedValue(new Error("teams down"));
    render(<LearningPathsPage />);

    // Catches losing a member's own team curriculum because a name lookup
    // that is decoration, not authorization, happened to fail.
    expect(await screen.findByText("Team paths")).toBeTruthy();
    expect(
      screen.getByTestId("team-shelf-team-acme").textContent,
    ).toContain("Acme Q3 Payments Onboarding");
    expect(catalogueGrid().textContent).not.toContain(
      "Acme Q3 Payments Onboarding",
    );
  });
});
