"use client";

import { useEffect, useMemo, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import Image from "next/image";
import {
  ExternalLink,
  Globe,
  Check,
  ArrowRight,
  FileText,
  Play,
  BookOpen,
  Wrench,
  BookMarked,
  GraduationCap,
  Link2,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PathSessionStep } from "@/lib/path-types";
import { StepSkeleton } from "@/components/pages/path/step-skeleton";
import { PROSE } from "./path-article";

interface ResourceItem {
  title?: string;
  summary?: string;
  content?: string;
  link?: string;
  type?: string;
  banner?: string;
}

// Map the free-text `type` to an icon + accent so each resource reads at a glance.
const TYPES: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; accent: string; from: string; to: string }
> = {
  article: { icon: FileText, accent: "#13AECE", from: "#13AECE", to: "#2BB8D8" },
  video: { icon: Play, accent: "#e0567a", from: "#e0567a", to: "#f0849f" },
  book: { icon: BookOpen, accent: "#caa000", from: "#caa000", to: "#F2C94C" },
  ebook: { icon: BookOpen, accent: "#caa000", from: "#caa000", to: "#F2C94C" },
  tool: { icon: Wrench, accent: "#347474", from: "#347474", to: "#5fb0b0" },
  documentation: { icon: BookMarked, accent: "#6366f1", from: "#6366f1", to: "#818cf8" },
  docs: { icon: BookMarked, accent: "#6366f1", from: "#6366f1", to: "#818cf8" },
  course: { icon: GraduationCap, accent: "#13AECE", from: "#13AECE", to: "#2BB8D8" },
  podcast: { icon: Headphones, accent: "#a855f7", from: "#a855f7", to: "#c084fc" },
};

function typeMeta(type?: string) {
  return TYPES[(type ?? "").toLowerCase().trim()] ?? TYPES.article;
}

function hostOf(link?: string): string | null {
  if (!link) return null;
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function PathResource({
  step,
  onComplete,
  itemData,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  itemData?: ResourceItem;
}) {
  const store = useAppStore();
  const [item, setItem] = useState<ResourceItem | null>(itemData ?? null);
  const [loading, setLoading] = useState(!itemData);
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

  const link = step.url ?? item?.link ?? "";
  const host = hostOf(link);
  const { icon: Icon, accent } = typeMeta(item?.type);
  const title = item?.title ?? step.title;
  const typeLabel = (item?.type ?? "Resource").replace(/\b\w/g, (c) =>
    c.toUpperCase(),
  );
  const contentHtml = useMemo(
    () => (item?.content ? sanitizeHtml(item.content) : ""),
    [item?.content],
  );

  return (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto">
      <div className="my-auto w-full max-w-[560px] px-4 py-8 sm:px-6">
        {loading ? (
          <StepSkeleton />
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)]">
              {/* Cover */}
              {item?.banner ? (
                <div className="relative h-40 w-full sm:h-48">
                  <Image
                    src={item.banner}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <span className="absolute bottom-4 left-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Icon className="h-3.5 w-3.5" />
                    {typeLabel}
                  </span>
                </div>
              ) : (
                <div className="relative flex h-36 w-full items-center justify-center overflow-hidden border-b border-border bg-[#171B26] sm:h-40">
                  {/* accent glow blooming from the top-centre */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(70% 90% at 50% 0%, ${accent}2e, transparent 70%)`,
                    }}
                  />
                  {/* fine dot-grid texture */}
                  <div className="absolute inset-0 text-white/[0.045] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px]" />
                  {/* centred icon tile + type label */}
                  <div className="relative flex flex-col items-center gap-3">
                    <span
                      className="grid h-14 w-14 place-items-center rounded-2xl"
                      style={{
                        backgroundColor: `${accent}24`,
                        color: accent,
                        boxShadow: `inset 0 0 0 1px ${accent}45`,
                      }}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                      {typeLabel}
                    </span>
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="p-5 sm:p-7">
                <h1 className="text-[22px] font-bold leading-tight tracking-tight">
                  {title}
                </h1>

                {host && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {host}
                  </a>
                )}

                {item?.summary && (
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                )}

                {contentHtml && (
                  <article
                    className={`mt-5 ${PROSE}`}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentHtml) }}
                  />
                )}

                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-[#2BB8D8] text-sm font-extrabold text-[#06222b] shadow-[0_6px_20px_-4px_rgba(19,174,206,0.5)] transition hover:brightness-110 sm:w-auto sm:px-7"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open resource
                  </a>
                )}
              </div>
            </div>

            {/* Completion */}
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <p className="text-[13px] text-muted-foreground">
                {done
                  ? "You've completed this resource."
                  : "Explored it? Mark it complete to continue."}
              </p>
              <Button
                onClick={() => onComplete(step.id, { visited: true })}
                variant={done ? "default" : "outline"}
                className={
                  done
                    ? "h-11 gap-1.5 rounded-xl bg-gradient-to-br from-primary to-[#2BB8D8] px-7 font-extrabold text-[#06222b] hover:brightness-110"
                    : "h-11 gap-1.5 rounded-xl border-border bg-transparent px-7"
                }
              >
                {done ? (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Mark as visited &amp; continue
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
