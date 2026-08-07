import type { Project } from "@/lib/data";

export const PLAYGROUND_MODES = ["rest-api", "frontend", "terminal"] as const;
export type PlaygroundMode = (typeof PLAYGROUND_MODES)[number];

/**
 * The ONE canonical resolver for a project's playground mode on the
 * frontend — mirrors academy's src/modules/projects/helpers/playground-mode.ts
 * precedence exactly. Never read frontendURL/baseRepository for mode.
 */
export function getPlaygroundMode(project: Pick<Project, "playgroundConfig">): PlaygroundMode {
  const config = project?.playgroundConfig as Record<string, unknown> | undefined;
  const mode = config?.mode;

  if (mode !== undefined) {
    if (typeof mode === "string" && (PLAYGROUND_MODES as readonly string[]).includes(mode)) {
      return mode as PlaygroundMode;
    }
    console.error("getPlaygroundMode: unknown stored mode", { mode });
    return "rest-api";
  }

  if (config?.frontendPreview) return "frontend";

  return "rest-api";
}

// Demo mode detection for canned, frontend-only playground demo
export function isDemoMode(
  slug: string,
  searchParams?: URLSearchParams
): boolean {
  // Demo mode triggered by:
  // 1. slug="playground-demo" (special demo-only slug)
  // 2. ?demo=1 query param (force demo on any enrolled project for testing)
  const demoForced =
    typeof window !== "undefined" &&
    (searchParams || new URLSearchParams(window.location.search)).has("demo");

  return slug === "playground-demo" || demoForced;
}
