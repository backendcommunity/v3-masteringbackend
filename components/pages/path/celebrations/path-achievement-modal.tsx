"use client";

import { useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RARITY_COLORS } from "@/lib/portfolio-types";
import { cn } from "@/lib/utils";
import { Award, Star, Trophy, Zap, type LucideIcon } from "lucide-react";

type AchievementEvent =
  | {
      kind: "achievement";
      title: string;
      icon?: string | null;
      rarity?: string | null;
    }
  | { kind: "levelUp"; oldLevel: number; newLevel: number };

interface PathAchievementModalProps {
  event: AchievementEvent;
  onDone: () => void;
}

const COMMON_RARITY = "#6B7280";

// Resolve a rarity string (case-insensitive) to its accent color, defaulting to common.
function resolveRarityColor(rarity?: string | null): string {
  if (!rarity) return COMMON_RARITY;
  const normalized =
    rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
  return (
    RARITY_COLORS[normalized as keyof typeof RARITY_COLORS] ?? COMMON_RARITY
  );
}

// A small set of friendly icon-name aliases mapped to lucide icons.
const ICON_MAP: Record<string, LucideIcon> = {
  award: Award,
  trophy: Trophy,
  star: Star,
  zap: Zap,
  medal: Award,
};

function resolveAchievementIcon(icon?: string | null): LucideIcon {
  if (!icon) return Award;
  return ICON_MAP[icon.trim().toLowerCase()] ?? Award;
}

// Level tiers mirror the level-up-modal idea: early levels Star, mid Zap, high Trophy.
function resolveLevelIcon(level: number): LucideIcon {
  if (level >= 5) return Trophy;
  if (level >= 3) return Zap;
  return Star;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Convert a hex accent into an rgba string for soft tinted backgrounds/rings.
function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PathAchievementModal({
  event,
  onDone,
}: PathAchievementModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const accent = useMemo(() => {
    if (event.kind === "achievement") {
      return resolveRarityColor(event.rarity);
    }
    // Level-up uses the brand-gold celebratory accent.
    return RARITY_COLORS.Legendary;
  }, [event]);

  // Silent confetti burst on open. We fire canvas-confetti directly here rather
  // than reusing ConfettiCelebration, which always plays sound via soundManager.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const colors =
      event.kind === "levelUp"
        ? ["#F2C94C", "#F39C12", "#13AECE"]
        : [accent, "#F2C94C", "#13AECE"];

    const defaults = {
      startVelocity: 55,
      spread: 360,
      ticks: 70,
      zIndex: 0,
      colors,
    };

    const fire = () => {
      myConfetti({ ...defaults, particleCount: 90, angle: 90, origin: { x: 0.5, y: 0.35 } });
      myConfetti({ ...defaults, particleCount: 50, angle: 60, origin: { x: 0.15, y: 0.5 } });
      myConfetti({ ...defaults, particleCount: 50, angle: 120, origin: { x: 0.85, y: 0.5 } });
    };

    fire();
    const intervalId = setInterval(fire, 350);
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      myConfetti.reset();
    }, 2200);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      myConfetti.reset();
    };
  }, [event, accent]);

  const Icon =
    event.kind === "achievement"
      ? resolveAchievementIcon(event.icon)
      : resolveLevelIcon(event.newLevel);

  const rarityLabel =
    event.kind === "achievement" && event.rarity
      ? event.rarity.charAt(0).toUpperCase() + event.rarity.slice(1).toLowerCase()
      : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          zIndex: 1000,
        }}
      />
      <Dialog open onOpenChange={(open) => !open && onDone()}>
        <DialogContent className="max-w-sm overflow-hidden rounded-2xl border-2 bg-background text-center">
          {/* Soft accent glow behind the medallion */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-10 h-32 blur-3xl"
            style={{
              background: `radial-gradient(closest-side, ${hexToRgba(
                accent,
                0.35
              )}, transparent)`,
            }}
          />

          <div className="relative flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full ring-4"
                style={{
                  backgroundColor: hexToRgba(accent, 0.12),
                  // @ts-expect-error -- CSS custom prop used by Tailwind ring color
                  "--tw-ring-color": hexToRgba(accent, 0.4),
                }}
              >
                <Icon
                  className="h-10 w-10"
                  style={{ color: accent }}
                  aria-hidden="true"
                />
              </div>
              <span className="absolute -right-1 -top-1 text-2xl" aria-hidden="true">
                🎉
              </span>
            </div>

            {event.kind === "achievement" ? (
              <div>
                <p
                  className="mb-1 text-sm font-medium uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  Achievement unlocked
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  {event.title}
                </h2>
                {rarityLabel && (
                  <span
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: hexToRgba(accent, 0.12),
                      color: accent,
                    }}
                  >
                    <Star className="h-3 w-3" aria-hidden="true" />
                    {rarityLabel}
                  </span>
                )}
              </div>
            ) : (
              <div>
                <p className="mb-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Leveled up!
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  Level {event.newLevel}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You advanced from Level {event.oldLevel} to Level{" "}
                  {event.newLevel}. Keep going to unlock more.
                </p>
              </div>
            )}

            <Button
              onClick={onDone}
              className={cn(
                "mt-2 w-full bg-gradient-to-r from-primary to-[#0E8FA8] text-primary-foreground",
                "hover:opacity-90"
              )}
            >
              Nice!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
