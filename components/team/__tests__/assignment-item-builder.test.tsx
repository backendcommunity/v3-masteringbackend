/**
 * Task 8: the content picker inside AssignmentFormDialog. Store mock shaped
 * like components/team/__tests__/assignment-form-dialog.test.tsx — but this
 * component now only needs `searchAssignable`; the four old catalogue
 * fetchers are kept in the mock purely so tests can assert they're never
 * called (see the second test below).
 *
 * Test 9 is the load-bearing one: the backend's set-replace matches CUSTOM
 * items by the `id` the client sends back (content items match by (type,
 * refId) instead). Dropping `id` on a reorder — even just by rebuilding the
 * item objects — turns a harmless reorder into delete-and-recreate, and
 * AssignmentTaskCompletion cascades away with the deleted rows. That test
 * actually triggers a reorder and checks the object passed to `onChange`
 * still carries `id`, so it would fail if `move()` ever stopped preserving
 * object identity.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssignmentItemBuilder } from "../assignment-item-builder";
import type { AssignmentItemInput } from "@/lib/data";

const mockSearchAssignable = vi.fn();
const mockGetRoadmaps = vi.fn();
const mockGetCourses = vi.fn();
const mockGetProjects = vi.fn();
const mockGetMockInterviewTemplates = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    searchAssignable: mockSearchAssignable,
    getRoadmaps: mockGetRoadmaps,
    getCourses: mockGetCourses,
    getProjects: mockGetProjects,
    getMockInterviewTemplates: mockGetMockInterviewTemplates,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchAssignable.mockResolvedValue([]);
});

/** The button wrapping a search-result hit, as opposed to the plain <li> row for an already-added item. */
function resultButtonFor(text: string) {
  const hits = screen.getAllByText(text);
  const button = hits.map((el) => el.closest("button")).find((b): b is HTMLButtonElement => !!b);
  if (!button) throw new Error(`No result button found for "${text}"`);
  return button;
}

