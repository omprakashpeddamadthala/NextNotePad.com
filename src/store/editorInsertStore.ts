import { create } from "zustand";

/**
 * A stretch of dictated text in the editor that is rewritten in place: first
 * as the live transcript, then the final words, then the AI-polished version.
 */
export interface LiveInsert {
  /** Shows provisional text while the user is still speaking. */
  update: (text: string) => void;
  /** Writes the final spoken text and closes the undo step. */
  commit: (text: string) => void;
  /**
   * Swaps the committed text for a corrected version as its own undo step.
   * Returns false (and changes nothing) if the user edited it meanwhile.
   */
  replace: (text: string) => boolean;
  /** Removes whatever was inserted (used when dictation is cancelled). */
  remove: () => void;
  /** Marks the text as waiting for AI cleanup. */
  setPending: (pending: boolean) => void;
  /** Drops tracking and styling; leaves the text in place. */
  dispose: () => void;
}

type BeginLiveInsert = () => LiveInsert | null;

interface EditorInsertState {
  beginLiveInsert: BeginLiveInsert | null;
  register: (fn: BeginLiveInsert) => void;
  unregister: (fn: BeginLiveInsert) => void;
}

export const useEditorInsertStore = create<EditorInsertState>()((set, get) => ({
  beginLiveInsert: null,
  register: (fn) => set({ beginLiveInsert: fn }),
  unregister: (fn) => {
    if (get().beginLiveInsert === fn) set({ beginLiveInsert: null });
  },
}));
