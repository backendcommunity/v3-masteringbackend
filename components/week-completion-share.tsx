"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  BookOpen,
  Star,
  Copy,
  Check,
  ChevronRight,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Week } from "@/lib/data";
import confetti from "canvas-confetti";

// ─── Generic completion share ───────────────────────────────────

export interface CompletionStat {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: string; // Tailwind-compatible hex, e.g. "#13AECE"
}

export interface CompletionShareProps {
  open: boolean;
  onClose: () => void;
  /** Big heading, e.g. "Week Completed!" */
  heading: string;
  /** Primary line under heading, e.g. the week or course title */
  title: string;
  /** Secondary line, e.g. bootcamp name */
  subtitle?: string;
  userName: string;
  /** Stat cards shown in the achievement card (max 3 recommended) */
  stats: CompletionStat[];
  /** Pre-composed text used for Twitter/LinkedIn/clipboard share */
  shareText: string;
  /** Optional primary CTA button */
  cta?: {
    label: string;
    sublabel?: string;
    onClick: () => void;
  };
  /** Override confetti colors (brand defaults if omitted) */
  confettiColors?: string[];
}

export function CompletionShare({
  open,
  onClose,
  heading,
  title,
  subtitle,
  userName,
  stats,
  shareText,
  cta,
  confettiColors,
}: CompletionShareProps) {
  const [copied, setCopied] = useState(false);
  const confettiRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  // Fire confetti when dialog opens
  useEffect(() => {
    if (!open || !confettiRef.current) return;

    const myConfetti = confetti.create(confettiRef.current, {
      resize: true,
      useWorker: true,
    });

    const colors = confettiColors ?? [
      "#13AECE",
      "#F2C94C",
      "#27AE60",
      "#9B59B6",
      "#2BB8D8",
    ];

    const burstLeft = () =>
      myConfetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        startVelocity: 50,
        origin: { x: 0, y: 0.7 },
        colors,
        ticks: 200,
      });

    const burstRight = () =>
      myConfetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        startVelocity: 50,
        origin: { x: 1, y: 0.7 },
        colors,
        ticks: 200,
      });

    const t1 = setTimeout(() => {
      burstLeft();
      burstRight();
    }, 200);
    const t2 = setTimeout(() => {
      burstLeft();
      burstRight();
    }, 600);
    const t3 = setTimeout(() => {
      myConfetti({
        particleCount: 40,
        spread: 100,
        startVelocity: 30,
        origin: { x: 0.5, y: 0.3 },
        colors,
        ticks: 150,
      });
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      myConfetti.reset();
    };
  }, [open, confettiColors]);

  const handleTwitterShare = () => {
    // shareText is platform-agnostic; append the X handle here so LinkedIn
    // doesn't inherit the Twitter mention (and vice versa).
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} @master_backend`)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(`${shareText} @masteringbackend`)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const gridCols =
    stats.length === 1
      ? "grid-cols-1"
      : stats.length === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[440px] p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            Share your achievement on social media
          </DialogDescription>
        </DialogHeader>

        {/* Confetti canvas */}
        <canvas
          ref={confettiRef}
          className="pointer-events-none fixed inset-0 z-[60]"
          style={{ width: "100%", height: "100%" }}
        />

        <div className="relative rounded-lg overflow-hidden">
          {/* ── Top Section: Dark celebration card ── */}
          <div className="relative bg-[#0c1222] overflow-hidden">
            {/* Decorative gradient orbs */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#9B59B6]/15 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

            {/* Animated sparkle dots */}
            <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-[#F2C94C] rounded-full animate-pulse" />
            <div
              className="absolute top-16 right-6 w-1 h-1 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className="absolute bottom-20 left-8 w-1.5 h-1.5 bg-[#27AE60] rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute top-12 left-16 w-1 h-1 bg-[#9B59B6] rounded-full animate-pulse"
              style={{ animationDelay: "0.3s" }}
            />
            <div
              className="absolute bottom-28 right-20 w-1 h-1 bg-[#F2C94C] rounded-full animate-pulse"
              style={{ animationDelay: "0.8s" }}
            />

            <div className="relative px-6 pt-6 pb-5">
              {/* Trophy with glow ring */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 -m-3 rounded-full bg-[#F2C94C]/20 animate-ping" />
                  <div className="absolute inset-0 -m-2 rounded-full bg-[#F2C94C]/10 animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#F2C94C] to-[#E67E22] flex items-center justify-center shadow-lg shadow-[#F2C94C]/25">
                    <Trophy className="h-8 w-8 text-white drop-shadow-md" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
                  {heading}
                </h2>
                <p className="text-primary font-semibold text-base">
                  {title}
                </p>
                {subtitle && (
                  <p className="text-white/50 text-xs mt-1">{subtitle}</p>
                )}
              </div>

              {/* Stats row */}
              {stats.length > 0 && (
                <div className={`grid ${gridCols} gap-2.5 mb-5`}>
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-xl p-3 text-center"
                    >
                      <div
                        className="w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}26` }}
                      >
                        <stat.icon
                          className="h-4 w-4"
                          style={{ color: stat.color }}
                        />
                      </div>
                      <div className="text-lg font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User badge */}
              <div className="flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-full py-1.5 px-4 w-fit mx-auto">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-[#0F8BA8] flex items-center justify-center text-[9px] font-bold text-white">
                  {userName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span className="text-xs font-medium text-white/60">
                  {userName}
                </span>
              </div>
            </div>
          </div>

          {/* ── Bottom Section: Actions ── */}
          <div className="bg-background p-5 space-y-4">
            {/* Primary CTA */}
            {cta && (
              <button
                onClick={cta.onClick}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-[#0F8BA8] p-[1px] transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-gradient-to-r from-primary to-[#0F8BA8] px-6 py-3 text-white font-semibold text-sm transition-all group-hover:from-[#15BFE0] group-hover:to-[#11A0C0]">
                  <span>{cta.label}</span>
                  {cta.sublabel && (
                    <span className="text-white/70 font-normal">
                      — {cta.sublabel}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            )}

            {/* Share divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">
                Share your achievement
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleTwitterShare}
                variant="outline"
                className="flex-1 h-9 text-xs"
              >
                <svg
                  className="h-3.5 w-3.5 mr-1.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter / X
              </Button>
              <Button
                onClick={handleLinkedInShare}
                variant="outline"
                className="flex-1 h-9 text-xs"
              >
                <svg
                  className="h-3.5 w-3.5 mr-1.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Week-specific wrapper (preserves existing API) ─────────────

interface WeekCompletionShareProps {
  open: boolean;
  onClose: () => void;
  week: Week;
  userName: string;
  points: number;
  onStartNextWeek?: () => void;
  nextWeekTitle?: string;
}

export function WeekCompletionShare({
  open,
  onClose,
  week,
  userName,
  points,
  onStartNextWeek,
  nextWeekTitle,
}: WeekCompletionShareProps) {
  const bootcampTitle = week?.bootcamp?.title ?? "Bootcamp";
  const weekTitle = week?.title ?? "Week";
  const lessonsCount = week?.lessons?.length ?? 0;

  return (
    <CompletionShare
      open={open}
      onClose={onClose}
      heading="Week Completed!"
      title={weekTitle}
      subtitle={bootcampTitle}
      userName={userName}
      stats={[
        {
          icon: BookOpen,
          value: lessonsCount,
          label: "Lessons",
          color: "#13AECE",
        },
        { icon: Star, value: points, label: "MB Points", color: "#F2C94C" },
        { icon: Zap, value: "100%", label: "Progress", color: "#27AE60" },
      ]}
      shareText={`I just completed "${weekTitle}" in ${bootcampTitle} on Mastering Backend!\n\n${lessonsCount} lessons done, ${points} MB points earned.\n\nJoin me and level up your backend engineering skills!`}
      cta={
        onStartNextWeek
          ? {
              label: "Start Next Week",
              sublabel: nextWeekTitle,
              onClick: onStartNextWeek,
            }
          : undefined
      }
    />
  );
}
