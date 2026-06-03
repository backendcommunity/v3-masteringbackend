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
      "group relative flex w-1.5 items-center justify-center bg-border/60 transition-colors",
      "hover:bg-primary/30 active:bg-primary/50",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      "data-[panel-group-orientation=vertical]:h-1.5 data-[panel-group-orientation=vertical]:w-full",
      "[&[data-panel-group-orientation=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-8 w-1.5 items-center justify-center rounded-full bg-border group-hover:bg-primary/60 transition-colors">
        <GripVertical className="h-4 w-3 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
