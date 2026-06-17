"use client";

/**
 * Learn → Build → Grow journey cycle, stage-aware.
 * The active pillar is lit cyan and its outgoing arrow is colored — the user
 * is moving from where they are toward the next stage. Everything else is
 * grayed. Pillars: Learn (courses, bootcamps, paths) · Build (projects,
 * project30, MB lands) · Grow (mock interviews). Inline SVG only.
 */
export type JourneyStage = "learn" | "build" | "grow";

export function JourneyGlyph({
  className,
  stage = "learn",
}: {
  className?: string;
  stage?: JourneyStage;
}) {
  const CYAN = "#13AECE";
  const NODE_INACTIVE_FILL = "rgba(255,255,255,.08)";
  const NODE_INACTIVE_STROKE = "rgba(255,255,255,.25)";
  const ICON_INACTIVE = "rgba(255,255,255,.35)";
  const LABEL_ACTIVE = "rgba(255,255,255,.9)";
  const LABEL_INACTIVE = "rgba(255,255,255,.4)";
  const ARC_INACTIVE = "rgba(255,255,255,.15)";

  const active = (s: JourneyStage) => s === stage;
  // The arrow LEAVING the active stage shows the direction of travel
  const arcColor = (from: JourneyStage) => (active(from) ? CYAN : ARC_INACTIVE);
  const arrowFill = (from: JourneyStage) =>
    active(from) ? CYAN : "rgba(255,255,255,.25)";

  return (
    <svg
      className={["h-auto", className].filter(Boolean).join(" ")}
      viewBox="0 0 240 158"
      fill="none"
      aria-hidden="true"
    >
      {/* arcs: LEARN→BUILD, BUILD→GROW, GROW→LEARN */}
      <path
        d="M65 38 A 78 78 0 0 1 178 40"
        stroke={arcColor("learn")}
        strokeWidth="1.8"
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
      <path
        d="M196 64 A 78 78 0 0 1 150 122"
        stroke={arcColor("build")}
        strokeWidth="1.8"
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
      <path
        d="M96 124 A 78 78 0 0 1 44 66"
        stroke={arcColor("grow")}
        strokeWidth="1.8"
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
      {/* arrowheads */}
      <path d="M174 35l7 5-9 3z" fill={arrowFill("learn")} />
      <path d="M152 116l-1 9-7-6z" fill={arrowFill("build")} />
      <path d="M47 72l-5-8 9 1z" fill={arrowFill("grow")} />

      {/* LEARN node */}
      <circle
        cx="52"
        cy="48"
        r="20"
        fill={active("learn") ? CYAN : NODE_INACTIVE_FILL}
        stroke={active("learn") ? "none" : NODE_INACTIVE_STROKE}
        strokeWidth="1.5"
      />
      <path
        d="M45 43h6.5a3.5 3.5 0 013.5 3.5V55a4 4 0 00-3.5-2H45zM55 46.5a3.5 3.5 0 013.5-3.5H59v9.5h-4"
        stroke={active("learn") ? "#0E1F33" : ICON_INACTIVE}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="52"
        y="82"
        fill={active("learn") ? LABEL_ACTIVE : LABEL_INACTIVE}
        fontSize="9.5"
        fontWeight="700"
        letterSpacing="1.6"
        textAnchor="middle"
        fontFamily="inherit"
      >
        LEARN
      </text>

      {/* BUILD node */}
      <circle
        cx="190"
        cy="52"
        r="20"
        fill={active("build") ? CYAN : NODE_INACTIVE_FILL}
        stroke={active("build") ? "none" : NODE_INACTIVE_STROKE}
        strokeWidth="1.5"
      />
      <path
        d="M183 48l-4 4 4 4M197 48l4 4-4 4M192.5 45l-5 14"
        stroke={active("build") ? "#0E1F33" : ICON_INACTIVE}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="190"
        y="86"
        fill={active("build") ? LABEL_ACTIVE : LABEL_INACTIVE}
        fontSize="9.5"
        fontWeight="700"
        letterSpacing="1.6"
        textAnchor="middle"
        fontFamily="inherit"
      >
        BUILD
      </text>

      {/* GROW node */}
      <circle
        cx="122"
        cy="124"
        r="20"
        fill={active("grow") ? CYAN : NODE_INACTIVE_FILL}
        stroke={active("grow") ? "none" : NODE_INACTIVE_STROKE}
        strokeWidth="1.5"
      />
      <path
        d="M112 130l7-7 4 4 8-9M126 118h5v5"
        stroke={active("grow") ? "#0E1F33" : ICON_INACTIVE}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="122"
        y="152"
        fill={active("grow") ? LABEL_ACTIVE : LABEL_INACTIVE}
        fontSize="9.5"
        fontWeight="700"
        letterSpacing="1.6"
        textAnchor="middle"
        fontFamily="inherit"
      >
        GROW
      </text>
    </svg>
  );
}
