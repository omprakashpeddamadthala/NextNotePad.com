import { create } from "zustand";

export type LocalMirrorStatus =
  | "unsupported"
  | "off"
  | "needs-permission"
  | "syncing"
  | "idle"
  | "error";

interface LocalMirrorState {
  status: LocalMirrorStatus;
  folderName: string | null;
  lastSyncedAt: number | null;
  fileCount: number;
  progress: { done: number; total: number } | null;
  failedCount: number;
  error: string | null;
  set: (patch: Partial<Omit<LocalMirrorState, "set">>) => void;
}

export const useLocalMirrorStore = create<LocalMirrorState>()((set) => ({
  status: "off",
  folderName: null,
  lastSyncedAt: null,
  fileCount: 0,
  progress: null,
  failedCount: 0,
  error: null,
  set: (patch) => set(patch),
}));
