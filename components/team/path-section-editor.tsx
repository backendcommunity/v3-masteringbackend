"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import type {
  AssignableResult,
  AssignableSearchType,
  PathItemType,
  TeamPath,
  TeamPathItemInput,
  TeamPathSectionInput,
} from "@/lib/data";

const TYPE_LABELS: Record<PathItemType, string> = {
  COURSE: "Course",
  CHAPTER: "Chapter",
  ARTICLE: "Article",
  VIDEO: "Video",
  LESSON: "Lesson",
  PROJECT: "Project",
  EXERCISE: "Exercise",
  QUIZ: "Quiz",
  BOOTCAMP: "Bootcamp",
  MOCK_INTERVIEW: "Mock interview",
  COHORT: "Cohort",
  RESOURCE: "Resource",
};

/**
 * The item kinds a section can be built from HERE, computed rather than
 * hand-listed so it can't drift from either union:
 *
 *  - `PathItemType` has no `PATH` and no `ROADMAP`, because a path cannot
 *    hold a path (ruling R18) — so neither can appear in this list, even
 *    though the assignment picker this borrows from offers `PATH`. Nor
 *    `CUSTOM`/`TASK`: a path section holds catalogue content, not free text.
 *  - `AssignableSearchType` is what `GET /teams/:id/assignable` will search.
 *    It has no `BOOTCAMP` and no `RESOURCE` (see ValidateAssignableSearch),
 *    so those two drop out of the intersection: they are legal in a saved
 *    section but there is no search behind them, and offering them would
 *    only produce a 422 dressed up as "Search failed."
 */
type PickableItemType = Extract<PathItemType, AssignableSearchType>;

const PICKABLE_TYPES: PickableItemType[] = [
  "COURSE",
  "CHAPTER",
  "ARTICLE",
  "VIDEO",
  "LESSON",
  "PROJECT",
  "EXERCISE",
  "QUIZ",
  "MOCK_INTERVIEW",
  "COHORT",
];

// Mirrors the backend's own caps (team-path-sections.ts) so a manager is
// told before the round trip rather than by a 422 that loses the edit.
const MAX_SECTIONS = 50;
const MAX_ITEMS = 100;
const MAX_TITLE_LENGTH = 100;

/**
 * One section as the editor holds it.
 *
 * `id` is the load-bearing field of this whole file: it is the stored
 * `RoadmapTopic` row id, present on every section that came back from
 * `getTeamPath` and absent on every section the manager has just added.
 * The backend's set-replace matches submitted sections against stored ones
 * BY THAT ID — a matched id is repositioned in place, an unmatched stored
 * row is unlinked and every enrolment's `currentTopicId` pointing at it is
 * cleared. Send a reorder without ids and the request still succeeds while
 * silently reading as "delete both sections, create two new ones".
 *
 * `key` is a separate, purely-client value: React needs a key that survives
 * a reorder and exists before the server has assigned an id, and `id` can't
 * be it for a brand-new section. It also keys the item baseline below, so
 * that keeps working across a rename, a move, and the id adoption after a
 * successful section save.
 *
 * `items` deliberately holds no item id. Items diff by `(type, refId)`, and
 * `PathItem.id` from the API is a derived display key (`${type}:${refId}`)
 * that the item validator rejects outright — see TeamPathItemInput.
 */
interface EditorSection {
  key: string;
  id?: string;
  title: string;
  items: TeamPathItemInput[];
}

/** Identity of an item list, for "did this section's content change?". */
const itemsKey = (items: TeamPathItemInput[]) =>
  items.map((i) => `${i.type}:${i.refId}`).join("|");

const itemLabel = (item: TeamPathItemInput) =>
  item.title ?? `${TYPE_LABELS[item.type]} · ${item.refId}`;

/**
 * Edit one team path's sections: name them, reorder them, and choose what
 * goes inside each one.
 *
 * Mounted only while open (the parent renders it when a manager picks a
 * path), so it takes `onClose` instead of an `open`/`onOpenChange` pair.
 *
 * Save order is a real requirement, not tidiness: `setPathSections` runs
 * first because a brand-new section has no id to attach items to until the
 * server has created it. Since that endpoint returns only a count, the ids
 * are then read back with `getTeamPath` and ADOPTED INTO STATE before any
 * item call — without that, a retry after a failed item save would resubmit
 * the new sections as new all over again and duplicate them.
 */
