import { useRef } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { useRegisterAction } from "@/hooks/useRegisterAction";
import { correctText } from "@/services/ai/correctText";
import { ApiError } from "@/lib/api/fetchJson";

interface UseMonacoAiActionsParams {
  registerGlobalActions: boolean | undefined;
  editorRef: RefObject<MonacoEditorNS.IStandaloneCodeEditor | null>;
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 503)
      return "AI correction isn't configured on this server yet.";
    if (err.status === 429)
      return "AI is rate-limited right now — try again shortly.";
    return err.message;
  }
  return "Couldn't reach the AI service.";
}

/** Wires the Tools-menu "Fix Grammar & Spelling (AI)" command into the shared action registry.
 *  Same selection-or-document convention as the other text tools, but async and network-backed —
 *  split out of `useMonacoTextToolActions` since it needs its own in-flight guard and can fail
 *  for reasons (rate limits, missing server config) the pure transforms never hit. */
export function useMonacoAiActions({
  registerGlobalActions,
  editorRef,
}: UseMonacoAiActionsParams): void {
  const isRunning = useRef(false);

  useRegisterAction(
    "tools.ai.fixGrammar",
    () => {
      if (!registerGlobalActions || !editorRef.current) return;
      if (isRunning.current) {
        toast.info("Already correcting text — hang tight.");
        return;
      }

      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) return;

      const selection = editor.getSelection();
      const hasSelection = Boolean(selection && !selection.isEmpty());
      const range =
        hasSelection && selection ? selection : model.getFullModelRange();
      const original = model.getValueInRange(range);
      if (!original.trim()) {
        toast.error(
          "Nothing to correct — select some text or open a file with content.",
        );
        return;
      }

      isRunning.current = true;
      const toastId = toast.loading("Asking AI to correct this text…");

      // Grows/shrinks to always span exactly what's been streamed in so far, starting from the
      // original range's fixed start — each chunk replaces the previous chunk's text rather than
      // appending after it.
      const startOffset = model.getOffsetAt(range.getStartPosition());
      let currentRange: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
      } = range;
      let streamed = false;

      void correctText(original, (accumulated) => {
        streamed = true;
        editor.executeEdits("tools.ai", [
          { range: currentRange, text: accumulated },
        ]);
        const endPos = model.getPositionAt(startOffset + accumulated.length);
        currentRange = {
          startLineNumber: range.startLineNumber,
          startColumn: range.startColumn,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        };
      })
        .then((corrected) => {
          if (corrected.trim() === original.trim() && corrected !== original) {
            // Streaming can drift on trivial whitespace even when no real correction was made
            // (the system prompt asks the model to preserve formatting exactly, but it's not
            // guaranteed) — snap back to the exact original text rather than leave that drift.
            editor.executeEdits("tools.ai", [{ range: currentRange, text: original }]);
          }
          editor.pushUndoStop();
          if (corrected.trim() === original.trim()) {
            toast.success("No corrections needed.", { id: toastId });
          } else {
            toast.success("Text corrected.", { id: toastId });
          }
        })
        .catch((err: unknown) => {
          if (streamed) {
            // Restore whatever partial/garbled text the failed stream left behind.
            editor.executeEdits("tools.ai", [{ range: currentRange, text: original }]);
            editor.pushUndoStop();
          }
          toast.error(describeError(err), { id: toastId });
        })
        .finally(() => {
          isRunning.current = false;
        });
    },
    [registerGlobalActions],
  );
}
