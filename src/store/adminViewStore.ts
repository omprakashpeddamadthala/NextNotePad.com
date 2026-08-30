import { create } from "zustand";

interface AdminViewState {
  /** When true, `EditorArea` renders `AdminView` in place of the normal tab content — same
   *  full-page-replaces-editor pattern as `markdownFullPageViewStore`. Deliberately not
   *  persisted: this is a transient UI mode, not workspace state. */
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAdminViewStore = create<AdminViewState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
