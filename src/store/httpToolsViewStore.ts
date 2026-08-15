import { create } from "zustand";

interface HttpToolsViewState {
  /** When true, `EditorArea` renders `HttpToolsView` in place of the normal tab content — same
   *  "on-tab, not a popup" convention `DiffTabView` uses. Deliberately not persisted: a
   *  request/response is a transient scratch session, not workspace state. Mutual exclusivity
   *  with the diff view (both take over the whole editor area) is handled by the callers that
   *  open each one, not here — see `services/diffChecker.ts` and the `tools.httpClient` action. */
  open: boolean;
  openHttpTools: () => void;
  closeHttpTools: () => void;
}

export const useHttpToolsViewStore = create<HttpToolsViewState>((set) => ({
  open: false,
  openHttpTools: () => set({ open: true }),
  closeHttpTools: () => set({ open: false }),
}));
