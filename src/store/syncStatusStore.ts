import { create } from "zustand";

/**
 * Client-side view of Drive persistence for signed-in users. Writes go straight to Drive via
 * the API, so "saved" only becomes true once Drive acknowledged the write — nothing here is a
 * second source of truth, it only tracks what is still in flight or failed in this tab.
 */
export type SyncPhase = "saved" | "saving" | "offline" | "failed";

interface SyncStatusState {
  /** fileId -> last error message, for saves that have failed and will be retried. */
  failed: Record<string, string>;
  /** fileIds currently being written. */
  saving: Record<string, true>;
  online: boolean;
  markSaving: (fileId: string) => void;
  markSaved: (fileId: string) => void;
  markFailed: (fileId: string, message: string) => void;
  forget: (fileId: string) => void;
  setOnline: (online: boolean) => void;
  reset: () => void;
}

function omit<T extends Record<string, unknown>>(obj: T, key: string): T {
  if (!(key in obj)) return obj;
  const next = { ...obj };
  delete next[key];
  return next;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  failed: {},
  saving: {},
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  markSaving: (fileId) =>
    set((s) => ({ saving: { ...s.saving, [fileId]: true } })),
  markSaved: (fileId) =>
    set((s) => ({
      saving: omit(s.saving, fileId),
      failed: omit(s.failed, fileId),
    })),
  markFailed: (fileId, message) =>
    set((s) => ({
      saving: omit(s.saving, fileId),
      failed: { ...s.failed, [fileId]: message },
    })),
  forget: (fileId) =>
    set((s) => ({
      saving: omit(s.saving, fileId),
      failed: omit(s.failed, fileId),
    })),
  setOnline: (online) => set({ online }),
  reset: () => set({ failed: {}, saving: {} }),
}));

export function selectSyncPhase(
  s: Pick<SyncStatusState, "failed" | "saving" | "online">,
): SyncPhase {
  if (!s.online) return "offline";
  if (Object.keys(s.saving).length > 0) return "saving";
  if (Object.keys(s.failed).length > 0) return "failed";
  return "saved";
}
