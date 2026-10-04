import type { editor as MonacoEditorNS } from "monaco-editor";

interface FindController extends MonacoEditorNS.IEditorContribution {
  getState?(): { isRevealed?: boolean } | undefined;
  closeFindWidget?(): void;
}

function getFindController(editor: MonacoEditorNS.ICodeEditor) {
  return editor.getContribution<FindController>("editor.contrib.findController");
}

export function closeFindWidget(editor: MonacoEditorNS.ICodeEditor): void {
  getFindController(editor)?.closeFindWidget?.();
}

export function toggleFindWidget(editor: MonacoEditorNS.ICodeEditor): void {
  const controller = getFindController(editor);
  if (controller?.getState?.()?.isRevealed) controller.closeFindWidget?.();
  else editor.getAction("actions.find")?.run();
}
