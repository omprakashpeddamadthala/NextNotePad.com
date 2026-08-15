import { create } from "zustand";

interface MarkdownFullPageViewState {
  /** When set, `EditorArea` renders `MarkdownFullPageView` (the rendered markdown, full-width,
   *  no editor beside it) in place of the normal tab content — deliberately not persisted, same
   *  as `diffViewStore`'s `diffView`. */
  fileId: string | null;
  openFullPage: (fileId: string) => void;
  closeFullPage: () => void;
}

export const useMarkdownFullPageViewStore = create<MarkdownFullPageViewState>((set) => ({
  fileId: null,
  openFullPage: (fileId) => set({ fileId }),
  closeFullPage: () => set({ fileId: null }),
}));
