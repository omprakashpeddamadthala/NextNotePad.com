"use client";

import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border/60 focus-visible:ring-ring/30 group relative z-10 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none",
        // Vertical handle (horizontal layout)
        "aria-[orientation=vertical]:hover:bg-primary/50 aria-[orientation=vertical]:active:bg-primary aria-[orientation=vertical]:h-full aria-[orientation=vertical]:w-px aria-[orientation=vertical]:cursor-col-resize",
        // Horizontal handle (vertical layout)
        "aria-[orientation=horizontal]:hover:bg-primary/50 aria-[orientation=horizontal]:active:bg-primary aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-muted-foreground/30 hover:bg-primary z-10 flex h-6 w-1 shrink-0 rounded-full opacity-0 shadow-sm transition-[color,opacity] group-hover:opacity-100 aria-[orientation=horizontal]:h-1 aria-[orientation=horizontal]:w-6" />
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
