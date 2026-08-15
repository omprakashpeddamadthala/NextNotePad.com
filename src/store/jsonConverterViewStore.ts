import { create } from "zustand";

interface JsonConverterViewState {
  /** Same on-tab convention as Diff Checker / Regex Tester. Not persisted, not exclusive-handled
   *  here — see `services/specialViews.ts`. */
  open: boolean;
  openJsonConverter: () => void;
  closeJsonConverter: () => void;
}

export const useJsonConverterViewStore = create<JsonConverterViewState>((set) => ({
  open: false,
  openJsonConverter: () => set({ open: true }),
  closeJsonConverter: () => set({ open: false }),
}));
