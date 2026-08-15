import { create } from "zustand";

interface LockDialogState {
  open: boolean;
  mode: "lock" | "unlock";
  targetId: string | null;
  openLockDialog: (nodeId: string) => void;
  openUnlockDialog: (nodeId: string) => void;
  closeLockDialog: () => void;
}

/** Transient — never persisted, same as the other on-demand dialog/view stores. */
export const useLockDialogStore = create<LockDialogState>((set) => ({
  open: false,
  mode: "lock",
  targetId: null,
  openLockDialog: (nodeId) => set({ open: true, mode: "lock", targetId: nodeId }),
  openUnlockDialog: (nodeId) => set({ open: true, mode: "unlock", targetId: nodeId }),
  closeLockDialog: () => set({ open: false, targetId: null }),
}));
