import { create } from "zustand";

interface MarkdownPreviewContentState {
  fileId: string | null;
  content: string;
  setContent: (fileId: string, content: string) => void;
}

export const useMarkdownPreviewContentStore = create<MarkdownPreviewContentState>()((set) => ({
  fileId: null,
  content: "",
  setContent: (fileId, content) => set({ fileId, content }),
}));
