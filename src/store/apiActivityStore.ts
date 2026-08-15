import { create } from "zustand";

/** Requests faster than this never show the bar at all — a local API call that returns in 20ms
 *  would otherwise make it strobe on every keystroke-triggered autosave. */
const SHOW_DELAY_MS = 150;

interface ApiActivityState {
  /** Number of internal API requests currently in flight. */
  pending: number;
  /** Whether the bar should be on screen — `pending > 0` for longer than SHOW_DELAY_MS. */
  visible: boolean;
  begin: () => void;
  end: () => void;
}

/** Tracks in-flight calls to the app's own `/api/*` routes so the UI can show one shared
 *  progress indicator. Deliberately not persisted, and driven entirely from `lib/api/fetchJson`
 *  rather than from components — every request already funnels through that one helper, so no
 *  call site has to remember to report itself. */
export const useApiActivityStore = create<ApiActivityState>((set, get) => {
  // The show-delay timer lives outside React entirely: the component just subscribes to
  // `visible`, so there's no effect racing the counter (and no cascading-render lint trip).
  let showTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    pending: 0,
    visible: false,

    begin: () => {
      const next = get().pending + 1;
      set({ pending: next });
      if (next === 1 && showTimer === null) {
        showTimer = setTimeout(() => {
          showTimer = null;
          // Re-check: the request may have finished during the delay.
          if (get().pending > 0) set({ visible: true });
        }, SHOW_DELAY_MS);
      }
    },

    end: () => {
      const next = Math.max(0, get().pending - 1);
      set({ pending: next });
      if (next === 0) {
        if (showTimer !== null) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        set({ visible: false });
      }
    },
  };
});
