"use client";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { toast } from "sonner";
import {
  Lightbulb,
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";
import { useAppStore } from "@/lib/store";

type Tab = "AI Assistant" | "Transcript";

interface PanelItem {
  description?: string;
  summary?: string;
  body?: string;
  content?: string;
  resources?: { title?: string; name?: string; url: string }[];
  title?: string;
}

function stripHtml(raw: string): string {
  const clean = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] });
  return clean.replace(/\s+/g, " ").trim();
}

export function PathContextPanel({ step }: { step?: PathSessionStep }) {
  const store = useAppStore();
  const [tab, setTab] = useState<Tab>("AI Assistant");
  const [item, setItem] = useState<PanelItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!step) {
      setItem(null);
      return;
    }
    let active = true;
    setLoading(true);
    setItem(null);
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
  }, [step?.id]);

  const rawDesc =
    item?.description ?? item?.summary ?? item?.body ?? item?.content ?? "";
  const description = rawDesc ? stripHtml(rawDesc) : "";

  const tabs: Tab[] = ["AI Assistant", "Transcript"];

  return (
    <aside className="flex w-[320px] flex-none flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Tabs */}
      <div className="flex flex-none items-center gap-1.5">
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "AI Assistant" && <Sparkles className="h-3.5 w-3.5" />}
              {t}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="mt-4 flex-1 overflow-y-auto">
        {tab === "AI Assistant" ? (
          step ? (
            <div className="animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold leading-snug">
                {step.title}
              </h3>
              {loading ? (
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  Loading lesson details…
                </p>
              ) : description ? (
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : (
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  This {step.type.replace("_", " ").toLowerCase()} is part of
                  your learning path. Work through it, then mark it complete to
                  move on.
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-muted-foreground">
                <button
                  type="button"
                  aria-label="Helpful"
                  className="transition-colors hover:text-foreground"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Not helpful"
                  className="transition-colors hover:text-foreground"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Select a step to see its overview.
            </p>
          )
        ) : (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Transcript coming soon.
          </p>
        )}
      </div>

      {/* Footer: suggestion chips + Ask bar */}
      <div className="mt-4 flex-none">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Lightbulb className="h-3.5 w-3.5" /> Video Summary
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Lightbulb className="h-3.5 w-3.5" /> Real-Life Example
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast("AI assistant coming soon");
          }}
          className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
        >
          <input
            placeholder="Ask or write anything here…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="Send"
            className="grid h-8 w-8 flex-none place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
