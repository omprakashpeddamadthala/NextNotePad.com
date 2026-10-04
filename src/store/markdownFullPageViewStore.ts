import { create } from "zustand";

interface MarkdownFullPageViewState {
  fileId: string | null;
  openFullPage: (fileId: string) => void;
  closeFullPage: () => void;
}

export const useMarkdownFullPageViewStore = create<MarkdownFullPageViewState>((set) => ({
  fileId: null,
  openFullPage: (fileId) => set({ fileId }),
  closeFullPage: () => set({ fileId: null }),
}));
