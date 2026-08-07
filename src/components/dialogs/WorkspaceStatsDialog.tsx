"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTrashStore } from "@/store/trashStore";
import { countNodes } from "@/lib/utils/treeUtils";
import { formatBytes } from "@/lib/utils/formatBytes";
import { estimateStorageUsage, type StorageEstimate } from "@/services/storage/workspaceRepository";

export function WorkspaceStatsDialog() {
  const open = useUIStore((s) => s.workspaceStatsOpen);
  const setOpen = useUIStore((s) => s.setWorkspaceStatsOpen);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const trashCount = useTrashStore((s) => s.entries.length);
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    if (open) void estimateStorageUsage().then(setEstimate);
  }, [open]);

  const stats = countNodes(nodes);
  const totalBytes = Object.values(nodes).reduce(
    (sum, n) => sum + (n.type === "file" && !n.deleted ? n.size : 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Workspace Statistics</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Files</dt>
          <dd className="text-right">{stats.files}</dd>
          <dt className="text-muted-foreground">Folders</dt>
          <dd className="text-right">{stats.folders}</dd>
          <dt className="text-muted-foreground">Content size</dt>
          <dd className="text-right">{formatBytes(totalBytes)}</dd>
          <dt className="text-muted-foreground">Items in Recycle Bin</dt>
          <dd className="text-right">{trashCount}</dd>
          {estimate && (
            <>
              <dt className="text-muted-foreground">Browser storage used</dt>
              <dd className="text-right">{formatBytes(estimate.usage)}</dd>
              <dt className="text-muted-foreground">Browser storage quota</dt>
              <dd className="text-right">{formatBytes(estimate.quota)}</dd>
            </>
          )}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
