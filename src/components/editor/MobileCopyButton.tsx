"use client";

import { Copy } from "lucide-react";
import { useEditorStatusStore } from "@/store/editorStatusStore";
import { runAction } from "@/services/shortcuts/actionRegistry";

/** Floating Copy button shown on phones while text is selected in the editor. */
export function MobileCopyButton() {
  const selectionLength = useEditorStatusStore((s) => s.selectionLength);

  if (selectionLength === 0) return null;

  return (
    <button
      type="button"
      // Keep the editor focused so the selection survives the tap.
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => runAction("edit.copySelection")}
      className="bg-foreground text-background animate-in fade-in slide-in-from-bottom-2 absolute bottom-4 left-1/2 z-30 flex h-11 whitespace-nowrap -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-medium shadow-lg duration-150 active:scale-[0.97]"
    >
      <Copy className="size-4" />
      Copy {selectionLength} character{selectionLength === 1 ? "" : "s"}
    </button>
  );
}
