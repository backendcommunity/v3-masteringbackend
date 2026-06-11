"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Code2,
  FileText,
  HelpCircle,
  Plus,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Eye,
  Pencil,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PathArticle, ArticleBlock } from "@/components/pages/path/path-article";
import { PathSessionStep } from "@/lib/path-types";

type Kind = "html" | "playground" | "quiz";

interface Row {
  uid: string;
  kind: Kind;
  // html
  html?: string;
  // playground
  language?: string;
  code?: string;
  title?: string;
  // quiz
  question?: string;
  options?: string[];
  answer?: number;
  explanation?: string;
}

const LANGS = ["Python", "JavaScript", "TypeScript", "Java", "Go", "SQL"];

const PREVIEW_STEP = {
  id: "preview",
  type: "ARTICLE",
  status: "ACTIVE",
} as unknown as PathSessionStep;

function blankRow(kind: Kind, uid: string): Row {
  if (kind === "playground")
    return { uid, kind, language: "Python", title: "main.py", code: "" };
  if (kind === "quiz")
    return {
      uid,
      kind,
      question: "",
      options: ["", ""],
      answer: 0,
      explanation: "",
    };
  return { uid, kind, html: "" };
}

function rowToBlock(r: Row): ArticleBlock {
  if (r.kind === "playground")
    return {
      type: "playground",
      language: r.language,
      code: r.code ?? "",
      title: r.title,
    };
  if (r.kind === "quiz")
    return {
      type: "quiz",
      question: r.question ?? "",
      options: (r.options ?? []).filter((o) => o.trim() !== ""),
      answer: r.answer ?? 0,
      explanation: r.explanation,
    };
  return { type: "html", html: r.html ?? "" };
}

