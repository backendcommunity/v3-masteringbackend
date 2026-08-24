"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import type { AssignableResult, AssignmentItemInput, AssignmentItemType } from "@/lib/data";

const TYPE_LABELS: Record<AssignmentItemType, string> = {
  PATH: "Path",
  COURSE: "Course",
  PROJECT: "Project",
  MOCK_INTERVIEW: "Mock interview",
  CHAPTER: "Chapter",
  ARTICLE: "Article",
  VIDEO: "Video",
  TASK: "Task",
  QUIZ: "Quiz",
  EXERCISE: "Exercise",
  CUSTOM: "Custom",
};

// CUSTOM is the odd one out — free text, no catalogue — so it goes last
// rather than sorting alphabetically with the other ten.
const TYPE_ORDER: AssignmentItemType[] = [
  "PATH",
  "COURSE",
  "PROJECT",
  "MOCK_INTERVIEW",
  "CHAPTER",
  "ARTICLE",
  "VIDEO",
  "TASK",
  "QUIZ",
  "EXERCISE",
  "CUSTOM",
];

const ITEM_TYPES: Array<{ value: AssignmentItemType; label: string }> = TYPE_ORDER.map(
  (value) => ({ value, label: TYPE_LABELS[value] }),
);

const MAX_ITEMS = 25;

/**
 * Type + search picker for content, free text for CUSTOM, and the ordered
 * list of what's been chosen so far.
 *
 * Every content type (all ten non-CUSTOM values, including TASK — the
 * catalogue's `Task` row, not to be confused with the free-text CUSTOM item)
 * is searched through the single `searchAssignable(teamId, type, q)`
 * endpoint. There is no per-type fetcher here to keep in sync with the
 * catalogue's own listing pages — one endpoint, normalised results
 * (`{ id, title, parentLabel }`), done.
 *
 * The one rule that matters more than anything else in this file: an item
 * that arrived from the server already carries an `id`, and every mutation
 * here (reorder, remove) must keep that `id` attached to the surviving
 * items rather than rebuilding them from scratch. The backend's set-replace
 * matches CUSTOM items by that id to preserve which learners have ticked them
 * off; content items match by (type, refId) instead, which is why only
 * CUSTOMs are load-bearing here. Drop the id on a reorder and a client that
 * looks identical to the user turns into delete-and-recreate on save,
 * cascading away every learner's completion for this assignment. See
 * assignment-form-dialog.tsx for where these items are first loaded with
 * their ids and where they're sent back.
 */
export function AssignmentItemBuilder({
  teamId,
  items,
  onChange,
}: {
  teamId: string;
  items: AssignmentItemInput[];
  onChange: (items: AssignmentItemInput[]) => void;
}) {
  const store = useAppStore();
  const [type, setType] = useState<AssignmentItemType>("CUSTOM");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssignableResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const atCap = items.length >= MAX_ITEMS;

  // `store` is deliberately excluded — see assignment-form-dialog.tsx for
  // why useAppStore()'s identity is unsafe to depend on (it changes on any
  // set() anywhere in the app, including background polling). An effect
  // that depended on it would refetch on unrelated churn and could stomp
  // whatever the manager is mid-typing.
  useEffect(() => {
    if (type === "CUSTOM") {
      setResults([]);
      setSearching(false);
      return;
    }
    const term = query.trim();
    if (!term) {
      // The endpoint 422s on a blank `q` — don't even ask.
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(() => {
      store
        .searchAssignable(teamId, type, term)
        .then((r: AssignableResult[]) => {
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
  }, [type, query, teamId]);

  function addContent(result: AssignableResult) {
    if (atCap) return;
    const duplicate = items.some((i) => i.type === type && i.refId === result.id);
    if (duplicate) {
      setMessage(`"${result.title}" is already on this list.`);
      return;
    }
    setMessage(null);
    // A freshly added content item has no `id` yet — the server matches
    // content by (type, refId), so it doesn't need one, unlike CUSTOM below.
    // `title`/`parentLabel` ride along purely so this list can render them
    // instead of falling back to "{Type} · {refId}" — both are stripped
    // before the save call (see assignment-form-dialog.tsx), never sent to
    // the server.
    onChange([
      ...items,
      { type, refId: result.id, title: result.title, parentLabel: result.parentLabel },
    ]);
  }

  function addCustom() {
    if (atCap) return;
    const text = query.trim();
    if (!text) return;
    setMessage(null);
    onChange([...items, { type: "CUSTOM", text }]);
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

        {type === "CUSTOM" ? (
          <>
            <Input
              placeholder="Describe the task"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="button" onClick={addCustom} disabled={!query.trim() || atCap}>
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

      {type !== "CUSTOM" && (
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
                onClick={() => addContent(r)}
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
                {item.type === "CUSTOM" ? (
                  item.text
                ) : (
                  <>
                    <span className="block truncate">
                      {item.title ?? `${TYPE_LABELS[item.type]} · ${item.refId}`}
                    </span>
                    {item.parentLabel && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.parentLabel}
                      </span>
                    )}
                  </>
                )}
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
                  aria-label={`Remove ${item.type === "CUSTOM" ? item.text : (item.title ?? TYPE_LABELS[item.type])}`}
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
