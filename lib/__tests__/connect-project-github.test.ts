import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({ api: { post: vi.fn(), get: vi.fn() }, socketAPI: {} }));
import { api } from "../api";
import { useAppStore } from "../store";

describe("connectProjectGithub", () => {
  beforeEach(() => vi.clearAllMocks());

  it("POSTs the connect endpoint and returns the linked repo (auto mode)", async () => {
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          connected: true,
          repoFullName: "octocat/my-project",
          owner: "octocat",
          repo: "my-project",
        },
      },
    });

    const res = await useAppStore
      .getState()
      .connectProjectGithub("my-project", { mode: "auto" });

    expect(api.post).toHaveBeenCalledWith("/projects/my-project/github", {
      mode: "auto",
    });
    expect(res.connected).toBe(true);
    expect(res.repoFullName).toBe("octocat/my-project");
    expect(res.owner).toBe("octocat");
    expect(res.repo).toBe("my-project");
  });

  it("forwards the body for existing mode", async () => {
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          connected: true,
          repoFullName: "octocat/existing",
          owner: "octocat",
          repo: "existing",
        },
      },
    });

    await useAppStore.getState().connectProjectGithub("slug", {
      mode: "existing",
      repoFullName: "octocat/existing",
    });

    expect(api.post).toHaveBeenCalledWith("/projects/slug/github", {
      mode: "existing",
      repoFullName: "octocat/existing",
    });
  });

  it("rethrows a 409 with the response data intact (authUrl path)", async () => {
    const err = Object.assign(new Error("Conflict"), {
      response: {
        status: 409,
        data: { message: "Re-authorize to create a repo", authUrl: "https://github.com/login/oauth/authorize?x=1" },
      },
    });
    (api.post as any).mockRejectedValue(err);

    await expect(
      useAppStore.getState().connectProjectGithub("slug", { mode: "auto" }),
    ).rejects.toMatchObject({
      response: {
        status: 409,
        data: { authUrl: "https://github.com/login/oauth/authorize?x=1" },
      },
    });
  });

  it("rethrows a 409 with the installUrl intact (app-not-installed path)", async () => {
    const err = Object.assign(new Error("Conflict"), {
      response: {
        status: 409,
        data: { message: "App not installed", installUrl: "https://github.com/apps/x/installations/new?state=a+" },
      },
    });
    (api.post as any).mockRejectedValue(err);

    await expect(
      useAppStore.getState().connectProjectGithub("slug", { mode: "auto" }),
    ).rejects.toMatchObject({
      response: { status: 409, data: { installUrl: expect.stringContaining("installations/new") } },
    });
  });
});
