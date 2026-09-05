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
        "relative flex items-center justify-center bg-border ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Vertical handle (horizontal group)
        "aria-[orientation=vertical]:w-2 aria-[orientation=vertical]:-mx-1 aria-[orientation=vertical]:h-full aria-[orientation=vertical]:cursor-col-resize aria-[orientation=vertical]:bg-transparent aria-[orientation=vertical]:hover:bg-accent/60 aria-[orientation=vertical]:active:bg-primary/20",
        // Horizontal handle (vertical group)
        "aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:-my-1 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize aria-[orientation=horizontal]:bg-transparent aria-[orientation=horizontal]:hover:bg-accent/60 aria-[orientation=horizontal]:active:bg-primary/20",
        className
      )}
      {...props}
    >
      {/* Center line visual */}
      <div
        className={cn(
          "pointer-events-none bg-border transition-colors group-hover:bg-primary/50",
          "aria-[orientation=vertical]:h-full aria-[orientation=vertical]:w-px",
          "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full"
        )}
      />
      {withHandle && (
        <div className="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-muted-foreground/40 transition-colors group-hover:bg-primary aria-[orientation=horizontal]:h-1 aria-[orientation=horizontal]:w-6" />
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
