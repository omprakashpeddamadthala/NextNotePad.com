import { create } from "zustand";

export type DialogName = "commandPalette" | "quickOpen" | "settings" | "about" | "exportImport" | "workspaceStats";

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

/** Single home for "is this dialog open" — one boolean per dialog under `open`, rather than a
 *  separate top-level flag + setter pair per dialog (as these used to live in uiStore). Adding a
 *  new dialog means adding one key to DialogName instead of a field, an initial value, a setter
 *  type, and a setter implementation. */
export const useDialogStore = create<DialogState & DialogActions>()((set) => ({
  open: initialOpen,
  openDialog: (name) => set((s) => ({ open: { ...s.open, [name]: true } })),
  closeDialog: (name) => set((s) => ({ open: { ...s.open, [name]: false } })),
  setDialogOpen: (name, value) => set((s) => ({ open: { ...s.open, [name]: value } })),
}));