describe("AssignmentItemBuilder", () => {
  it("offers all eleven content types, correctly labelled, CUSTOM last", () => {
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    const select = screen.getByLabelText("Item type") as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toEqual([
      "Path",
      "Course",
      "Project",
      "Mock interview",
      "Chapter",
      "Article",
      "Video",
      "Task",
      "Quiz",
      "Exercise",
      "Custom",
    ]);
  });

  it("searches through searchAssignable for the chosen type and query, never the old catalogue fetchers", async () => {
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: { value: "postgres" },
    });

    await waitFor(() =>
      expect(mockSearchAssignable).toHaveBeenCalledWith("t1", "COURSE", "postgres"),
    );
    expect(mockGetRoadmaps).not.toHaveBeenCalled();
    expect(mockGetCourses).not.toHaveBeenCalled();
    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockGetMockInterviewTemplates).not.toHaveBeenCalled();
  });

  it("renders each result's breadcrumb so two same-titled hits are distinguishable", async () => {
    mockSearchAssignable.mockResolvedValue([
      { id: "r1", title: "Introduction", parentLabel: "Intro to Postgres" },
      { id: "r2", title: "Introduction", parentLabel: "Intro to Redis" },
    ]);
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "VIDEO" } });
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "intro" } });

    expect(await screen.findByText("Intro to Postgres")).toBeInTheDocument();
    expect(screen.getByText("Intro to Redis")).toBeInTheDocument();
    expect(screen.getAllByText("Introduction")).toHaveLength(2);
  });

  it("shows the free-text box for CUSTOM, not a search box, and Add appends {type: CUSTOM, text}", () => {
    const onChange = vi.fn();
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={onChange} />);

    expect(screen.getByPlaceholderText(/describe the task/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/describe the task/i), {
      target: { value: "Read the runbook" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(onChange).toHaveBeenCalledWith([{ type: "CUSTOM", text: "Read the runbook" }]);
    expect(mockSearchAssignable).not.toHaveBeenCalled();
  });

  it("cannot add a blank custom item", () => {
    const onChange = vi.fn();
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={onChange} />);

    const addButton = screen.getByRole("button", { name: /^add$/i });
    expect(addButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/describe the task/i), {
      target: { value: "   " },
    });
    expect(addButton).toBeDisabled();

    fireEvent.click(addButton);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("adding a content result appends {type, refId} and carries title and parentLabel for display", async () => {
    mockSearchAssignable.mockResolvedValue([
      { id: "c1", title: "Intro to Postgres", parentLabel: "Databases" },
    ]);
    const onChange = vi.fn();
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "postgres" } });
    await screen.findByText("Intro to Postgres");

    fireEvent.click(resultButtonFor("Intro to Postgres"));

    expect(onChange).toHaveBeenCalledWith([
      { type: "COURSE", refId: "c1", title: "Intro to Postgres", parentLabel: "Databases" },
    ]);
  });

  it("refuses a duplicate content item in the UI before the server's 409", async () => {
    mockSearchAssignable.mockResolvedValue([
      { id: "c1", title: "Intro to Postgres", parentLabel: "Databases" },
    ]);
    const onChange = vi.fn();
    const items: AssignmentItemInput[] = [
      { id: "i1", type: "COURSE", refId: "c1", title: "Intro to Postgres" },
    ];
    render(<AssignmentItemBuilder teamId="t1" items={items} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "postgres" } });
    await waitFor(() => expect(mockSearchAssignable).toHaveBeenCalled());

    fireEvent.click(resultButtonFor("Intro to Postgres"));

    expect(onChange).not.toHaveBeenCalled();
    expect(await screen.findByText(/already on this list/i)).toBeInTheDocument();
  });

  it("disables Add once the 25-item cap is reached", () => {
    const items: AssignmentItemInput[] = Array.from({ length: 25 }, (_, i) => ({
      id: `i${i}`,
      type: "CUSTOM",
      text: `Task ${i}`,
    }));
    render(<AssignmentItemBuilder teamId="t1" items={items} onChange={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText(/describe the task/i), {
      target: { value: "One more" },
    });

    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled();
    expect(screen.getByText(/25 items is the limit/i)).toBeInTheDocument();
  });

  it("keeps a saved item's id through a reorder — dropping it would turn the save into delete-and-recreate", () => {
    const onChange = vi.fn();
    const items: AssignmentItemInput[] = [
      { id: "i1", type: "COURSE", refId: "c1", title: "Intro to Postgres" },
      { id: "i2", type: "CUSTOM", text: "Read the runbook" },
    ];
    render(<AssignmentItemBuilder teamId="t1" items={items} onChange={onChange} />);

    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    // Move the CUSTOM item (loaded second) up ahead of the COURSE item — a
    // reorder that rebuilds the item objects without `id` would still pass
    // a test that only checked the id was present at load time; it takes
    // this move, and an exact-object assertion below, to expose it.
    fireEvent.click(moveUpButtons[1]);

    expect(onChange).toHaveBeenCalledWith([
      { id: "i2", type: "CUSTOM", text: "Read the runbook" },
      { id: "i1", type: "COURSE", refId: "c1", title: "Intro to Postgres" },
    ]);
  });

  it("fetches and renders the list immediately on selecting a type, with no query typed — the prompt is gone", async () => {
    mockSearchAssignable.mockResolvedValue([
      { id: "c1", title: "Intro to Postgres", parentLabel: "Databases" },
    ]);
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });

    await waitFor(() => expect(mockSearchAssignable).toHaveBeenCalledWith("t1", "COURSE", ""));
    expect(await screen.findByText("Intro to Postgres")).toBeInTheDocument();
    expect(screen.queryByText(/search for a course to add/i)).not.toBeInTheDocument();
    expect(screen.queryByText("No results.")).not.toBeInTheDocument();
  });

  it("narrows the browsed list through the same path when a query is typed", async () => {
    mockSearchAssignable.mockResolvedValue([]);
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });
    await waitFor(() => expect(mockSearchAssignable).toHaveBeenCalledWith("t1", "COURSE", ""));

    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "postgres" } });
    await waitFor(() =>
      expect(mockSearchAssignable).toHaveBeenCalledWith("t1", "COURSE", "postgres"),
    );
  });

  it("shows an error state with a retry option when searchAssignable rejects, not 'No results.'", async () => {
    mockSearchAssignable.mockRejectedValue(new Error("network blip"));
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "postgres" } });

    expect(await screen.findByText(/search failed/i)).toBeInTheDocument();
    expect(screen.queryByText("No results.")).not.toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /try again/i });
    mockSearchAssignable.mockResolvedValue([]);
    fireEvent.click(retryButton);

    await waitFor(() => expect(mockSearchAssignable).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("No results.")).toBeInTheDocument();
  });

  it("shows 'No results.' only once a search has actually resolved empty", async () => {
    mockSearchAssignable.mockResolvedValue([]);
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "postgres" } });

    expect(await screen.findByText("No results.")).toBeInTheDocument();
  });

  it("re-browses (not a stuck 'No results.') when the query is typed then cleared", async () => {
    mockSearchAssignable.mockResolvedValue([]);
    render(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "postgres" } });
    await screen.findByText("No results.");

    mockSearchAssignable.mockResolvedValue([
      { id: "c1", title: "Intro to Postgres", parentLabel: "Databases" },
    ]);
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "" } });

    await waitFor(() =>
      expect(mockSearchAssignable).toHaveBeenLastCalledWith("t1", "COURSE", ""),
    );
    expect(await screen.findByText("Intro to Postgres")).toBeInTheDocument();
  });

  it("does not list `store` in the search effect's deps — an unrelated re-render must not refetch", async () => {
    mockSearchAssignable.mockResolvedValue([]);
    const { rerender } = render(
      <AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />,
    );

    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "COURSE" } });
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "postgres" } });
    await waitFor(() => expect(mockSearchAssignable).toHaveBeenCalledTimes(1));

    // Each render call re-invokes the mocked useAppStore(), producing a
    // fresh store object — mirroring the real store's no-selector identity
    // churn (e.g. the nav-bar's ten-second poll). Rerendering with a new
    // `items` reference, but the same type/query, forces exactly that churn
    // without touching either effect dependency.
    rerender(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);
    rerender(<AssignmentItemBuilder teamId="t1" items={[]} onChange={() => {}} />);

    expect(mockSearchAssignable).toHaveBeenCalledTimes(1);
  });
});
