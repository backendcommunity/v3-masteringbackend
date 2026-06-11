"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { FileText, Bookmark, Clock, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PathSessionStep } from "@/lib/path-types";
import { Loader } from "@/components/ui/loader";
import { InlinePlayground } from "./inline-playground";
import { InlineQuiz } from "./inline-quiz";

// Articles can be plain HTML, or a sequence of blocks that interleave prose with
// interactive widgets (runnable playgrounds, inline checkpoints).
export type ArticleBlock =
  | { type: "html"; html: string }
  | { type: "playground"; language?: string; code?: string; title?: string }
  | {
      type: "quiz";
      question: string;
      options: string[];
      answer: number;
      explanation?: string;
    };

interface ArticleItem {
  title?: string;
  description?: string;
  summary?: string;
  content?: string;
  body?: string;
  cover?: string;
  image?: string;
  blocks?: ArticleBlock[];
}

// Article prose (both the `content` fallback and each html block) is authored
// as Markdown — optionally with embedded HTML. Render it to HTML the same way
// everywhere: GitHub-flavored Markdown → sanitize → PROSE styles. marked passes
// raw HTML through, so legacy HTML-only articles keep rendering unchanged.
marked.setOptions({ gfm: true, breaks: true });
function mdToHtml(raw: string): string {
  if (!raw) return "";
  return DOMPurify.sanitize(marked.parse(raw, { async: false }) as string);
}

// Strip tags to estimate reading time and to fall back to a description.
function plain(raw: string): string {
  return DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] })
    .replace(/\s+/g, " ")
    .trim();
}

// Editorial prose theme — typographic scale, callouts (blockquote), red inline
// code chips, dark code blocks, framed images. Tuned for both light and dark.
export const PROSE = [
  "text-[15px] leading-[1.75] text-foreground/90",
  // headings
  "[&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-[28px] [&_h1]:font-extrabold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:text-foreground",
  "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-foreground",
  "[&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:text-foreground",
  // body
  "[&_p]:my-4",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:brightness-110",
  // lists
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:marker:text-primary/60",
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:marker:text-muted-foreground",
  "[&_li]:my-1.5 [&_li]:pl-1",
  // inline code chip (not inside <pre>)
  "[&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:bg-rose-500/10 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.85em] [&_:not(pre)>code]:font-medium [&_:not(pre)>code]:text-rose-500 dark:[&_:not(pre)>code]:text-rose-300",
  // fenced code block
  "[&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-[#0d1019] [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:leading-relaxed [&_pre]:text-slate-200",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-slate-200",
  // blockquote → callout
  "[&_blockquote]:my-5 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-[3px] [&_blockquote]:border-primary [&_blockquote]:bg-primary/[0.06] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-foreground/80 [&_blockquote_p]:my-1",
  // media + rules + tables — keep wide media inside the column on mobile
  "[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border [&_img]:shadow-[0_8px_30px_-16px_rgba(0,0,0,0.4)]",
  "[&_iframe]:my-6 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-xl [&_iframe]:border [&_iframe]:border-border",
  "[&_hr]:my-9 [&_hr]:border-border",
  "[&_table]:my-5 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
].join(" ");

export function PathArticle({
  step,
  onComplete,
  itemData,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  // Optional injected article (preview/testing) — bypasses the store fetch.
  itemData?: ArticleItem;
}) {
  const store = useAppStore();
  const [item, setItem] = useState<ArticleItem | null>(itemData ?? null);
  const [loading, setLoading] = useState(!itemData);
  const [bookmarked, setBookmarked] = useState(false);
  const done = step.status === "DONE";

  useEffect(() => {
    if (itemData) {
      setItem(itemData);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const data = await store.getPathItem(step.payloadRef.endpoint);
        if (active) setItem(data);
      } catch {
        if (active) setItem(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, itemData]);

  const rawHtml = item?.content ?? item?.body ?? item?.summary ?? "";
  const html = useMemo(() => mdToHtml(rawHtml), [rawHtml]);

  const blocks = item?.blocks;
  const blocksText = useMemo(
    () =>
      blocks
        ? blocks
            .map((b) => (b.type === "html" ? plain(b.html) : ""))
            .join(" ")
        : "",
    [blocks],
  );
  const text = useMemo(() => html || blocksText, [html, blocksText]);
  const readMin = Math.max(1, Math.round(text.split(" ").length / 200));
  const title = item?.title ?? step.title;
  const description =
    item?.description ?? (item?.summary ? plain(item.summary) : "");

  return (
    <div className="flex h-full w-full justify-center overflow-y-auto">
      <div className="w-full max-w-[760px] px-5 py-8 sm:px-8 sm:py-10">
        {loading ? (
          <Loader isFull={false} />
        ) : (
          <>
            {/* Lesson header */}
            <header className="border-b border-border pb-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Article
                  <span className="text-muted-foreground/50">·</span>
                  <Clock className="h-3.5 w-3.5" />
                  {readMin} min read
                </span>
                <button
                  type="button"
                  onClick={() => setBookmarked((v) => !v)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                    bookmarked
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  title={bookmarked ? "Bookmarked" : "Bookmark"}
                >
                  <Bookmark
                    className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`}
                  />
                </button>
              </div>
              <h1 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
            </header>

            {/* Body — block sequence (prose + inline widgets) or plain HTML */}
            {blocks && blocks.length ? (
              <div className="mt-8">
                {blocks.map((b, i) => {
                  if (b.type === "playground")
                    return (
                      <InlinePlayground
                        key={i}
                        language={b.language}
                        code={b.code}
                        title={b.title}
                      />
                    );
                  if (b.type === "quiz")
                    return (
                      <InlineQuiz
                        key={i}
                        question={b.question}
                        options={b.options}
                        answer={b.answer}
                        explanation={b.explanation}
                      />
                    );
                  return (
                    <article
                      key={i}
                      className={PROSE}
                      dangerouslySetInnerHTML={{ __html: mdToHtml(b.html) }}
                    />
                  );
                })}
              </div>
            ) : html ? (
              <article
                className={`mt-8 ${PROSE}`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p className="mt-8 text-[15px] text-muted-foreground">
                This lesson has no written content yet. Use{" "}
                <span className="font-semibold text-foreground">Next</span> to
                continue.
              </p>
            )}

            {/* Completion */}
            <div className="mt-10 flex flex-col items-center gap-3 border-t border-border pt-7 text-center">
              <p className="text-[13px] text-muted-foreground">
                {done
                  ? "You've completed this lesson."
                  : "Finished reading? Mark it complete to continue."}
              </p>
              <Button
                onClick={() => onComplete(step.id, { done: true })}
                className="h-11 gap-1.5 rounded-xl bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] px-7 text-sm font-extrabold text-[#06222b] shadow-[0_6px_20px_-4px_rgba(19,174,206,0.5)] hover:brightness-110"
              >
                {done ? (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Mark as read &amp; continue
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
