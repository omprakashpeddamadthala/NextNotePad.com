import { create } from "zustand";

type DialogName = "commandPalette" | "quickOpen" | "settings" | "about" | "exportImport" | "workspaceStats";

interface DialogState {
  open: Record<DialogName, boolean>;
}

interface DialogActions {
  openDialog: (name: DialogName) => void;
  closeDialog: (name: DialogName) => void;
  setDialogOpen: (name: DialogName, open: boolean) => void;
}

const initialOpen: Record<DialogName, boolean> = {
  commandPalette: false,
  quickOpen: false,
  settings: false,
  about: false,
  exportImport: false,
  workspaceStats: false,
};

export const useDialogStore = create<DialogState & DialogActions>()((set) => ({
  open: initialOpen,
  openDialog: (name) => set((s) => ({ open: { ...s.open, [name]: true } })),
  closeDialog: (name) => set((s) => ({ open: { ...s.open, [name]: false } })),
  setDialogOpen: (name, value) => set((s) => ({ open: { ...s.open, [name]: value } })),
}));
