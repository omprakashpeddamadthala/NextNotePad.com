import { create } from "zustand";

type AdminSection = "users" | "ai-config";

interface AdminViewState {
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

