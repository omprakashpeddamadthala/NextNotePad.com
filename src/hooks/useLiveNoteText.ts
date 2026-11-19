import { useEffect, useState } from "react";
import type { IDisposable, editor as MonacoEditorNS } from "monaco-editor";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { readNoteContent } from "@/services/copyNote";

/**
 * A note's text that follows the editor as you type (after a short pause).
 * Falls back to the saved copy until the editor has loaded the note.
 * Returns null while loading; `failed` is true if it couldn't be read.
 */
export function useLiveNoteText(fileId: string, delayMs = 300): { text: string | null; failed: boolean } {
  const [state, setState] = useState<{ fileId: string; text: string } | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let subscription: IDisposable | null = null;
    const publish = (text: string) => {
      if (!cancelled) setState({ fileId, text });
    };

    function follow(model: MonacoEditorNS.ITextModel) {
      subscription?.dispose();
      void Promise.resolve().then(() => publish(model.getValue()));
      subscription = model.onDidChangeContent(() => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => publish(model.getValue()), delayMs);
      });
    }

    const existing = modelRegistry.getModel(fileId);
    const stopWaiting = modelRegistry.onModelCreated((id, model) => {
      if (id === fileId) follow(model);
    });
    if (existing) {
      follow(existing);
    } else {
      readNoteContent(fileId)
        .then((text) => {
          if (!modelRegistry.getModel(fileId)) publish(text);
        })
        .catch(() => !cancelled && setFailedId(fileId));
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      subscription?.dispose();
      stopWaiting();
    };
  }, [fileId, delayMs]);

  return {
    text: state?.fileId === fileId ? state.text : null,
    failed: failedId === fileId,
  };
}
