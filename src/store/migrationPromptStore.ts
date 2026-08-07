import { create } from "zustand";

interface MigrationPromptState {
  open: boolean;
  fileCount: number;
  resolve: ((accepted: boolean) => void) | null;
  /** Opens the prompt and resolves once the user answers Yes/No. */
  request: (fileCount: number) => Promise<boolean>;
  respond: (accepted: boolean) => void;
}

export const useMigrationPromptStore = create<MigrationPromptState>((set, get) => ({
  open: false,
  fileCount: 0,
  resolve: null,
  request: (fileCount) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, fileCount, resolve });
    }),
  respond: (accepted) => {
    get().resolve?.(accepted);
    set({ open: false, resolve: null });
  },
}));
