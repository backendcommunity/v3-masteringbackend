"use client";

import {
  TerminalSquare,
  GitBranch,
  Server,
  Network,
  Globe,
  type LucideIcon,
} from "lucide-react";

export type Tier =
  | "LOCALHOST"
  | "STAGING"
  | "PRODUCTION"
  | "DISTRIBUTED"
  | "PLANET_SCALE";

export const TIER_CONFIG: Record<
  Tier,
  { label: string; icon: LucideIcon; color: string; blurb: string }
> = {
  LOCALHOST: {
    label: "Localhost",
    icon: TerminalSquare,
    color: "#8b9bb4",
    blurb: "Everyone starts here.",
  },
  STAGING: {
    label: "Staging",
    icon: GitBranch,
    color: "#13AECE",
    blurb: "It's getting serious.",
  },
  PRODUCTION: {
    label: "Production",
    icon: Server,
    color: "#27AE60",
    blurb: "Real users depend on it.",
  },
  DISTRIBUTED: {
    label: "Distributed",
    icon: Network,
    color: "#9B59B6",
    blurb: "It scales sideways.",
  },
  PLANET_SCALE: {
    label: "Planet-Scale",
    icon: Globe,
    color: "#F2C94C",
    blurb: "It runs the world.",
  },
};

export function LeagueTierEmblem({
  tier,
  size = 40,
  className = "",
}: {
  tier: Tier;
  size?: number;
  className?: string;
}) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.LOCALHOST;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl ${className}`}
      style={{
        width: size,
        height: size,
        background: `${cfg.color}22`,
        border: `1px solid ${cfg.color}55`,
        color: cfg.color,
      }}
      aria-label={cfg.label}
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}
