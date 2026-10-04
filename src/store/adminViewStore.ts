import { create } from "zustand";

export type AdminSection = "users" | "ai-config";

interface AdminViewState {
  /** When true, `EditorArea` renders `AdminView` in place of the normal tab content — same
   *  full-page-replaces-editor pattern as `markdownFullPageViewStore`. Deliberately not
   *  persisted: this is a transient UI mode, not workspace state. */
  isOpen: boolean;
  section: AdminSection;
  open: (section?: AdminSection) => void;
  close: () => void;
  setSection: (section: AdminSection) => void;
}

export const useAdminViewStore = create<AdminViewState>((set) => ({
  isOpen: false,
  section: "users",
  open: (section = "users") => set({ isOpen: true, section }),
  close: () => set({ isOpen: false }),
  setSection: (section) => set({ section }),
}));

