import { create } from "zustand";

const SHOW_DELAY_MS = 150;

const SLOW_DELAY_MS = 2000;

interface ApiActivityState {
  pending: number;
  visible: boolean;
  isSlowLoading: boolean;
  currentAction: string | null;
  actions: string[];
  begin: (action?: string) => void;
  end: (action?: string) => void;
}

export const useApiActivityStore = create<ApiActivityState>((set, get) => {
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let slowTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    pending: 0,
    visible: false,
    isSlowLoading: false,
    currentAction: null,
    actions: [],

    begin: (action?: string) => {
      const next = get().pending + 1;
      const nextActions = action ? [...get().actions, action] : get().actions;
      const currentAction = action ?? get().currentAction;

      set({
        pending: next,
        actions: nextActions,
        currentAction,
      });

      if (next === 1) {
        if (showTimer === null) {
          showTimer = setTimeout(() => {
            showTimer = null;
            if (get().pending > 0) set({ visible: true });
          }, SHOW_DELAY_MS);
        }
        if (slowTimer === null) {
          slowTimer = setTimeout(() => {
            slowTimer = null;
            if (get().pending > 0) set({ isSlowLoading: true });
          }, SLOW_DELAY_MS);
        }
      }
    },

    end: (action?: string) => {
      const next = Math.max(0, get().pending - 1);
      let nextActions = get().actions;
      if (action) {
        const idx = nextActions.lastIndexOf(action);
        if (idx !== -1) {
          nextActions = [...nextActions.slice(0, idx), ...nextActions.slice(idx + 1)];
        }
      }
      const nextCurrentAction = nextActions.length > 0 ? nextActions[nextActions.length - 1] : null;

      set({
        pending: next,
        actions: nextActions,
        currentAction: nextCurrentAction,
      });

      if (next === 0) {
        if (showTimer !== null) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        if (slowTimer !== null) {
          clearTimeout(slowTimer);
          slowTimer = null;
        }
        set({ visible: false, isSlowLoading: false });
      }
    },
  };
});

if (typeof window !== "undefined") {
  (window as unknown as { __simulateSlowApiCall?: (action?: string, durationMs?: number) => void }).__simulateSlowApiCall = (
    action = "Syncing with backend...",
    durationMs = 1500,
  ) => {
    useApiActivityStore.getState().begin(action);
    setTimeout(() => {
      useApiActivityStore.getState().end(action);
    }, durationMs);
  };
}
