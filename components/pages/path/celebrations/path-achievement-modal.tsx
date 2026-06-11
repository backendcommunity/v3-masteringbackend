"use client";

import { useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { RARITY_COLORS } from "@/lib/portfolio-types";
import { cn } from "@/lib/utils";
import { Award, Star, Trophy, Zap, X, type LucideIcon } from "lucide-react";
import { CelebrationToast, useCelebrationDismiss } from "./celebration-toast";

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

function resolveRarityColor(rarity?: string | null): string {
  if (!rarity) return COMMON_RARITY;
  const normalized =
    rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
  return (
    RARITY_COLORS[normalized as keyof typeof RARITY_COLORS] ?? COMMON_RARITY
  );
}

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

function resolveLevelIcon(level: number): LucideIcon {
  if (level >= 5) return Trophy;
  if (level >= 3) return Zap;
  return Star;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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
  const firedRef = useRef(false);
  const dismiss = useCelebrationDismiss(onDone, 5000);

  const accent = useMemo(() => {
    if (event.kind === "achievement") return resolveRarityColor(event.rarity);
    return RARITY_COLORS.Legendary;
  }, [event]);

  // Silent confetti burst from the bottom-right corner, honoring reduced-motion.
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (prefersReducedMotion()) return;

    const colors =
      event.kind === "levelUp"
        ? ["#F2C94C", "#F39C12", "#13AECE"]
        : [accent, "#F2C94C", "#13AECE"];

    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 45,
      ticks: 130,
      angle: 135,
      origin: { x: 0.95, y: 0.95 },
      colors,
      disableForReducedMotion: true,
      zIndex: 100,
    });
  }, [event, accent]);

  const Icon =
    event.kind === "achievement"
      ? resolveAchievementIcon(event.icon)
      : resolveLevelIcon(event.newLevel);

  const rarityLabel =
    event.kind === "achievement" && event.rarity
      ? event.rarity.charAt(0).toUpperCase() +
        event.rarity.slice(1).toLowerCase()
      : null;

  return (
    <CelebrationToast>
      <div className="relative px-4 pb-4 pt-4">
        {/* Soft accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-8 h-24 blur-3xl"
          style={{
            background: `radial-gradient(closest-side, ${hexToRgba(
              accent,
              0.3
            )}, transparent)`,
          }}
        />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="relative flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full ring-2"
              style={{
                backgroundColor: hexToRgba(accent, 0.12),
                // @ts-expect-error -- CSS custom prop for Tailwind ring color
                "--tw-ring-color": hexToRgba(accent, 0.4),
              }}
            >
              <Icon
                className="h-7 w-7"
                style={{ color: accent }}
                aria-hidden="true"
              />
            </div>
            <span
              className="absolute -right-1 -top-1 text-lg"
              aria-hidden="true"
            >
              🎉
            </span>
          </div>

          {event.kind === "achievement" ? (
            <div className="min-w-0 pr-6">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: accent }}
              >
                Achievement unlocked
              </p>
              <h2 className="truncate text-lg font-bold text-foreground">
                {event.title}
              </h2>
              {rarityLabel && (
                <span
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: hexToRgba(accent, 0.12),
                    color: accent,
                  }}
                >
                  <Star className="h-2.5 w-2.5" aria-hidden="true" />
                  {rarityLabel}
                </span>
              )}
            </div>
          ) : (
            <div className="min-w-0 pr-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Leveled up!
              </p>
              <h2 className="text-lg font-bold text-foreground">
                Level {event.newLevel}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                From Level {event.oldLevel} to {event.newLevel}. Keep going.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className={cn(
            "relative mt-4 h-9 w-full rounded-lg bg-gradient-to-r from-primary to-[#0E8FA8] text-sm font-semibold text-primary-foreground",
            "transition-opacity hover:opacity-90"
          )}
        >
          Nice!
        </button>
      </div>
    </CelebrationToast>
  );
}
