"use client";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Lightbulb, Sparkles } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";
import { useAppStore, KapInsights } from "@/lib/store";
import { KapTutorPanel } from "@/components/pages/kap/kap-tutor-panel";
import { useVideoTime } from "@/lib/video-time-store";
import { VideoTranscript } from "@/components/pages/video-transcript";

type Tab = "Overview" | "Transcript";

interface PanelItem {
  description?: string;
  summary?: string;
  body?: string;
  content?: string;
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  video?: any; // Vimeo numeric id for VIDEO items
}

function stripHtml(raw: string): string {
  const clean = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] });
  return clean.replace(/\s+/g, " ").trim();
}

export function PathContextPanel({ step }: { step?: PathSessionStep }) {
  const store = useAppStore();
  const videoTime = useVideoTime((s) => s.videoTime);
  const [tab, setTab] = useState<Tab>("Overview");
  const [item, setItem] = useState<PanelItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<KapInsights | null>(null);

  const videoId = step?.type === "VIDEO" ? step.itemId : undefined;

  useEffect(() => {
    let active = true;
    setInsights(null);
    if (!videoId) return;
    (async () => {
      const data = await store.getKapInsights(videoId);
      if (active) setInsights(data);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

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

  const tabs: Tab[] = ["Overview", "Transcript"];

  const overviewContent = step ? (
    <>
      <h3 className="mb-3 text-[15px] font-bold leading-snug">{step.title}</h3>
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
          This {step.type.replace("_", " ").toLowerCase()} is part of your
          learning path. Work through it, then mark it complete to move on.
        </p>
      )}
      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-primary" /> Key takeaways
          </div>
          {insights?.keyTakeaways?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
              {insights.keyTakeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12px] text-muted-foreground/70">
              {videoId ? "Generating insights…" : "Available on video lessons."}
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-primary" /> Real-world use
          </div>
          {insights?.realWorldUse?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
              {insights.realWorldUse.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12px] text-muted-foreground/70">
              {videoId ? "Generating insights…" : "Available on video lessons."}
            </p>
          )}
        </div>
      </div>
    </>
  ) : (
    <p className="text-[13px] leading-relaxed text-muted-foreground">
      Select a step to see its overview.
    </p>
  );

  return (
    <aside className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_16px_-10px_rgba(0,0,0,0.3)]">
      {/* Tab bar */}
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
      <div className="flex flex-1 min-h-0 flex-col">
        {tab === "Overview" &&
          (videoId ? (
            <KapTutorPanel
              scope="video"
              videoId={videoId}
              title={item?.title}
              className="flex-1 min-h-0"
              header={
                <div className="animate-in fade-in duration-200 px-2 pb-1">
                  {overviewContent}
                </div>
              }
            />
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="animate-in fade-in duration-200 p-5">
                {overviewContent}
              </div>
            </div>
          ))}

        {tab === "Transcript" && (
          <div className="flex-1 min-h-0 overflow-y-auto animate-in fade-in duration-200">
            <VideoTranscript vimeoId={item?.video} currentTime={videoTime} />
          </div>
        )}
      </div>
    </aside>
  );
}
