import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({ api: { post: vi.fn() }, socketAPI: {} }));
import { api } from "../api";
import { useAppStore } from "../store";

describe("gradeProjectTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("POSTs the grade endpoint and returns the verdict", async () => {
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          passed: true,
          checks: [{ kind: "status", passed: true, detail: "200" }],
          statusCode: 200,
          latencyMs: 42,
          pointsAwarded: 20,
          projectCompleted: false,
        },
      },
    });
    const res = await useAppStore.getState().gradeProjectTask("proj", "task-1");
    expect(api.post).toHaveBeenCalledWith("/projects/proj/tasks/task-1/grade");
    expect(res.passed).toBe(true);
    expect(res.checks[0].passed).toBe(true);
    expect(res.checks[0].detail).toBe("200");
    expect(res.pointsAwarded).toBe(20);
  });

  it("returns a failing verdict without throwing", async () => {
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          passed: false,
          checks: [{ kind: "status", passed: false, detail: "Expected 200, got 404" }],
          statusCode: 404,
          latencyMs: 38,
          pointsAwarded: 0,
          projectCompleted: false,
          error: "status mismatch",
        },
      },
    });
    const res = await useAppStore.getState().gradeProjectTask("proj", "task-2");
    expect(api.post).toHaveBeenCalledWith("/projects/proj/tasks/task-2/grade");
    expect(res.passed).toBe(false);
    expect(res.checks[0].passed).toBe(false);
    expect(res.error).toBe("status mismatch");
  });

  it("propagates network errors (e.g. 409) so the caller can handle them", async () => {
    const err = Object.assign(new Error("Conflict"), { response: { status: 409 } });
    (api.post as any).mockRejectedValue(err);
    await expect(useAppStore.getState().gradeProjectTask("proj", "task-3")).rejects.toMatchObject({
      response: { status: 409 },
    });
  });
});
