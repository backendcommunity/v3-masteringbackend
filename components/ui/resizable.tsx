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
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      // Wide container gives breathing room between panels
      "group relative flex w-4 shrink-0 items-center justify-center",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      "data-[panel-group-orientation=vertical]:h-4 data-[panel-group-orientation=vertical]:w-full",
      "[&[data-panel-group-orientation=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {/* Hairline visual track centered in the wide hit area */}
    <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border/70 transition-colors duration-150 group-hover:bg-primary/50 group-active:bg-primary/70" />

    {/* Grip pill */}
    {withHandle && (
      <div className="relative z-10 flex h-6 w-3 items-center justify-center rounded-full bg-border shadow-sm transition-colors group-hover:bg-primary group-active:bg-primary/80">
        <GripVertical className="h-3.5 w-3 text-muted-foreground transition-colors group-hover:text-primary-foreground" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
