import { create } from "zustand";

interface MarkdownPreviewContentState {
  fileId: string | null;
  content: string;
  setContent: (fileId: string, content: string) => void;
}

/** Bridges the primary editor pane's live Monaco content to `MarkdownPreview` without routing
 *  every keystroke through React state on the editor itself — same rationale as `editorInsertStore`. */
export const useMarkdownPreviewContentStore = create<MarkdownPreviewContentState>()((set) => ({
  fileId: null,
  content: "",
  setContent: (fileId, content) => set({ fileId, content }),
}));
