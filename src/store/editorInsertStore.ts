import { create } from "zustand";

interface EditorInsertState {
  insertFn: ((text: string) => void) | null;
  register: (fn: (text: string) => void) => void;
  unregister: (fn: (text: string) => void) => void;
}

/**
 * Lets a component outside the editor pane (e.g. the toolbar's mic button) insert text at the
 * current cursor position. A plain callback ref rather than pending-state-consumed-via-effect
 * (contrast `pendingGotoStore`) because voice dictation fires many results in quick succession —
 * routing each through a state update + effect would add latency and re-renders we don't want.
 */
export const useEditorInsertStore = create<EditorInsertState>()((set, get) => ({
  insertFn: null,
  register: (fn) => set({ insertFn: fn }),
  unregister: (fn) => {
    if (get().insertFn === fn) set({ insertFn: null });
  },
}));
