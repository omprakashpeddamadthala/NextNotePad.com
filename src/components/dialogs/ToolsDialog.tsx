"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUIStore } from "@/store/uiStore";
import { DiffCheckerTool } from "./tools/DiffCheckerTool";

export function ToolsDialog() {
  const open = useUIStore((s) => s.toolsDialogOpen);
  const setOpen = useUIStore((s) => s.setToolsDialogOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[85vh] max-h-[720px] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Diff Checker</DialogTitle>
          <DialogDescription>Compares two of your open tabs — the left pane loads the active tab automatically.</DialogDescription>
        </DialogHeader>
        {open && <DiffCheckerTool />}
      </DialogContent>
    </Dialog>
  );
}
