"use client"

import { GripVertical } from "lucide-react"
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels"

const ResizablePrimitive = { PanelGroup, Panel, PanelResizeHandle }

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-orientation=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
  // The PARENT group's orientation. "horizontal" = side-by-side panels with a
  // vertical divider (default). "vertical" = stacked panels with a horizontal
  // divider. react-resizable-panels doesn't expose this on the handle, so the
  // caller passes it for correctly-oriented hairline + grip.
  orientation?: "horizontal" | "vertical"
}) => {
  const vertical = orientation === "vertical"
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        // Wide container gives breathing room between panels
        "group relative flex shrink-0 items-center justify-center",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        vertical ? "h-4 w-full" : "w-4",
        className
      )}
      {...props}
    >
      {/* Hairline visual track centered in the hit area */}
      <div
        className={cn(
          "absolute bg-border/70 transition-colors duration-150 group-hover:bg-primary/50 group-active:bg-primary/70",
          vertical
            ? "inset-x-0 top-1/2 h-px -translate-y-1/2"
            : "inset-y-0 left-1/2 w-px -translate-x-1/2"
        )}
      />

      {/* Grip pill */}
      {withHandle && (
        <div
          className={cn(
            "relative z-10 flex items-center justify-center rounded-full bg-border shadow-sm transition-colors group-hover:bg-primary group-active:bg-primary/80",
            vertical ? "h-3 w-6" : "h-6 w-3"
          )}
        >
          <GripVertical
            className={cn(
              "text-muted-foreground transition-colors group-hover:text-primary-foreground",
              vertical ? "h-3 w-3.5 rotate-90" : "h-3.5 w-3"
            )}
          />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
