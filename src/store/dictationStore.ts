import { create } from "zustand";

type DictationPhase = "idle" | "listening" | "polishing";

/** "hold": push-to-talk, ends on key release. "handsfree": ends on demand. */
export type DictationMode = "hold" | "handsfree";

interface DictationState {
  phase: DictationPhase;
  mode: DictationMode;
  /** Finalised speech so far in this utterance. */
  finalText: string;
  /** Words the recognizer is still unsure about. */
  interimText: string;
  set: (patch: Partial<Omit<DictationState, "set">>) => void;
}

export const useDictationStore = create<DictationState>()((set) => ({
  phase: "idle",
  mode: "handsfree",
  finalText: "",
  interimText: "",
  set: (patch) => set(patch),
}));
