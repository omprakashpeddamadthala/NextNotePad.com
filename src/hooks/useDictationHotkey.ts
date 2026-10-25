"use client";

import { useEffect } from "react";
import { useDictationStore } from "@/store/dictationStore";
import {
  cancelDictation,
  finishDictation,
  startDictation,
} from "@/services/dictation/dictationController";

export const DICTATION_HOTKEY_LABEL = "Alt+V";

/** A press shorter than this is a tap (hands-free) rather than a hold. */
const TAP_MAX_MS = 350;

/**
 * Alt+V is the main shortcut. Ctrl+Shift+Space also works, but Windows input
 * switchers and other apps often capture it before the browser sees it.
 * Each entry lists the keys whose release ends a hold.
 */
const HOTKEYS: Array<{ match: (e: KeyboardEvent) => boolean; releaseKeys: string[] }> = [
  {
    match: (e) => e.code === "KeyV" && e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey,
    releaseKeys: ["KeyV", "AltLeft", "AltRight"],
  },
  {
    match: (e) => e.code === "Space" && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey,
    releaseKeys: [
      "Space",
      "ControlLeft",
      "ControlRight",
      "MetaLeft",
      "MetaRight",
      "ShiftLeft",
      "ShiftRight",
    ],
  },
];

/**
 * Wispr Flow-style hotkey: hold Alt+V to talk and release to
 * insert; tap it to talk hands-free and tap again (or press Enter) to insert.
 * Esc cancels. Listens in the capture phase so Monaco doesn't see the keys.
 */
export function useDictationHotkey(): void {
  useEffect(() => {
    let pressedAt = 0;
    let releaseKeys: string[] = [];

    const swallow = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const { phase, mode } = useDictationStore.getState();

      const hotkey = HOTKEYS.find((h) => h.match(e));
      if (hotkey) {
        swallow(e);
        if (e.repeat) return;
        if (phase !== "listening") {
          if (startDictation("hold")) {
            pressedAt = Date.now();
            releaseKeys = hotkey.releaseKeys;
          }
        } else if (phase === "listening" && mode === "handsfree") {
          finishDictation();
        }
        return;
      }

      if (phase === "idle") return;
      if (e.key === "Escape") {
        swallow(e);
        cancelDictation();
      } else if (e.key === "Enter" && phase === "listening" && mode === "handsfree") {
        swallow(e);
        finishDictation();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const { phase, mode, set } = useDictationStore.getState();
      if (phase !== "listening" || mode !== "hold") return;
      if (!releaseKeys.includes(e.code)) return;
      // Stop Chrome treating the Alt release as "focus the browser menu".
      e.preventDefault();
      if (Date.now() - pressedAt < TAP_MAX_MS) set({ mode: "handsfree" });
      else finishDictation();
    };

    // Releasing the keys in another window would otherwise leave us recording.
    const onBlur = () => {
      const { phase, mode } = useDictationStore.getState();
      if (phase === "listening" && mode === "hold") finishDictation();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}
