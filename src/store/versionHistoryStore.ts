import { create } from "zustand";

interface VersionHistoryState {
  /** The note whose history is open, or null when the window is closed. */
  fileId: string | null;
  openFor: (fileId: string) => void;
  close: () => void;
}

export const useVersionHistoryStore = create<VersionHistoryState>((set) => ({
  fileId: null,
  openFor: (fileId) => set({ fileId }),
  close: () => set({ fileId: null }),
}));
