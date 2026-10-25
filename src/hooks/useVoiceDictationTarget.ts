import { useEffect } from "react";
import type { RefObject } from "react";
import type { editor as MonacoEditorNS, IRange } from "monaco-editor";
import { useEditorInsertStore, type LiveInsert } from "@/store/editorInsertStore";

const SOURCE = "voice-dictation";
// TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges — typing right next to
// the dictated text must not become part of it.
const NEVER_GROWS = 1;

/**
 * Inserts dictated text at the cursor and keeps rewriting that same range as
 * the transcript changes. A decoration tracks the range, so it stays correct
 * if the user edits elsewhere in the file meanwhile.
 */
function beginLiveInsert(editor: MonacoEditorNS.IStandaloneCodeEditor): LiveInsert | null {
  const model = editor.getModel();
  const selection = editor.getSelection();
  if (!model || !selection) return null;

  const start = selection.getStartPosition();
  const charBefore =
    start.column > 1
      ? model.getValueInRange({
          startLineNumber: start.lineNumber,
          startColumn: start.column - 1,
          endLineNumber: start.lineNumber,
          endColumn: start.column,
        })
      : "";
  const lead = charBefore !== "" && !/\s/.test(charBefore) ? " " : "";

  const decorations = editor.createDecorationsCollection([
    { range: selection, options: { stickiness: NEVER_GROWS } },
  ]);
  let className = "nnp-dictation-live";
  let written = "";
  let alive = true;

  const currentRange = (): IRange | null => {
    if (!alive || editor.getModel() !== model) return null;
    return decorations.getRange(0);
  };

  const write = (text: string): boolean => {
    const range = currentRange();
    if (!range) return false;
    const startOffset = model.getOffsetAt({
      lineNumber: range.startLineNumber,
      column: range.startColumn,
    });
    editor.executeEdits(SOURCE, [{ range, text, forceMoveMarkers: true }]);
    const s = model.getPositionAt(startOffset);
    const e = model.getPositionAt(startOffset + text.length);
    const next = {
      startLineNumber: s.lineNumber,
      startColumn: s.column,
      endLineNumber: e.lineNumber,
      endColumn: e.column,
    };
    decorations.set([
      { range: next, options: { stickiness: NEVER_GROWS, inlineClassName: className } },
    ]);
    editor.setPosition(e);
    editor.revealPosition(e);
    written = text;
    return true;
  };

  const restyle = (name: string) => {
    className = name;
    const range = currentRange();
    if (range) {
      decorations.set([
        { range, options: { stickiness: NEVER_GROWS, inlineClassName: name || undefined } },
      ]);
    }
  };

  // Live updates and the final text form one undo step.
  editor.pushUndoStop();

  return {
    update: (text) => {
      write(text ? lead + text + " " : "");
    },
    commit: (text) => {
      className = "";
      write(lead + text + " ");
      editor.pushUndoStop();
    },
    replace: (text) => {
      const range = currentRange();
      if (!range || model.getValueInRange(range) !== written) return false;
      editor.pushUndoStop();
      write(lead + text + " ");
      editor.pushUndoStop();
      return true;
    },
    remove: () => {
      write("");
      editor.pushUndoStop();
    },
    setPending: (pending) => restyle(pending ? "nnp-dictation-pending" : ""),
    dispose: () => {
      alive = false;
      decorations.clear();
    },
  };
}

export function useVoiceDictationTarget(
  editorRef: RefObject<MonacoEditorNS.IStandaloneCodeEditor | null>,
  registerGlobalActions: boolean | undefined,
): void {
  useEffect(() => {
    if (!registerGlobalActions) return;
    const begin = () => {
      const editor = editorRef.current;
      return editor ? beginLiveInsert(editor) : null;
    };
    useEditorInsertStore.getState().register(begin);
    return () => useEditorInsertStore.getState().unregister(begin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerGlobalActions]);
}