export function ArticleEditor({ articleId }: { articleId?: string }) {
  const store = useAppStore();
  const uidRef = useRef(0);
  const nextUid = () => `b${uidRef.current++}`;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [readingTime, setReadingTime] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!articleId);

  // Load an existing article for editing.
  useEffect(() => {
    if (!articleId) return;
    let active = true;
    (async () => {
      try {
        const a = await store.getArticleById(articleId);
        if (!active || !a) return;
        setTitle(a.title ?? "");
        setSlug(a.slug ?? "");
        setChapterId(a.chapterId ?? "");
        setExcerpt(a.excerpt ?? "");
        setReadingTime(a.readingTime ?? 0);
        setIsPremium(!!a.isPremium);
        const blocks: ArticleBlock[] = Array.isArray(a.blocks) ? a.blocks : [];
        setRows(
          blocks.map((b) => {
            const uid = nextUid();
            if (b.type === "playground")
              return {
                uid,
                kind: "playground",
                language: b.language ?? "Python",
                title: b.title ?? "main.py",
                code: b.code ?? "",
              };
            if (b.type === "quiz")
              return {
                uid,
                kind: "quiz",
                question: b.question,
                options: b.options ?? ["", ""],
                answer: b.answer ?? 0,
                explanation: b.explanation,
              };
            return { uid, kind: "html", html: b.html ?? "" };
          }),
        );
      } catch {
        toast.error("Failed to load article.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  // ── Block ops ──────────────────────────────────────────────────────────
  const addBlock = (kind: Kind, at: number) =>
    setRows((rs) => {
      const copy = [...rs];
      copy.splice(at, 0, blankRow(kind, nextUid()));
      return copy;
    });
  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = i + dir;
      if (j < 0 || j >= rs.length) return rs;
      const copy = [...rs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const remove = (i: number) =>
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  const duplicate = (i: number) =>
    setRows((rs) => {
      const copy = [...rs];
      copy.splice(i + 1, 0, { ...rs[i], uid: nextUid() });
      return copy;
    });

  const blocks = useMemo(() => rows.map(rowToBlock), [rows]);

  const save = async () => {
    if (!title.trim()) return toast.error("Title is required.");
    if (!slug.trim()) return toast.error("Slug is required.");
    if (!chapterId.trim()) return toast.error("Chapter ID is required.");

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      chapterId: chapterId.trim(),
      excerpt: excerpt.trim() || undefined,
      readingTime: Number(readingTime) || 0,
      isPremium,
      // Plain-HTML fallback = concatenation of html blocks.
      content: blocks
        .filter((b): b is Extract<ArticleBlock, { type: "html" }> => b.type === "html")
        .map((b) => b.html)
        .join("\n"),
      blocks,
    };

    setSaving(true);
    try {
      const res = articleId
        ? await store.updateArticle(articleId, payload)
        : await store.createArticle(payload);
      toast.success(
        articleId ? "Article updated." : `Article created (id: ${res?.id}).`,
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Save failed. Check the fields.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[920px] px-4 py-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          {articleId ? "Edit article" : "New article"}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "edit" ? (
                  <Pencil className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {t}
              </button>
            ))}
          </div>
          <Button
            onClick={save}
            disabled={saving}
            className="h-9 gap-1.5 bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] font-bold text-[#06222b] hover:brightness-110"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {tab === "preview" ? (
        <div className="h-[72vh] overflow-hidden rounded-xl border border-border bg-background">
          <PathArticle
            step={PREVIEW_STEP}
            itemData={{ title, description: excerpt, blocks }}
            onComplete={() => toast("Preview: onComplete()")}
          />
        </div>
      ) : (
        <>
          {/* Meta */}
          <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson title"
                className="input"
              />
            </Field>
            <Field label="Slug">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="hello-print-function"
                className="input"
              />
            </Field>
            <Field label="Chapter ID (required FK)">
              <input
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                placeholder="uuid of the owning chapter"
                className="input font-mono text-xs"
              />
            </Field>
            <Field label="Reading time (min)">
              <input
                type="number"
                value={readingTime}
                onChange={(e) => setReadingTime(Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Excerpt / description">
              <input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="One-line summary"
                className="input"
              />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
              />
              Premium
            </label>
          </div>

          {/* Blocks */}
          <Inserter onAdd={(k) => addBlock(k, 0)} />
          {rows.map((row, i) => (
            <div key={row.uid}>
              <BlockCard
                row={row}
                index={i}
                total={rows.length}
                onUpdate={(patch) => updateRow(i, patch)}
                onMove={(d) => move(i, d)}
                onDuplicate={() => duplicate(i)}
                onRemove={() => remove(i)}
              />
              <Inserter onAdd={(k) => addBlock(k, i + 1)} />
            </div>
          ))}

          {rows.length === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No blocks yet. Use the buttons above to add prose, a playground, or
              a checkpoint.
            </p>
          )}
        </>
      )}

      {/* Local input styling */}
      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.5rem 0.625rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          border-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Inserter({ onAdd }: { onAdd: (k: Kind) => void }) {
  const items: { kind: Kind; icon: React.ReactNode; label: string }[] = [
    { kind: "html", icon: <FileText className="h-3.5 w-3.5" />, label: "Prose" },
    {
      kind: "playground",
      icon: <Code2 className="h-3.5 w-3.5" />,
      label: "Playground",
    },
    {
      kind: "quiz",
      icon: <HelpCircle className="h-3.5 w-3.5" />,
      label: "Checkpoint",
    },
  ];
  return (
    <div className="group flex items-center gap-2 py-2">
      <div className="h-px flex-1 bg-border" />
      <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
        {items.map((it) => (
          <button
            key={it.kind}
            type="button"
            onClick={() => onAdd(it.kind)}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            {it.icon}
            {it.label}
          </button>
        ))}
      </div>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function BlockCard({
  row,
  index,
  total,
  onUpdate,
  onMove,
  onDuplicate,
  onRemove,
}: {
  row: Row;
  index: number;
  total: number;
  onUpdate: (patch: Partial<Row>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const meta =
    row.kind === "html"
      ? { icon: <FileText className="h-3.5 w-3.5" />, label: "Prose (HTML)" }
      : row.kind === "playground"
        ? { icon: <Code2 className="h-3.5 w-3.5" />, label: "Playground" }
        : { icon: <HelpCircle className="h-3.5 w-3.5" />, label: "Checkpoint" };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          {meta.icon}
          {meta.label}
        </span>
        <div className="flex items-center gap-0.5 text-muted-foreground">
          <IconBtn title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            title="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Duplicate" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Delete" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </IconBtn>
        </div>
      </div>

      <div className="p-3">
        {row.kind === "html" && (
          <textarea
            value={row.html ?? ""}
            onChange={(e) => onUpdate({ html: e.target.value })}
            placeholder={"## Section heading\n\nWrite **Markdown** here… (HTML also works)"}
            rows={6}
            className="w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-[13px] outline-none focus:border-primary"
          />
        )}

        {row.kind === "playground" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={row.language}
                onChange={(e) => onUpdate({ language: e.target.value })}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
              >
                {LANGS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <input
                value={row.title ?? ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="filename (main.py)"
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <textarea
              value={row.code ?? ""}
              onChange={(e) => onUpdate({ code: e.target.value })}
              placeholder={'print("Hello World")'}
              rows={5}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-border bg-[#0d1019] p-3 font-mono text-[13px] text-slate-200 outline-none focus:border-primary"
            />
          </div>
        )}

        {row.kind === "quiz" && (
          <div className="space-y-3">
            <input
              value={row.question ?? ""}
              onChange={(e) => onUpdate({ question: e.target.value })}
              placeholder="Question"
              className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm font-medium outline-none focus:border-primary"
            />
            <div className="space-y-1.5">
              {(row.options ?? []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    title="Mark correct"
                    checked={row.answer === oi}
                    onChange={() => onUpdate({ answer: oi })}
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      const options = [...(row.options ?? [])];
                      options[oi] = e.target.value;
                      onUpdate({ options });
                    }}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <IconBtn
                    title="Remove option"
                    disabled={(row.options ?? []).length <= 2}
                    onClick={() => {
                      const options = (row.options ?? []).filter(
                        (_, k) => k !== oi,
                      );
                      onUpdate({
                        options,
                        answer: row.answer === oi ? 0 : row.answer,
                      });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  onUpdate({ options: [...(row.options ?? []), ""] })
                }
                className="flex items-center gap-1 text-xs font-medium text-primary hover:brightness-110"
              >
                <Plus className="h-3 w-3" /> Add option
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Select the radio next to the correct option.
            </p>
            <textarea
              value={row.explanation ?? ""}
              onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="Explanation (shown after answering)"
              rows={2}
              className="w-full resize-y rounded-lg border border-border bg-background p-2.5 text-[13px] outline-none focus:border-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"
    >
      {children}
    </button>
  );
}
