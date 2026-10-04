import { useEffect } from "react";
import type { RefObject } from "react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { useEditorInsertStore } from "@/store/editorInsertStore";

function insertDictatedText(editor: MonacoEditorNS.IStandaloneCodeEditor, text: string): void {
  const model = editor.getModel();
  const selection = editor.getSelection();
  if (!model || !selection) return;

  const startPos = selection.getStartPosition();
  const charBefore =
    startPos.column > 1
      ? model.getValueInRange({
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column - 1,
          endLineNumber: startPos.lineNumber,
          endColumn: startPos.column,
        })
      : "";
  const needsLeadingSpace = charBefore !== "" && !/\s/.test(charBefore);

  editor.executeEdits("voice-dictation", [
    { range: selection, text: (needsLeadingSpace ? " " : "") + text + " ", forceMoveMarkers: true },
  ]);
  editor.pushUndoStop();
}

export function useVoiceDictationTarget(
  editorRef: RefObject<MonacoEditorNS.IStandaloneCodeEditor | null>,
  registerGlobalActions: boolean | undefined,
): void {
  useEffect(() => {
    if (!registerGlobalActions) return;
    const insert = (text: string) => {
      const editor = editorRef.current;
      if (editor) insertDictatedText(editor, text);
    };
    useEditorInsertStore.getState().register(insert);
    return () => useEditorInsertStore.getState().unregister(insert);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerGlobalActions]);
}
