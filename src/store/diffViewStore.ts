import { create } from "zustand";

export interface DiffView {
  leftTabId: string;
  rightTabId: string;
}

interface DiffViewState {
  diffView: DiffView | null;
  openDiff: (leftTabId: string, rightTabId: string) => void;
  closeDiff: () => void;
  swapDiff: () => void;
}

export const useDiffViewStore = create<DiffViewState>((set) => ({
  diffView: null,
  openDiff: (leftTabId, rightTabId) => set({ diffView: { leftTabId, rightTabId } }),
  closeDiff: () => set({ diffView: null }),
  swapDiff: () =>
    set((state) =>
      state.diffView
        ? { diffView: { leftTabId: state.diffView.rightTabId, rightTabId: state.diffView.leftTabId } }
        : state,
    ),
}));
