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
  if (typeof mode === "string" && (PLAYGROUND_MODES as readonly string[]).includes(mode)) {
    return mode as PlaygroundMode;
  }
  if (config?.frontendPreview) return "frontend";
  return "rest-api";
}
