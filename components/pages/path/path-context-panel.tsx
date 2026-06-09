"use client";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { toast } from "sonner";
import { Lightbulb, Send, Sparkles } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";
import { useAppStore } from "@/lib/store";

type Tab = "Overview" | "Notes" | "Resources";

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
  const [tab, setTab] = useState<Tab>("Overview");
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
  const resources = item?.resources ?? [];

  const tabs: Tab[] = ["Overview", "Notes", "Resources"];

  return (
    <aside className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_6px_20px_-8px_rgba(0,0,0,0.5)]">
      {/* Tab bar — mirrors chat tools panel */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {t === "Overview" && <Sparkles className="h-3.5 w-3.5" />}
              {t}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        {tab === "Overview" && (
          <div className="animate-in fade-in duration-200">
            {step ? (
              <>
                <h3 className="mb-3 text-[15px] font-bold leading-snug">
                  {step.title}
                </h3>
                {loading ? (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Loading lesson details…
                  </p>
                ) : description ? (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                ) : (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    This {step.type.replace("_", " ").toLowerCase()} is part of
                    your learning path. Work through it, then mark it complete to
                    move on.
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-foreground">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" /> Key
                    takeaways
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-foreground">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" /> Real-world
                    use
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Select a step to see its overview.
              </p>
            )}
          </div>
        )}

        {tab === "Notes" && (
          <div className="animate-in fade-in duration-200 text-[13px] leading-relaxed text-muted-foreground">
            Your notes for this lesson will appear here.
          </div>
        )}

        {tab === "Resources" && (
          <div className="animate-in fade-in duration-200">
            {resources.length > 0 ? (
              <ul className="space-y-2">
                {resources.map((r, i) => (
                  <li key={`${r.url}-${i}`}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate rounded-lg border bg-card px-3 py-2 text-[13px] text-primary underline-offset-2 transition-colors hover:border-primary hover:underline"
                    >
                      {r.title ?? r.name ?? r.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                No extra resources for this lesson yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Ask bar (stub) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("AI assistant coming soon");
        }}
        className="flex-shrink-0 m-5 mt-0 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-3"
      >
        <input
          placeholder="Ask anything about this lesson…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Send"
          className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-gradient-brand text-[#06222b]"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </aside>
  );
}
