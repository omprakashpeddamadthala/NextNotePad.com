import { create } from "zustand";

interface RegexTesterViewState {
  /** When true, `EditorArea` renders `RegexTesterView` in place of the normal tab content — same
   *  on-tab convention as Diff Checker. Deliberately not persisted: a scratch test, not
   *  workspace state. Mutual exclusivity with the other special views is handled by the callers
   *  that open each one (see `services/specialViews.ts`), not here. */
  open: boolean;
  openRegexTester: () => void;
  closeRegexTester: () => void;
}

export const useRegexTesterViewStore = create<RegexTesterViewState>((set) => ({
  open: false,
  openRegexTester: () => set({ open: true }),
  closeRegexTester: () => set({ open: false }),
}));
