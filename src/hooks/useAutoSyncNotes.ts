"use client";

import { useEffect, useRef } from "react";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getActiveRepository } from "@/services/storage/activeRepository";
import * as modelRegistry from "@/lib/monaco/modelRegistry";

const AUTO_SYNC_INTERVAL_MS = 5000; // Auto-sync to backend every 5 seconds

/**
 * Background auto-sync hook:
 * Automatically synchronizes all modified / dirty notes to the backend repository
 * every 5 seconds, as well as on window blur / visibility change / page unload.
 */
export function useAutoSyncNotes(): void {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function syncDirtyNotes() {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const { tabs, dirtyTabIds, setDirty } = useTabsStore.getState();
        const { updateNode } = useWorkspaceStore.getState();
        const repo = getActiveRepository();

        for (const tab of tabs) {
          const model = modelRegistry.getModel(tab.fileId);
          if (!model) continue;

          // Check if tab is flagged dirty or if the model value differs from saved value
          const isMarkedDirty = Boolean(dirtyTabIds[tab.id]);
          const isModelDirty = modelRegistry.isDirty(tab.fileId);

          if (!isMarkedDirty && !isModelDirty) continue;

          const content = model.getValue();
          try {
            await repo.writeFileContent(tab.fileId, content);
            modelRegistry.markSaved(tab.fileId, content);
            setDirty(tab.id, false);
            updateNode(tab.fileId, { size: content.length });
          } catch (err) {
            console.warn(`[AutoSync] Background note sync failed for "${tab.fileId}":`, err);
          }
        }
      } finally {
        isSyncingRef.current = false;
      }
    }

    // 1. Continuous 5-second interval timer
    const timerId = window.setInterval(() => {
      void syncDirtyNotes();
    }, AUTO_SYNC_INTERVAL_MS);

    // 2. Immediate flush when tab goes hidden (switching tabs/apps) or unloads
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        void syncDirtyNotes();
      }
    }

    function handleBeforeUnload() {
      void syncDirtyNotes();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
}
