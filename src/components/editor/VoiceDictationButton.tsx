"use client";

import { Mic } from "lucide-react";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useDictationStore } from "@/store/dictationStore";
import { toggleDictation } from "@/services/dictation/dictationController";
import { DICTATION_HOTKEY_LABEL } from "@/hooks/useDictationHotkey";

export function VoiceDictationButton({
  variant = "toolbar",
}: {
  variant?: "toolbar" | "menu";
}) {
  const listening = useDictationStore((s) => s.phase === "listening");
  const label = listening
    ? "Stop & Insert Voice Typing"
    : `Voice Typing (hold ${DICTATION_HOTKEY_LABEL})`;

  if (variant === "menu") {
    return (
      <DropdownMenuItem onSelect={() => toggleDictation()}>
        <Mic /> {listening ? "Stop Voice Typing" : "Voice Typing"}
      </DropdownMenuItem>
    );
  }

  return (
    <ToolbarButton
      icon={Mic}
      label={label}
      active={listening}
      onClick={() => toggleDictation()}
    />
  );
}
