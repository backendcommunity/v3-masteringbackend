/**
 * TEAM_NAV_ITEMS is the single source of truth for both the tab strip and
 * TeamHubLayout's route guard, so a wrong `managerOnly` here does two things
 * at once: it hides the tab AND redirects anyone who types the URL.
 *
 * Assignments must be false. A plain member is half this feature's audience —
 * they are the ones being assigned things.
 */
import { describe, it, expect } from "vitest";
import { TEAM_NAV_ITEMS } from "../team-nav-items";

describe("TEAM_NAV_ITEMS", () => {
  it("puts Assignments between Groups and Leaderboard", () => {
    const labels = TEAM_NAV_ITEMS.map((i) => i.label);
    expect(labels).toEqual([
      "Overview", "Members", "Groups", "Assignments", "Leaderboard", "Settings",
    ]);
  });

  it("leaves Assignments open to a plain member", () => {
    const item = TEAM_NAV_ITEMS.find((i) => i.label === "Assignments");
    expect(item?.managerOnly).toBe(false);
  });

  it("keeps the manager-only screens manager-only", () => {
    const managerOnly = TEAM_NAV_ITEMS.filter((i) => i.managerOnly).map((i) => i.label);
    expect(managerOnly).toEqual(["Overview", "Groups", "Settings"]);
  });
});
