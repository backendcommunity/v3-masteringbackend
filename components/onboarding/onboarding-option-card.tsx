"use client";

import { ReactNode } from "react";

interface OnboardingOptionCardProps {
  icon: ReactNode | string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
  badgeColor?: string;
}

export function OnboardingOptionCard({
  icon,
  title,
  description,
  selected,
  onClick,
  badge,
  badgeColor = "bg-primary",
}: OnboardingOptionCardProps) {
  const isReactNode = typeof icon !== "string";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="w-full text-left rounded-xl p-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        border: `2px solid ${selected ? "hsl(var(--primary))" : "#1e293b"}`,
        background: selected ? "rgba(19, 174, 206, 0.08)" : "transparent",
        boxShadow: selected
          ? "0 0 0 1px rgba(19, 174, 206, 0.3)"
          : "none",
        transform: selected ? "scale(1.02)" : "scale(1)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`${badgeColor} p-3 rounded-lg flex items-center justify-center`}
          style={{ width: 48, height: 48 }}
        >
          {isReactNode ? (
            <div style={{ color: "#FFFFFF" }}>{icon}</div>
          ) : (
            <div style={{ fontSize: 24 }}>{icon}</div>
          )}
        </div>
        {badge && (
          <span
            className="text-xs font-semibold rounded-full px-3 py-1"
            style={{
              background: "rgba(19, 174, 206, 0.2)",
              color: "hsl(var(--primary))",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="font-bold text-white text-sm">{title}</div>
      <div className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
        {description}
      </div>
    </button>
  );
}
