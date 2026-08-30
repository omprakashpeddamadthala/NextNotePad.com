"use client";

import { Trash2, RotateCcw, XCircle, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTrashStore } from "@/store/trashStore";
import {
  restoreFromTrash,
  permanentlyDelete,
  emptyTrash,
} from "@/services/fileOperations";

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
      <div className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-xs">
        Recycle bin is empty.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-end border-b p-1.5">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive h-6 text-xs"
            >
              <Trash2 className="size-3.5" /> Empty Recycle Bin
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Empty Recycle Bin?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes all {entries.length} item
                {entries.length === 1 ? "" : "s"} in the recycle bin. This
                can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void emptyTrash()}>
                Empty Recycle Bin
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="np-scrollbar min-h-0 flex-1 overflow-y-auto">
        {entries.map((entry) => {
          const Icon = entry.node.type === "folder" ? Folder : FileText;
          return (
            <div
              key={entry.node.id}
              className="flex items-center gap-2 border-b px-2 py-1.5 text-xs last:border-b-0"
            >
              <Icon className="text-muted-foreground size-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{entry.node.name}</div>
                <div className="text-muted-foreground truncate">
                  {entry.node.path} · deleted{" "}
                  {formatRelativeTime(entry.deletedAt)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Restore ${entry.node.name}`}
                title="Restore"
                onClick={() => restoreFromTrash(entry.node.id)}
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Permanently delete ${entry.node.name}`}
                    title="Delete Permanently"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <XCircle className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Permanently delete &quot;{entry.node.name}&quot;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void permanentlyDelete(entry.node.id)}
                    >
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
