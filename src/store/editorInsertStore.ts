import { create } from "zustand";

interface EditorInsertState {
  insertFn: ((text: string) => void) | null;
  register: (fn: (text: string) => void) => void;
  unregister: (fn: (text: string) => void) => void;
}

export const useEditorInsertStore = create<EditorInsertState>()((set, get) => ({
  insertFn: null,
  register: (fn) => set({ insertFn: fn }),
  unregister: (fn) => {
    if (get().insertFn === fn) set({ insertFn: null });
  },
}));
