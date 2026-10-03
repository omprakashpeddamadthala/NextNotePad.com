"use client";

import { AlertTriangle, CloudOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { selectSyncPhase, useSyncStatusStore } from "@/store/syncStatusStore";
import { FLUSH_SYNC_EVENT } from "@/hooks/useAutoSyncNotes";

/** Drive persistence state for signed-in users: silent when everything is saved, otherwise
 *  "Saving…", "Offline — changes queued" or "Sync failed — Retry". */
export function SyncStatusBadge() {
  const authenticated = useAuthStore((s) => s.status === "authenticated");
  const phase = useSyncStatusStore(selectSyncPhase);
  const failedCount = useSyncStatusStore((s) => Object.keys(s.failed).length);

  if (!authenticated || phase === "saved") return null;

  if (phase === "saving") {
    return (
      <span
        className="text-muted-foreground flex h-6 items-center gap-1.5 px-2 text-xs"
        role="status"
      >
        <Loader2 className="size-3.5 animate-spin" /> Saving to Drive…
      </span>
    );
  }

  if (phase === "offline") {
    return (
      <span
        className="flex h-6 items-center gap-1.5 px-2 text-xs text-amber-700 dark:text-amber-400"
        role="status"
      >
        <CloudOff className="size-3.5" /> Offline — changes queued
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-6 gap-1.5 border-amber-500/50 px-2 text-xs text-amber-700 dark:text-amber-400"
      onClick={() => window.dispatchEvent(new Event(FLUSH_SYNC_EVENT))}
    >
      <AlertTriangle className="size-3.5" />
      {failedCount} file{failedCount === 1 ? "" : "s"} not synced — Retry
    </Button>
  );
}