export function PathSectionEditor({
  teamId,
  path,
  onSaved,
  onClose,
}: {
  teamId: string;
  path: TeamPath;
  onSaved: () => void;
  onClose: () => void;
}) {
  const store = useAppStore();

  const [sections, setSections] = useState<EditorSection[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // What each section's items looked like when loaded (or last saved),
  // keyed by the client-side `key`. Only sections whose content actually
  // changed get an item call, so an ordinary rename doesn't rewrite twelve
  // item lists.
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const newSectionCount = useRef(0);

  // `store` is deliberately excluded from the deps — useAppStore() takes no
  // selector, so its identity changes on any set() anywhere in the app
  // (including the nav bar's ten-second poll). Depending on it would re-run
  // this fetch on unrelated churn and stomp whatever the manager has typed
  // so far. Same pattern as components/pages/team.tsx:121 and
  // components/pages/team-paths.tsx.
  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);
    store
      .getTeamPath(teamId, path.id)
      .then((detail) => {
        if (cancelled) return;
        const loaded: EditorSection[] = (detail?.sections ?? []).map((s) => ({
          // The stored row id, kept on both `key` and `id`: `key` is what
          // React and the baseline use, `id` is what goes back on the wire.
          key: s.id,
          id: s.id,
          title: s.title,
          items: (s.items ?? []).map((i) => ({
            // `i.id` is NOT copied — see EditorSection above.
            type: i.type,
            refId: i.refId,
            title: i.title,
            parentLabel: i.parentLabel ?? null,
          })),
        }));
        setSections(loaded);
        setBaseline(
          Object.fromEntries(loaded.map((s) => [s.key, itemsKey(s.items)])),
        );
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, path.id]);

  function update(next: EditorSection[]) {
    setSections(next);
    setError(null);
  }

  function addSection() {
    if (!sections || sections.length >= MAX_SECTIONS) return;
    newSectionCount.current += 1;
    update([
      ...sections,
      { key: `new-${newSectionCount.current}`, title: "", items: [] },
    ]);
  }

  function renameSection(index: number, title: string) {
    if (!sections) return;
    // Rebuilt with a spread, so `id` (and `key`) ride along untouched — a
    // rename is a rename, never a replace.
    update(sections.map((s, i) => (i === index ? { ...s, title } : s)));
  }

  function removeSection(index: number) {
    if (!sections) return;
    const removed = sections[index];
    if (activeKey === removed.key) setActiveKey(null);
    update(sections.filter((_, i) => i !== index));
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (!sections) return;
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    // Swapping slots keeps the SAME section objects, and with them their
    // ids. Never rebuild them here: an object literal that forgets `id`
    // turns this reorder into delete-and-recreate on save.
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  function addItem(index: number, item: TeamPathItemInput) {
    if (!sections) return;
    update(
      sections.map((s, i) =>
        i === index ? { ...s, items: [...s.items, item] } : s,
      ),
    );
  }

  function removeItem(index: number, itemIndex: number) {
    if (!sections) return;
    update(
      sections.map((s, i) =>
        i === index ? { ...s, items: s.items.filter((_, j) => j !== itemIndex) } : s,
      ),
    );
  }

  function moveItem(index: number, itemIndex: number, direction: -1 | 1) {
    if (!sections) return;
    const target = itemIndex + direction;
    const section = sections[index];
    if (target < 0 || target >= section.items.length) return;
    const items = [...section.items];
    [items[itemIndex], items[target]] = [items[target], items[itemIndex]];
    update(sections.map((s, i) => (i === index ? { ...s, items } : s)));
  }

  const canSave =
    !!sections && !saving && sections.every((s) => s.title.trim().length > 0);

  async function handleSave() {
    if (!sections || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      // An existing section goes back WITH its id; a new one carries no
      // `id` key at all. Both halves are load-bearing: the id is what keeps
      // a reorder a reorder, and inventing one for a new section is a 404.
      const payload: TeamPathSectionInput[] = sections.map((s) =>
        s.id ? { id: s.id, title: s.title.trim() } : { title: s.title.trim() },
      );
      await store.setPathSections(teamId, path.id, payload);

      // setPathSections returns only { id, sectionCount }, so the ids of
      // sections it just created have to be read back before anything can
      // be attached to them. The backend writes `order` as the submitted
      // index and getTeamPath sorts by it, so position i here is position i
      // there.
      let working = sections;
      if (sections.some((s) => !s.id)) {
        const detail = await store.getTeamPath(teamId, path.id);
        const fresh = detail?.sections ?? [];
        working = sections.map((s, i) => (s.id ? s : { ...s, id: fresh[i]?.id }));
        // Adopted into state BEFORE the item calls below — those are the
        // ones that can still fail, and a retry that had forgotten these
        // ids would create the same sections a second time.
        setSections(working);
      }

      for (const section of working) {
        const key = itemsKey(section.items);
        if (key === (baseline[section.key] ?? "")) continue;
        if (!section.id)
          throw new Error(
            `Saved the sections, but couldn't work out where "${section.title.trim()}" lives yet. Open it again and add its content.`,
          );
        // Rebuilt as exactly { type, refId }: `title`/`parentLabel` are
        // client-only display fields and the item validator rejects unknown
        // keys. (The store fetcher strips them a second time — neither
        // layer is allowed to be the only one doing it.)
        await store.setSectionItems(
          teamId,
          path.id,
          section.id,
          section.items.map(({ type, refId }) => ({ type, refId })),
        );
      }

      setBaseline(
        Object.fromEntries(working.map((s) => [s.key, itemsKey(s.items)])),
      );
      toast.success("Path updated.");
      onSaved();
      onClose();
    } catch (e: any) {
      // Surfaced inline as well as in a toast, and the dialog stays open
      // with every edit still in state: a silent failure here costs a
      // manager the whole afternoon's work.
      const message =
        e?.response?.data?.message ?? e?.message ?? "Couldn't save these sections.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !saving && onClose()}>
      {/* DialogTitle lives OUTSIDE the branches below, so the loading and
          failed states are titled too — a DialogContent without one is an
          accessibility violation no test in this file would catch. */}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sections &mdash; {path.title}</DialogTitle>
          <DialogDescription>
            Name each section, put it in the order people should work
            through, and choose what goes inside.
          </DialogDescription>
        </DialogHeader>

        {loadFailed ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load this path&apos;s sections.
            </p>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : !sections ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                This path has no sections yet.
              </p>
            )}

            {sections.map((section, index) => (
              <section
                key={section.key}
                aria-label={`Section ${index + 1}`}
                className="space-y-3 rounded-lg border p-3"
              >
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor={`section-title-${section.key}`}>
                      Section {index + 1}
                    </Label>
                    <Input
                      id={`section-title-${section.key}`}
                      aria-label={`Section ${index + 1} title`}
                      value={section.title}
                      maxLength={MAX_TITLE_LENGTH}
                      placeholder="e.g. Week 1 — HTTP"
                      disabled={saving}
                      onChange={(e) => renameSection(index, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Move section ${index + 1} up`}
                    disabled={index === 0 || saving}
                    onClick={() => moveSection(index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Move section ${index + 1} down`}
                    disabled={index === sections.length - 1 || saving}
                    onClick={() => moveSection(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove section ${index + 1}`}
                    disabled={saving}
                    onClick={() => removeSection(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ol
                  aria-label={`Section ${index + 1} content`}
                  className="space-y-1"
                >
                  {section.items.length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      Nothing in this section yet.
                    </li>
                  )}
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={`${item.type}:${item.refId}`}
                      className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        <span className="block truncate">{itemLabel(item)}</span>
                        {item.parentLabel && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.parentLabel}
                          </span>
                        )}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Move ${itemLabel(item)} up`}
                          disabled={itemIndex === 0 || saving}
                          onClick={() => moveItem(index, itemIndex, -1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Move ${itemLabel(item)} down`}
                          disabled={itemIndex === section.items.length - 1 || saving}
                          onClick={() => moveItem(index, itemIndex, 1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${itemLabel(item)}`}
                          disabled={saving}
                          onClick={() => removeItem(index, itemIndex)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>

                {activeKey === section.key ? (
                  <PathItemPicker
                    teamId={teamId}
                    taken={new Set(section.items.map((i) => `${i.type}:${i.refId}`))}
                    atCap={section.items.length >= MAX_ITEMS}
                    onAdd={(item) => addItem(index, item)}
                    onClose={() => setActiveKey(null)}
                  />
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving || section.items.length >= MAX_ITEMS}
                    onClick={() => setActiveKey(section.key)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add content
                  </Button>
                )}
              </section>
            ))}

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving || sections.length >= MAX_SECTIONS}
              onClick={addSection}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add section
            </Button>

            {sections.length >= MAX_SECTIONS && (
              <p className="text-sm text-muted-foreground">
                {MAX_SECTIONS} sections is the limit for one path.
              </p>
            )}

            {!canSave && !saving && (
              <p className="text-sm text-muted-foreground">
                Give every section a title before saving.
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave || loadFailed}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Type + search picker for one section's content.
 *
 * Same endpoint, same normalised `AssignableResult` shape and the same
 * debounce/cancel/retry effect as `AssignmentItemBuilder` — it could not be
 * mounted directly because its item model is `AssignmentItemInput` (with
 * `id`, `text` and CUSTOM) over `AssignmentItemType` (which offers PATH and
 * lacks LESSON/COHORT), and a path section holds `TeamPathItemInput` over
 * `PathItemType`. Both of those differences are exactly the ones that must
 * NOT be blurred, so the picker is separate and the shared thing is the
 * endpoint.
 */
export function PathItemPicker({
  teamId,
  taken,
  atCap,
  onAdd,
  onClose,
}: {
  teamId: string;
  taken: Set<string>;
  atCap: boolean;
  onAdd: (item: TeamPathItemInput) => void;
  onClose: () => void;
}) {
  const store = useAppStore();
  const [type, setType] = useState<PickableItemType>("COURSE");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssignableResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // `store` is deliberately excluded — useAppStore() has no selector, so
  // its identity changes on any set() anywhere in the app. Listing it here
  // is not a stale-data nuisance but an unbounded fetch loop: each fetch
  // sets state, each set re-renders, each re-render hands back a new store
  // object, which re-runs the effect. `retryTick` is a local counter that
  // only moves when the manager clicks "Try again", so it is safe.
  useEffect(() => {
    const term = query.trim();
    let cancelled = false;
    setSearching(true);
    setSearchFailed(false);
    // A blank query browses the first page of the chosen type, so picking a
    // type shows something immediately instead of demanding a search term.
    const handle = setTimeout(() => {
      store
        .searchAssignable(teamId, type, term)
        .then((r: AssignableResult[]) => {
          if (cancelled) return;
          setResults(r ?? []);
          setSearchFailed(false);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setSearchFailed(true);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, query, teamId, retryTick]);

  function add(result: AssignableResult) {
    if (atCap) return;
    if (taken.has(`${type}:${result.id}`)) {
      setMessage(`"${result.title}" is already in this section.`);
      return;
    }
    setMessage(null);
    // No `id`: items diff by (type, refId), and the item validator rejects
    // an id outright. `title`/`parentLabel` are display-only and stripped
    // before the save call.
    onAdd({
      type,
      refId: result.id,
      title: result.title,
      parentLabel: result.parentLabel,
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed p-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Item type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as PickableItemType);
            setQuery("");
            setMessage(null);
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {PICKABLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 min-w-0 flex-1"
        />
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>

      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
        {searching ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : searchFailed ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-destructive">Search failed.</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRetryTick((n) => n + 1)}
            >
              Try again
            </Button>
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No results.</p>
        ) : (
          results.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-label={`Add ${r.title}`}
              onClick={() => add(r)}
              disabled={atCap}
              className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="min-w-0 flex-1 truncate">
                <span className="block truncate">{r.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.parentLabel}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">Add</span>
            </button>
          ))
        )}
      </div>

      {message && <p className="text-sm text-destructive">{message}</p>}
      {atCap && (
        <p className="text-sm text-muted-foreground">
          {MAX_ITEMS} items is the limit for one section.
        </p>
      )}
    </div>
  );
}
