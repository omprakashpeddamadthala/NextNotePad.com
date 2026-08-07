"use client";

import { Trash2, RotateCcw, XCircle, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrashStore } from "@/store/trashStore";
import { restoreFromTrash, permanentlyDelete, emptyTrash } from "@/services/fileOperations";

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecycleBinPanel() {
  const entries = useTrashStore((s) => s.entries);

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
        Recycle bin is empty.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-end border-b p-1.5">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs text-destructive hover:text-destructive"
          onClick={() => void emptyTrash()}
        >
          <Trash2 className="size-3.5" /> Empty Recycle Bin
        </Button>
      </div>
      <div className="np-scrollbar min-h-0 flex-1 overflow-y-auto">
        {entries.map((entry) => {
          const Icon = entry.node.type === "folder" ? Folder : FileText;
          return (
            <div
              key={entry.node.id}
              className="flex items-center gap-2 border-b px-2 py-1.5 text-xs last:border-b-0"
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{entry.node.name}</div>
                <div className="truncate text-muted-foreground">
                  {entry.node.path} · deleted {formatRelativeTime(entry.deletedAt)}
                </div>
              </div>
              <button
                type="button"
                aria-label={`Restore ${entry.node.name}`}
                title="Restore"
                onClick={() => restoreFromTrash(entry.node.id)}
                className="shrink-0 rounded-sm p-1 hover:bg-[var(--np-menu-hover)]"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Permanently delete ${entry.node.name}`}
                title="Delete Permanently"
                onClick={() => void permanentlyDelete(entry.node.id)}
                className="shrink-0 rounded-sm p-1 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
