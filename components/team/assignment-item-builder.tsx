"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import type { AssignmentItemInput, AssignmentItemType } from "@/lib/data";

const ITEM_TYPES: Array<{ value: AssignmentItemType; label: string }> = [
  { value: "TASK", label: "Task" },
  { value: "PATH", label: "Path" },
  { value: "COURSE", label: "Course" },
  { value: "PROJECT", label: "Project" },
  { value: "MOCK_INTERVIEW", label: "Mock interview" },
];

const TYPE_LABELS: Record<AssignmentItemType, string> = {
  PATH: "Path",
  COURSE: "Course",
  PROJECT: "Project",
  MOCK_INTERVIEW: "Mock interview",
  TASK: "Task",
};

const MAX_ITEMS = 25;

type SearchResult = { id: string; label: string };

/**
 * Reuses the catalogue fetchers the app already has for its own listing
 * pages, rather than standing up a parallel set of "picker" endpoints. Each
 * one has a different argument shape and a different return shape (some
 * bare arrays, some `{ courses: [...] }`/`{ projects: [...] }`/`{
 * interviews: [...] }` envelopes) — normalised here so the rest of the
 * component only ever sees `{ id, label }`.
 */
async function searchCatalogue(
  // Typed loosely on purpose: these fetchers return a mix of bare arrays
  // and different envelope shapes (see the comment above), which is exactly
  // why every result is normalised to SearchResult before leaving here.
  store: any,
  type: AssignmentItemType,
  query: string,
): Promise<SearchResult[]> {
  const term = query.trim();
  switch (type) {
    case "PATH": {
      const res = await store.getRoadmaps({ skip: 0, size: 50 });
      const roadmaps: any[] = (res as any)?.roadmaps ?? (Array.isArray(res) ? res : []);
      return roadmaps
        .filter((r) => !term || r.title?.toLowerCase().includes(term.toLowerCase()))
        .map((r) => ({ id: r.id, label: r.title }));
    }
    case "COURSE": {
      const res = await store.getCourses(term ? { filters: { terms: term } } : {});
      const courses: any[] = (res as any)?.courses ?? (Array.isArray(res) ? res : []);
      return courses.map((c) => ({ id: c.id, label: c.title }));
    }
    case "PROJECT": {
      const res = await store.getProjects({
        page: MAX_ITEMS,
        size: 0,
        filters: term ? { terms: term } : {},
      });
      const projects: any[] = (res as any)?.projects ?? (Array.isArray(res) ? res : []);
      return projects.map((p) => ({ id: p.id, label: p.title }));
    }
    case "MOCK_INTERVIEW": {
      const res = await store.getMockInterviewTemplates({
        size: MAX_ITEMS,
        skip: 0,
        filters: term ? { search: term } : {},
      });
      const templates: any[] = (res as any)?.interviews ?? (Array.isArray(res) ? res : []);
      return templates.map((t) => ({
        id: t.id,
        label: t.name ?? `${t.position ?? "Interview"}${t.company ? ` @ ${t.company}` : ""}`,
      }));
    }
    default:
      return [];
  }
}

/**
 * Type + search picker for content, free text for tasks, and the ordered
 * list of what's been chosen so far.
 *
 * The one rule that matters more than anything else in this file: an item
 * that arrived from the server already carries an `id`, and every mutation
 * here (reorder, remove) must keep that `id` attached to the surviving
 * items rather than rebuilding them from scratch. The backend's set-replace
 * matches TASK items by that id to preserve which learners have ticked them
 * off; content items match by (type, refId) instead, which is why only
 * TASKs are load-bearing here. Drop the id on a reorder and a client that
 * looks identical to the user turns into delete-and-recreate on save,
 * cascading away every learner's completion for this assignment. See
 * assignment-form-dialog.tsx for where these items are first loaded with
 * their ids and where they're sent back.
 */
export function AssignmentItemBuilder({
  items,
  onChange,
}: {
  items: AssignmentItemInput[];
  onChange: (items: AssignmentItemInput[]) => void;
}) {
  const store = useAppStore();
  const [type, setType] = useState<AssignmentItemType>("TASK");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const atCap = items.length >= MAX_ITEMS;

  // `store` is deliberately excluded — see assignment-form-dialog.tsx for
  // why useAppStore()'s identity is unsafe to depend on (it changes on any
  // set() anywhere in the app, including background polling).
  useEffect(() => {
    if (type === "TASK") {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(() => {
      searchCatalogue(store, type, query)
        .then((r) => {
          if (!cancelled) setResults(r);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
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
  }, [type, query]);

  function addContent(id: string, label: string) {
    if (atCap) return;
    const duplicate = items.some((i) => i.type === type && i.refId === id);
    if (duplicate) {
      setMessage(`"${label}" is already on this list.`);
      return;
    }
    setMessage(null);
    // A freshly added content item has no `id` yet — the server matches
    // content by (type, refId), so it doesn't need one, unlike TASK below.
    // `title` rides along purely so this list can render `label` instead of
    // falling back to "{Type} · {refId}" — it's stripped before the save
    // call (see assignment-form-dialog.tsx), never sent to the server.
    onChange([...items, { type, refId: id, title: label }]);
  }

  function addTask() {
    if (atCap) return;
    const text = query.trim();
    if (!text) return;
    setMessage(null);
    onChange([...items, { type: "TASK", text }]);
    setQuery("");
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    // Swapping array slots keeps the same item objects (and therefore their
    // `id`, when they have one) — never rebuild the objects here.
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <Label>Content</Label>

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Item type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as AssignmentItemType);
            setQuery("");
            setMessage(null);
          }}
          className="h-10 rounded-md border border-input bg-background px-2 text-sm"
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {type === "TASK" ? (
          <>
            <Input
              placeholder="Describe the task"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="button" onClick={addTask} disabled={!query.trim() || atCap}>
              Add
            </Button>
          </>
        ) : (
          <Input
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1"
          />
        )}
      </div>

      {type !== "TASK" && (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
          {searching ? (
            <p className="text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No results.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => addContent(r.id, r.label)}
                disabled={atCap}
                className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">Add</span>
              </button>
            ))
          )}
        </div>
      )}

      {message && <p className="text-sm text-destructive">{message}</p>}
      {atCap && (
        <p className="text-sm text-muted-foreground">
          25 items is the limit for one assignment.
        </p>
      )}

      {items.length > 0 && (
        <ol className="space-y-1">
          {items.map((item, index) => (
            <li
              key={item.id ?? `new-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                {item.type === "TASK"
                  ? item.text
                  : (item.title ?? `${TYPE_LABELS[item.type]} · ${item.refId}`)}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${item.type === "TASK" ? item.text : (item.title ?? TYPE_LABELS[item.type])}`}
                  onClick={() => removeAt(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
