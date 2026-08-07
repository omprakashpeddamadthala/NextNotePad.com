import { create } from "zustand";

interface EditorStatusState {
  line: number;
  column: number;
  selectionLength: number;
  totalLines: number;
  insertMode: boolean;
  eol: "LF" | "CRLF";
}

interface EditorStatusActions {
  setStatus: (patch: Partial<EditorStatusState>) => void;
  reset: () => void;
}

const initial: EditorStatusState = {
  line: 1,
  column: 1,
  selectionLength: 0,
  totalLines: 1,
  insertMode: true,
  eol: "LF",
};

export const useEditorStatusStore = create<EditorStatusState & EditorStatusActions>()(
  (set) => ({
    ...initial,
    setStatus: (patch) => set(patch),
    reset: () => set(initial),
  }),
);
