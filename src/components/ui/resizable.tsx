"use client"

import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex items-center justify-center bg-border/60 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        // Vertical handle (horizontal layout)
        "aria-[orientation=vertical]:w-1 aria-[orientation=vertical]:h-full aria-[orientation=vertical]:cursor-col-resize aria-[orientation=vertical]:hover:bg-primary/40 aria-[orientation=vertical]:active:bg-primary",
        // Horizontal handle (vertical layout)
        "aria-[orientation=horizontal]:h-1 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize aria-[orientation=horizontal]:hover:bg-primary/40 aria-[orientation=horizontal]:active:bg-primary",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-5 w-1 shrink-0 rounded-full bg-muted-foreground/40 transition-colors hover:bg-primary aria-[orientation=horizontal]:h-1 aria-[orientation=horizontal]:w-5" />
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
