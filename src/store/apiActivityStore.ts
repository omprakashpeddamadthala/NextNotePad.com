import { create } from "zustand";

/** Requests faster than this never show the top bar at all — a local API call that returns in 20ms
 *  would otherwise make it strobe on every keystroke-triggered autosave. */
const SHOW_DELAY_MS = 150;

/** Requests taking longer than this trigger the center loading animation overlay.
 *  Fast backend calls complete silently or with just the subtle top bar.
 *  When a request is taking noticeable time (> 500ms), a centered animation is displayed. */
const SLOW_DELAY_MS = 500;

interface ApiActivityState {
  /** Number of internal API requests currently in flight. */
  pending: number;
  /** Whether the top bar should be on screen — `pending > 0` for longer than SHOW_DELAY_MS. */
  visible: boolean;
  /** Whether the center animation should be displayed — `pending > 0` for longer than SLOW_DELAY_MS. */
  isSlowLoading: boolean;
  /** Currently active action description (e.g. "Saving file", "Syncing workspace"). */
  currentAction: string | null;
  /** List of all in-flight action descriptions. */
  actions: string[];
  begin: (action?: string) => void;
  end: (action?: string) => void;
}

/** Tracks in-flight calls to the app's own `/api/*` routes so the UI can show one shared
 *  progress indicator and center loading animation when slow. Driven from `lib/api/fetchJson`. */
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

// Expose testing hook for dev / browser validation
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
