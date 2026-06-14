"use client";

import { Play, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaygroundControls } from "@/lib/playground-controls-store";

// Run server + Preview controls, surfaced in the top bar for an embedded PROJECT
// playground. Reads the live handlers/state the playground publishes to the
// controls store. Shared by the path workspace and the standalone project
// playground so both top bars are identical.
export function ProjectTopControls() {
  const { connected, isRunning, previewVisible, runServer, togglePreview } =
    usePlaygroundControls();
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => runServer?.()}
        disabled={isRunning || !connected}
        className="h-8 gap-1.5 px-3 text-xs"
      >
        <Play className="w-3.5 h-3.5" />
        {isRunning ? "Running…" : "Run server"}
      </Button>
      <Button
        size="sm"
        variant={previewVisible ? "secondary" : "outline"}
        onClick={() => togglePreview?.()}
        aria-pressed={previewVisible}
        className="h-8 gap-1.5 px-3 text-xs"
      >
        <Monitor className="w-3.5 h-3.5" />
        Preview
      </Button>
    </div>
  );
}
