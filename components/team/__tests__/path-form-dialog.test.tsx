/**
 * Ruling R24: creating and renaming a team path. Before this, seven
 * endpoints and two screens existed and no path could be brought into
 * existence from the UI at all.
 *
 * The asymmetry these tests pin: a blank summary is OMITTED on create (the
 * backend defaults it to "", and there is nothing to clear on a path that
 * doesn't exist yet) but sent as an explicit `null` on update, which is how
 * the API says "clear it" — `undefined` there would leave the old summary
 * standing and read as a silently failed edit.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PathFormDialog } from "../path-form-dialog";
import type { TeamPath } from "@/lib/data";

const mockCreateTeamPath = vi.fn();
const mockUpdateTeamPath = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    createTeamPath: mockCreateTeamPath,
    updateTeamPath: mockUpdateTeamPath,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PATH: TeamPath = {
  id: "p1",
  title: "Backend Fundamentals",
  slug: "backend-fundamentals",
  summary: "Everything a new backend hire needs in week one.",
  sectionCount: 2,
  createdAt: "2026-08-01T00:00:00.000Z",
};

function renderDialog(path: TeamPath | null) {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  render(
    <PathFormDialog teamId="t1" path={path} onSaved={onSaved} onClose={onClose} />,
  );
  return { onSaved, onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateTeamPath.mockResolvedValue({ id: "p9", title: "New", slug: "new" });
  mockUpdateTeamPath.mockResolvedValue({ id: "p1", title: "Renamed" });
});

describe("PathFormDialog", () => {
  it("creates a path with its summary, then reports and closes", async () => {
    const { onSaved, onClose } = renderDialog(null);

    expect(screen.getByRole("heading", { name: /new path/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "  On-call Readiness  " },
    });
    fireEvent.change(screen.getByLabelText(/summary/i), {
      target: { value: "  What to do at 3am.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /create path/i }));

    await waitFor(() =>
      expect(mockCreateTeamPath).toHaveBeenCalledWith(
        "t1",
        "On-call Readiness",
        "What to do at 3am.",
      ),
    );
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("omits a blank summary on create rather than sending an empty one", async () => {
    renderDialog(null);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "On-call Readiness" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create path/i }));

    await waitFor(() => expect(mockCreateTeamPath).toHaveBeenCalled());
    expect(mockCreateTeamPath).toHaveBeenCalledWith("t1", "On-call Readiness", undefined);
  });

  it("prefills from the path it is editing and renames it", async () => {
    const { onSaved } = renderDialog(PATH);

    expect(screen.getByDisplayValue("Backend Fundamentals")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Everything a new backend hire needs in week one."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Backend Fundamentals II" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockUpdateTeamPath).toHaveBeenCalledWith("t1", "p1", {
        title: "Backend Fundamentals II",
        summary: "Everything a new backend hire needs in week one.",
      }),
    );
    expect(onSaved).toHaveBeenCalled();
    expect(mockCreateTeamPath).not.toHaveBeenCalled();
  });

  it("clears a summary with an explicit null, never undefined", async () => {
    renderDialog(PATH);

    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateTeamPath).toHaveBeenCalled());
    const [, , input] = mockUpdateTeamPath.mock.calls[0];
    // `undefined` here would leave the old summary in place — the edit
    // would look like it had silently failed.
    expect(input.summary).toBeNull();
    expect("summary" in input).toBe(true);
  });

  it("cannot save a blank title", () => {
    renderDialog(null);

    expect(screen.getByRole("button", { name: /create path/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: /create path/i })).toBeDisabled();
    expect(mockCreateTeamPath).not.toHaveBeenCalled();
  });

  it("keeps the dialog open with the typed text when the save fails, and says why", async () => {
    mockCreateTeamPath.mockRejectedValueOnce({
      response: { data: { message: "Path title must be 100 characters or fewer." } },
    });
    const { onSaved, onClose } = renderDialog(null);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "A long one" } });
    fireEvent.click(screen.getByRole("button", { name: /create path/i }));

    expect(
      await screen.findByText("Path title must be 100 characters or fewer."),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("A long one")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
