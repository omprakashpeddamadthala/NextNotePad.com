"use client";

import { Mic } from "lucide-react";
import { toast } from "sonner";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { useSpeechDictation } from "@/hooks/useSpeechDictation";
import { useEditorInsertStore } from "@/store/editorInsertStore";

/** Toggles continuous voice-to-text dictation into the active editor pane. */
export function VoiceDictationButton() {
  const { start, stop, listening, isSupported } = useSpeechDictation({
    onResult: (text) => useEditorInsertStore.getState().insertFn?.(text),
    onError: (message) => toast.error(`Voice input error: ${message}`),
  });

  function handleClick() {
    if (!isSupported) {
      toast.error("Voice typing isn't supported in this browser — try Chrome or Edge.");
      return;
    }
    if (listening) {
      stop();
      return;
    }
    if (!useEditorInsertStore.getState().insertFn) {
      toast.error("Open a file first to dictate into it.");
      return;
    }
    start();
  }

  return (
    <ToolbarButton
      icon={Mic}
      label={listening ? "Stop Voice Typing" : "Voice Typing"}
      active={listening}
      onClick={handleClick}
    />
  );
}
