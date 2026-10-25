"use client";

import { useState } from "react";
import { FolderSync, FolderOpen, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useLocalMirrorStore, type LocalMirrorStatus } from "@/store/localMirrorStore";
import {
  chooseLocalMirrorFolder,
  disableLocalMirror,
  reconnectLocalMirror,
  syncLocalMirrorNow,
} from "@/services/storage/localMirror/localMirrorService";

const STATUS_LABEL: Record<LocalMirrorStatus, string> = {
  unsupported: "Not supported",
  off: "Off",
  "needs-permission": "Paused",
  syncing: "Syncing",
  idle: "Up to date",
  error: "Needs attention",
};

export function LocalFolderSyncSection() {
  const signedIn = useAuthStore((s) => s.status === "authenticated");
  const { status, folderName, lastSyncedAt, fileCount, progress, error } =
    useLocalMirrorStore();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error("Local folder sync failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const connected = status === "idle" || status === "syncing" || status === "error";

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
      <div className="mb-4 flex items-center gap-2.5 pb-3 border-b border-border/60">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FolderSync className="size-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">Local Folder Copy</h4>
          <p className="text-xs text-muted-foreground">
            Keep a copy of your Google Drive notes in a folder on this computer
          </p>
        </div>
        {signedIn && status !== "unsupported" && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>

      {!signedIn ? (
        <p className="text-xs text-muted-foreground">
          Sign in with Google to copy your notes to a local folder.
        </p>
      ) : status === "unsupported" ? (
        <p className="text-xs text-muted-foreground">
          Your browser can&apos;t write to local folders. Use Chrome or Edge on a desktop
          computer to turn this on.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-border/50 bg-background/50 p-3.5 space-y-1">
            <p className="text-sm font-medium">
              {folderName ? `Folder: ${folderName}` : "No folder selected"}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === "syncing" && progress
                ? `Copying ${progress.done} of ${progress.total} changes…`
                : status === "needs-permission"
                  ? "The browser needs your permission again before it can update this folder."
                  : connected
                    ? `${fileCount} file(s) copied${lastSyncedAt ? ` · last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : ""}`
                    : "Notes are saved as plain files you can open with any text editor, even when NextNotePad is unavailable."}
            </p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {status === "needs-permission" ? (
              <Button size="sm" disabled={busy} onClick={() => run(reconnectLocalMirror)}>
                <FolderOpen className="size-3.5" /> Allow access
              </Button>
            ) : (
              <Button size="sm" disabled={busy} onClick={() => run(chooseLocalMirrorFolder)}>
                <FolderOpen className="size-3.5" />
                {folderName ? "Change folder" : "Choose folder"}
              </Button>
            )}
            {connected && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy || status === "syncing"}
                onClick={() => syncLocalMirrorNow()}
              >
                <RefreshCw className="size-3.5" /> Sync now
              </Button>
            )}
            {folderName && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => run(disableLocalMirror)}
              >
                <Unplug className="size-3.5" /> Stop syncing
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Copies go one way, from Drive to the folder. Edits made directly in the folder
            are not uploaded yet. Deleted notes move to <code>.nextnotepad/trash</code>,
            and locked notes are never written to disk.
          </p>
        </div>
      )}
    </div>
  );
}
