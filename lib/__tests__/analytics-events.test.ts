import { describe, it, expect } from "vitest";
import {
  PROJECT_EVENTS,
  PLAYGROUND_EVENTS,
  TOUR_EVENTS,
  tourEvents,
  MOCK_INTERVIEW_EVENTS,
} from "@/lib/analytics-events";

describe("analytics event registry", () => {
  it("exposes the project events", () => {
    expect(PROJECT_EVENTS.tryPlaygroundClicked).toBe("project_try_playground_clicked");
    expect(PROJECT_EVENTS.viewed).toBe("project_viewed");
  });
  it("exposes the playground events", () => {
    expect(PLAYGROUND_EVENTS.opened).toBe("playground_opened");
    expect(PLAYGROUND_EVENTS.taskTestRun).toBe("playground_task_test_run");
    expect(PLAYGROUND_EVENTS.githubConflictResolved).toBe("playground_github_conflict_resolved");
  });
  it("exposes the tour events", () => {
    expect(TOUR_EVENTS.offered).toBe("playground_tour_offered");
    expect(TOUR_EVENTS.completed).toBe("playground_tour_completed");
  });
  it("uses snake_case for every value", () => {
    const all = { ...PROJECT_EVENTS, ...PLAYGROUND_EVENTS, ...TOUR_EVENTS, ...MOCK_INTERVIEW_EVENTS };
    for (const v of Object.values(all)) expect(v).toMatch(/^[a-z]+(_[a-z]+)*$/);
  });
  it("builds prefixed tour events", () => {
    const mi = tourEvents("mock_interview");
    expect(mi.offered).toBe("mock_interview_tour_offered");
    expect(mi.stepViewed).toBe("mock_interview_tour_step_viewed");
  });
  it("exposes mock interview product events", () => {
    expect(MOCK_INTERVIEW_EVENTS.demoStarted).toBe("mock_interview_demo_started");
    expect(MOCK_INTERVIEW_EVENTS.bannerCtaClicked).toBe("mock_interview_banner_cta_clicked");
  });
});
