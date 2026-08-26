/**
 * Task 11: the manager's section editor for a team's own path.
 *
 * Two diff rules collide in this component and getting them backwards
 * either destroys data or 422s:
 *
 *   - SECTIONS diff by `id`. Every section already saved carries a real
 *     `RoadmapTopic` id, and the backend matches submitted sections against
 *     stored ones by it (see setPathSections in the backend helper: a
 *     matched id is repositioned in place, an unmatched stored row is
 *     unlinked and `UserRoadmap.currentTopicId` cleared). Submit a reorder
 *     without ids and every member's position in the curriculum goes with
 *     it. Test 3 is the load-bearing one and was verified by actually
 *     dropping the id from the payload and watching it fail.
 *   - ITEMS diff by `(type, refId)`. `PathItem.id` from `getTeamPath` is a
 *     derived display key (literally `${type}:${refId}`), NOT a row id, and
 *     ValidateSetSectionItems has no `id` key and no allowUnknown — sending
 *     one 422s with `"items[0].id" is not allowed`. Test 6 pins that the
 *     objects handed to `setSectionItems` carry exactly `type` and `refId`.
 *
 * There is also no `ROADMAP` item type and no `PATH` one: nesting a path
 * inside a path is not supported (ruling R18), so the picker here must not
 * offer it even though the assignment picker it borrows from does.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { PathSectionEditor } from "../path-section-editor";
import type { TeamPath } from "@/lib/data";

const mockGetTeamPath = vi.fn();
const mockSetPathSections = vi.fn();
const mockSetSectionItems = vi.fn();
const mockSearchAssignable = vi.fn();
const mockUpdateTeamPath = vi.fn();
const mockArchiveTeamPath = vi.fn();

// Deliberately a fresh object literal on every call, mirroring the real
// app: `useAppStore()` takes no selector, so it re-subscribes to the whole
// store and hands back a new snapshot whenever ANY slice changes anywhere
// (e.g. the nav bar's ten-second notification poll). Test 10 leans on this.
vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getTeamPath: mockGetTeamPath,
    setPathSections: mockSetPathSections,
    setSectionItems: mockSetSectionItems,
    searchAssignable: mockSearchAssignable,
    updateTeamPath: mockUpdateTeamPath,
    archiveTeamPath: mockArchiveTeamPath,
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

/**
 * Two videos called "Introduction", in different courses — the exact case
 * the breadcrumb exists for (test 7). Item `id`s are the derived
 * `${type}:${refId}` display keys the backend sends; none of them may reach
 * the wire.
 */
const DETAIL = {
  id: "p1",
  title: "Backend Fundamentals",
  summary: "Everything a new backend hire needs in week one.",
  sections: [
    {
      id: "sec-1",
      title: "Week 1 - HTTP",
      order: 0,
      items: [
        {
          id: "VIDEO:v1",
          type: "VIDEO" as const,
          refId: "v1",
          title: "Introduction",
          parentLabel: "Intro to Postgres",
        },
        {
          id: "COURSE:c1",
          type: "COURSE" as const,
          refId: "c1",
          title: "Databases 101",
          parentLabel: "Course",
        },
      ],
    },
    {
      id: "sec-2",
      title: "Week 2 - Databases",
      order: 1,
      items: [
        {
          id: "VIDEO:v2",
          type: "VIDEO" as const,
          refId: "v2",
          title: "Introduction",
          parentLabel: "Intro to Redis",
        },
      ],
    },
  ],
};

function detail() {
  return JSON.parse(JSON.stringify(DETAIL));
}

function renderEditor(props: Partial<React.ComponentProps<typeof PathSectionEditor>> = {}) {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <PathSectionEditor
      teamId="t1"
      path={PATH}
      onSaved={onSaved}
      onClose={onClose}
      {...props}
    />,
  );
  return { ...utils, onSaved, onClose };
}

/** The <section> wrapper for the nth (1-based) section on screen. */
function sectionRegion(n: number) {
  return screen.getByRole("region", { name: `Section ${n}` });
}

/**
 * The nth section's ordered item list, addressed separately from the
 * section as a whole so an assertion about what is IN the section can't be
 * satisfied by a search result sitting in the open picker next to it.
 */
function itemList(n: number) {
  return screen.getByRole("list", { name: `Section ${n} content` });
}

const sectionTitles = () =>
  screen
    .getAllByLabelText(/^Section \d+ title$/)
    .map((el) => (el as HTMLInputElement).value);

