import { create } from "zustand";

export interface DiffView {
  leftTabId: string;
  rightTabId: string;
}

interface DiffViewState {
  /** When set, `EditorArea` renders `DiffTabView` (two open tabs side by side on Monaco's diff
   *  editor) in place of the normal tab content — deliberately not persisted, since a comparison
   *  is a transient view, not workspace state. */
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
