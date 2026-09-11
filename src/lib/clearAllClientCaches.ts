/**
 * Clears all client-side caches that hold workspace / session data so the
 * next login always gets a fully fresh state from the server.
 *
 * Deliberately preserves `np-settings` (theme, font size, etc.) because those
 * are pure user preferences with no server-side counterpart to re-sync from.
 *
 * Called during the daily session reset in `useAuthBootstrap`.
 */

import { clear as idbClear, createStore } from "idb-keyval";

/** localStorage keys that hold workspace / session state — cleared on daily reset. */
const WORKSPACE_LS_KEYS = [
  "np-workspace",
  "np-tabs",
  "np-recent",
] as const;

/**
 * Wipes all persisted workspace localStorage keys and the IndexedDB file-content
 * store. Safe to call before a forced re-login.
 */
export async function clearAllClientCaches(): Promise<void> {
  // 1. Remove workspace-related localStorage keys (settings intentionally kept).
  if (typeof window !== "undefined") {
    for (const key of WORKSPACE_LS_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore — quota / private-mode errors
      }
    }
  }

  // 2. Clear the IndexedDB object store that holds file content.
  //    Mirrors the store created in indexedDbService.ts.
  try {
    const fileContentStore = createStore("notepad-web-files", "contents");
    await idbClear(fileContentStore);
  } catch {
    // IDB may be unavailable (private mode, browser quirks) — non-fatal.
  }
}
