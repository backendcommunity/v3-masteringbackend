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

/**
 * Restyled to the "Bold Simplicity" system:
 *  - flat card on the dark canvas, 1px Light-Blue outline
 *  - hover: lift -2px + Light-Blue border
 *  - selected: 2px Pacific-Cyan border, soft cyan tint, 4-point star top-right
 * Props API unchanged so every step component keeps working as-is.
 */
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
      className="group relative w-full text-left rounded-xl p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#13AECE]"
      style={{
        border: `${selected ? 2 : 1}px solid ${selected ? "#13AECE" : "rgba(151,195,204,0.18)"}`,
        background: selected ? "rgba(19,174,206,0.06)" : "transparent",
        transform: selected ? "translateY(-1px)" : "translateY(0)",
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "rgba(151,195,204,0.45)";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "rgba(151,195,204,0.18)";
      }}
    >
      {/* 4-point star — appears on select */}
      <span
        aria-hidden="true"
        className="absolute top-3.5 right-3.5 transition-all duration-300"
        style={{
          color: "#13AECE",
          opacity: selected ? 1 : 0,
          transform: selected ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-30deg)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
        </svg>
      </span>

      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 44,
            height: 44,
            background: selected ? "rgba(19,174,206,0.16)" : "rgba(151,195,204,0.08)",
            color: selected ? "#13AECE" : "#97C3CC",
            transition: "all 200ms",
          }}
        >
          {isReactNode ? <div>{icon}</div> : <div style={{ fontSize: 22 }}>{icon}</div>}
        </div>
        {badge && (
          <span
            className="text-xs font-semibold rounded-full px-3 py-1 mt-1"
            style={{
              background: "rgba(19,174,206,0.12)",
              color: "#13AECE",
              border: "1px solid rgba(19,174,206,0.3)",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="font-bold text-sm" style={{ color: "#FFFFFF" }}>
        {title}
      </div>
      <div className="text-xs mt-1.5 leading-relaxed" style={{ color: "#97C3CC" }}>
        {description}
      </div>
    </button>
  );
}