/** The (teamId, pathId, sections) triple of the nth setPathSections call. */
const sectionsPayload = (call = 0) => mockSetPathSections.mock.calls[call][2];

async function loaded() {
  await screen.findByDisplayValue("Week 1 - HTTP");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTeamPath.mockResolvedValue(detail());
  mockSetPathSections.mockResolvedValue({ id: "p1", sectionCount: 2 });
  mockSetSectionItems.mockResolvedValue({ id: "sec-1", itemCount: 2 });
  mockSearchAssignable.mockResolvedValue([]);
});

describe("PathSectionEditor", () => {
  it("renders the path's sections in order, each with its items", async () => {
    renderEditor();
    await loaded();

    expect(sectionTitles()).toEqual(["Week 1 - HTTP", "Week 2 - Databases"]);

    expect(within(itemList(1)).getByText("Databases 101")).toBeInTheDocument();
    expect(within(itemList(1)).getByText("Introduction")).toBeInTheDocument();
    expect(within(itemList(2)).getByText("Introduction")).toBeInTheDocument();

    // The dialog is titled in the loaded branch as well as the loading one.
    expect(screen.getByRole("heading", { name: /backend fundamentals/i })).toBeInTheDocument();
  });

  it("appends a new section, and saves the existing ones WITH their ids and the new one without", async () => {
    renderEditor();
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    expect(sectionTitles()).toEqual(["Week 1 - HTTP", "Week 2 - Databases", ""]);

    fireEvent.change(screen.getByLabelText("Section 3 title"), {
      target: { value: "Week 3 - Queues" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockSetPathSections).toHaveBeenCalledTimes(1));
    const [teamId, pathId] = mockSetPathSections.mock.calls[0];
    expect(teamId).toBe("t1");
    expect(pathId).toBe("p1");
    expect(sectionsPayload()).toEqual([
      { id: "sec-1", title: "Week 1 - HTTP" },
      { id: "sec-2", title: "Week 2 - Databases" },
      { title: "Week 3 - Queues" },
    ]);
    // The new one must carry no id key at all — not `id: undefined`, and
    // certainly not a borrowed one.
    expect(Object.keys(sectionsPayload()[2])).toEqual(["title"]);
  });

  it("submits every surviving id after a reorder — the payload that decides whether members keep their progress", async () => {
    renderEditor();
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: /move section 2 up/i }));
    expect(sectionTitles()).toEqual(["Week 2 - Databases", "Week 1 - HTTP"]);

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockSetPathSections).toHaveBeenCalledTimes(1));

    // Both halves matter: the ORDER changed and the IDS survived. A payload
    // built without ids reads as "delete both stored sections, create two
    // new ones" to the backend, taking UserRoadmap.currentTopicId with it.
    expect(sectionsPayload().map((s: any) => s.id)).toEqual(["sec-2", "sec-1"]);
    expect(sectionsPayload()).toEqual([
      { id: "sec-2", title: "Week 2 - Databases" },
      { id: "sec-1", title: "Week 1 - HTTP" },
    ]);
  });

  it("keeps a renamed section's id", async () => {
    renderEditor();
    await loaded();

    fireEvent.change(screen.getByLabelText("Section 1 title"), {
      target: { value: "Week 1 - HTTP and the web" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(mockSetPathSections).toHaveBeenCalledTimes(1));
    expect(sectionsPayload()[0]).toEqual({
      id: "sec-1",
      title: "Week 1 - HTTP and the web",
    });
  });

  it("omits a removed section from the payload, leaving the survivor's id intact", async () => {
    renderEditor();
    await loaded();

    // Removing a STORED section unlinks its RoadmapTopic on save and clears
    // the "you are here" marker of everyone sitting in it, so one click
    // arms it and does not remove it.
    fireEvent.click(screen.getByRole("button", { name: /^Remove section 1$/ }));
    expect(sectionTitles()).toEqual(["Week 1 - HTTP", "Week 2 - Databases"]);
    expect(screen.getByText(/loses their place/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Confirm removing section 1$/ }));
    expect(sectionTitles()).toEqual(["Week 2 - Databases"]);

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockSetPathSections).toHaveBeenCalledTimes(1));

    expect(sectionsPayload()).toEqual([{ id: "sec-2", title: "Week 2 - Databases" }]);
    expect(JSON.stringify(sectionsPayload())).not.toContain("sec-1");
  });

  it("appends {type, refId} — and nothing else — when an item is picked, for that section only", async () => {
    mockSearchAssignable.mockResolvedValue([
      { id: "v9", title: "Indexes", parentLabel: "Postgres Deep Dive" },
    ]);
    renderEditor();
    await loaded();

    fireEvent.click(within(sectionRegion(1)).getByRole("button", { name: /add content/i }));
    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "VIDEO" } });
    await waitFor(() =>
      expect(mockSearchAssignable).toHaveBeenLastCalledWith("t1", "VIDEO", ""),
    );

    fireEvent.click(await screen.findByRole("button", { name: /^add Indexes$/i }));
    expect(within(itemList(1)).getByText("Indexes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockSetSectionItems).toHaveBeenCalledTimes(1));

    expect(mockSetSectionItems).toHaveBeenCalledWith("t1", "p1", "sec-1", [
      { type: "VIDEO", refId: "v1" },
      { type: "COURSE", refId: "c1" },
      { type: "VIDEO", refId: "v9" },
    ]);
    // `id` is the derived `${type}:${refId}` display key — it 422s on the wire.
    for (const item of mockSetSectionItems.mock.calls[0][3]) {
      expect(item).not.toHaveProperty("id");
    }
    // Section 2 was untouched, so it is not re-sent.
    expect(mockSetSectionItems.mock.calls.map((c) => c[2])).toEqual(["sec-1"]);
    // The section id has to exist before items can be attached to it.
    expect(mockSetPathSections.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetSectionItems.mock.invocationCallOrder[0],
    );
  });

  it("never offers PATH as an item type — a path cannot hold a path", async () => {
    renderEditor();
    await loaded();

    fireEvent.click(within(sectionRegion(1)).getByRole("button", { name: /add content/i }));
    const select = screen.getByLabelText("Item type") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);

    expect(values).not.toContain("PATH");
    expect(values).not.toContain("ROADMAP");
    expect(values).not.toContain("CUSTOM");
    expect(values).toContain("COURSE");
    expect(values).toContain("LESSON");
    expect(values).toContain("COHORT");
  });

  it("shows each item's breadcrumb, so two videos called Introduction are distinguishable", async () => {
    renderEditor();
    await loaded();

    expect(screen.getAllByText("Introduction")).toHaveLength(2);
    expect(within(itemList(1)).getByText("Intro to Postgres")).toBeInTheDocument();
    expect(within(itemList(2)).getByText("Intro to Redis")).toBeInTheDocument();
  });

  it("disables Save while any section title is blank", async () => {
    renderEditor();
    await loaded();

    const save = screen.getByRole("button", { name: /^save$/i });
    expect(save).toBeEnabled();

    // A brand-new section starts blank — the backend 422s the whole
    // replace on it ("Give every section a title."), taking the rest of
    // the edit with it.
    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Section 3 title"), {
      target: { value: "Week 3" },
    });
    expect(save).toBeEnabled();

    // Blanking an existing one is the same problem.
    fireEvent.change(screen.getByLabelText("Section 1 title"), { target: { value: "   " } });
    expect(save).toBeDisabled();
    expect(mockSetPathSections).not.toHaveBeenCalled();
  });

  it("keeps the editor open with its edits when the save fails, and says so", async () => {
    mockSetPathSections.mockRejectedValueOnce({
      response: { data: { message: "A path can hold at most 50 sections." } },
    });
    const { onSaved, onClose } = renderEditor();
    await loaded();

    fireEvent.change(screen.getByLabelText("Section 1 title"), {
      target: { value: "Week 1 - HTTP, revised" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("A path can hold at most 50 sections.")).toBeInTheDocument();
    // The manager's afternoon is still on screen.
    expect(screen.getByDisplayValue("Week 1 - HTTP, revised")).toBeInTheDocument();
    expect(sectionTitles()).toEqual(["Week 1 - HTTP, revised", "Week 2 - Databases"]);
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    // And it is retryable, not wedged in a saving state.
    expect(screen.getByRole("button", { name: /^save$/i })).toBeEnabled();
  });

  it("backs out of an armed removal, and drops an unsaved section without asking", async () => {
    renderEditor();
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: /^Remove section 1$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Keep section 1$/ }));
    expect(sectionTitles()).toEqual(["Week 1 - HTTP", "Week 2 - Databases"]);

    // A section added in this dialog has nothing behind it on the server —
    // there is no member's place to lose, so it just goes.
    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Remove section 3$/ }));
    expect(sectionTitles()).toEqual(["Week 1 - HTTP", "Week 2 - Databases"]);
  });

  it("treats a path whose sections could not be read as a failure, never as an empty path", async () => {
    // `getTeamPath` returns `data?.data` unchecked, so a 200 whose body
    // isn't the expected envelope resolves undefined. Rendered as an empty
    // editor, the very next Save would send `sections: []` — the backend
    // unlinks every stored section and clears currentTopicId for every
    // enrolment on the path.
    mockGetTeamPath.mockResolvedValueOnce(undefined);
    renderEditor();

    expect(await screen.findByText(/couldn't load this path/i)).toBeInTheDocument();
    expect(screen.queryByText(/no sections yet/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    // The dialog is titled in the failed branch too.
    expect(screen.getByRole("heading", { name: /backend fundamentals/i })).toBeInTheDocument();
    expect(mockSetPathSections).not.toHaveBeenCalled();
  });

  it("sends a new section's items to the id read back for it, not to a guessed one", async () => {
    mockSearchAssignable.mockResolvedValue([
      { id: "v9", title: "Indexes", parentLabel: "Postgres Deep Dive" },
    ]);
    // The re-read after the section save is the ONLY way the client learns
    // the id of a section the server just created — setPathSections returns
    // a count.
    mockGetTeamPath.mockResolvedValueOnce(detail()).mockResolvedValueOnce({
      ...detail(),
      sections: [
        ...detail().sections,
        { id: "sec-3", title: "Week 3 - Queues", order: 2, items: [] },
      ],
    });
    renderEditor();
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    fireEvent.change(screen.getByLabelText("Section 3 title"), {
      target: { value: "Week 3 - Queues" },
    });
    fireEvent.click(within(sectionRegion(3)).getByRole("button", { name: /add content/i }));
    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "VIDEO" } });
    fireEvent.click(await screen.findByRole("button", { name: /^add Indexes$/i }));

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockSetSectionItems).toHaveBeenCalledTimes(1));

    expect(mockSetSectionItems).toHaveBeenCalledWith("t1", "p1", "sec-3", [
      { type: "VIDEO", refId: "v9" },
    ]);
  });

  it("refuses to adopt an id whose section does not corroborate its position", async () => {
    mockSearchAssignable.mockResolvedValue([
      { id: "v9", title: "Indexes", parentLabel: "Postgres Deep Dive" },
    ]);
    // Another manager inserted a section at the top between the two calls,
    // so position 2 in the re-read is sec-2 — an existing section that has
    // nothing to do with "Week 3". Adopting by bare position would hand
    // sec-2's id to setSectionItems, and the backend would replace sec-2's
    // ENTIRE item list with this one video: every join row deleted, taking
    // assignedAt and the per-link flags with it, while Week 3 stays empty.
    mockGetTeamPath.mockResolvedValueOnce(detail()).mockResolvedValueOnce({
      ...detail(),
      sections: [
        { id: "sec-0", title: "Onboarding", order: 0, items: [] },
        ...detail().sections,
      ],
    });
    const { onSaved, onClose } = renderEditor();
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    fireEvent.change(screen.getByLabelText("Section 3 title"), {
      target: { value: "Week 3 - Queues" },
    });
    fireEvent.click(within(sectionRegion(3)).getByRole("button", { name: /add content/i }));
    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "VIDEO" } });
    fireEvent.click(await screen.findByRole("button", { name: /^add Indexes$/i }));

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText(/couldn't confirm which section/i)).toBeInTheDocument();
    // The whole point: nobody else's section was written to.
    expect(mockSetSectionItems).not.toHaveBeenCalled();
    // The sections themselves DID commit, so the list behind the dialog is
    // refreshed and the manager is told so rather than told nothing saved.
    expect(screen.getByText(/your sections were saved/i)).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the adopted ids when the item save fails, so a retry updates rather than re-creates", async () => {
    mockSearchAssignable.mockResolvedValue([
      { id: "v9", title: "Indexes", parentLabel: "Postgres Deep Dive" },
    ]);
    mockGetTeamPath.mockResolvedValueOnce(detail()).mockResolvedValueOnce({
      ...detail(),
      sections: [
        ...detail().sections,
        { id: "sec-3", title: "Week 3 - Queues", order: 2, items: [] },
      ],
    });
    mockSetSectionItems.mockRejectedValueOnce({
      response: { data: { message: "That item is on the path twice." } },
    });
    const { onSaved, onClose } = renderEditor();
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    fireEvent.change(screen.getByLabelText("Section 3 title"), {
      target: { value: "Week 3 - Queues" },
    });
    fireEvent.click(within(sectionRegion(3)).getByRole("button", { name: /add content/i }));
    fireEvent.change(screen.getByLabelText("Item type"), { target: { value: "VIDEO" } });
    fireEvent.click(await screen.findByRole("button", { name: /^add Indexes$/i }));

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText(/your sections were saved, but that item is on the path twice\./i),
    ).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // The manager's work is all still here.
    expect(sectionTitles()).toEqual([
      "Week 1 - HTTP",
      "Week 2 - Databases",
      "Week 3 - Queues",
    ]);
    expect(within(itemList(3)).getByText("Indexes")).toBeInTheDocument();

    // The retry: sec-3 exists now, and the second payload must say so.
    // Without adoption it would go back as a new section, and the backend's
    // set-replace would unlink the row it just made and create another.
    mockSetSectionItems.mockResolvedValue({ id: "sec-3", itemCount: 1 });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockSetPathSections).toHaveBeenCalledTimes(2));
    expect(sectionsPayload(1)).toEqual([
      { id: "sec-1", title: "Week 1 - HTTP" },
      { id: "sec-2", title: "Week 2 - Databases" },
      { id: "sec-3", title: "Week 3 - Queues" },
    ]);
    // And no second re-read was needed, because nothing lacks an id now.
    expect(mockGetTeamPath).toHaveBeenCalledTimes(2);
  });

  it("says the sections were saved when only the re-read fails, and refreshes the list behind it", async () => {
    mockGetTeamPath
      .mockResolvedValueOnce(detail())
      .mockRejectedValueOnce(new Error("network error"));
    const { onSaved, onClose } = renderEditor();
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    fireEvent.change(screen.getByLabelText("Section 3 title"), {
      target: { value: "Week 3 - Queues" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    // setPathSections committed; saying "couldn't save" here is a lie the
    // manager would act on by doing it all again.
    expect(await screen.findByText(/your sections were saved/i)).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("marks an item the catalogue no longer has, instead of showing a bare id", async () => {
    const withDangling = detail();
    withDangling.sections[0].items.push({
      id: "COURSE:cmg0deleted",
      type: "COURSE",
      refId: "cmg0deleted",
      title: null,
      parentLabel: undefined,
    });
    mockGetTeamPath.mockResolvedValueOnce(withDangling);
    renderEditor();
    await loaded();

    expect(within(itemList(1)).getByText(/no longer available/i)).toBeInTheDocument();

    // It is still preserved on save — flagging it must not silently drop it.
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockSetPathSections).toHaveBeenCalledTimes(1));
    expect(mockSetSectionItems).not.toHaveBeenCalled();
  });

  it("does not list `store` in the picker's search effect deps — unrelated store churn must not refetch", async () => {
    const { rerender, onSaved, onClose } = renderEditor();
    await loaded();

    fireEvent.click(within(sectionRegion(1)).getByRole("button", { name: /add content/i }));
    await waitFor(() => expect(mockSearchAssignable).toHaveBeenCalledTimes(1));

    // Every render re-invokes the mocked useAppStore(), handing back a
    // fresh object — exactly what a set() anywhere else in the app does.
    // An effect that depended on it would refetch here, and each refetch
    // re-renders, which is the unbounded loop this pins against.
    rerender(
      <PathSectionEditor teamId="t1" path={PATH} onSaved={onSaved} onClose={onClose} />,
    );
    rerender(
      <PathSectionEditor teamId="t1" path={PATH} onSaved={onSaved} onClose={onClose} />,
    );

    // Waited out deliberately, and for longer than the 250ms debounce: an
    // effect that re-ran on the rerenders would only have re-armed its
    // timer, so asserting immediately would pass against the very bug this
    // test exists for (verified — with `store` in the deps, the synchronous
    // assertion still saw exactly one call).
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockSearchAssignable).toHaveBeenCalledTimes(1);
    // The section load is on the same rule.
    expect(mockGetTeamPath).toHaveBeenCalledTimes(1);
  });
});
