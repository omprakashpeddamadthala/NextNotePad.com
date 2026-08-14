import type { RefObject } from "react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { useTabsStore } from "@/store/tabsStore";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { duplicateNode } from "@/services/fileOperations";
import { formatActiveEditor } from "@/services/formatting/formatActiveEditor";
import { useRegisterAction } from "@/hooks/useRegisterAction";

interface UseMonacoGlobalActionsParams {
  registerGlobalActions: boolean | undefined;
  editorRef: RefObject<MonacoEditorNS.IStandaloneCodeEditor | null>;
  fileId: string;
  tabId: string;
  saveActiveFile: () => void;
}

/** Wires every menu/shortcut command that maps to a built-in Monaco editor action (cut, copy,
 *  paste, undo, redo, find, replace, format, ...) into the shared action registry. Split out of
 *  `MonacoEditorWrapper` since it's pure "menu command -> Monaco API call" glue, not editor
 *  lifecycle management — every mounted pane calls this hook, but only the one with
 *  `registerGlobalActions` set actually runs anything (a split-view secondary pane is a no-op). */
export function useMonacoGlobalActions({
  registerGlobalActions,
  editorRef,
  fileId,
  tabId,
  saveActiveFile,
}: UseMonacoGlobalActionsParams): void {
  const setSelectedNodeId = useExplorerSelectionStore((s) => s.setSelectedNodeId);
  const setRenamingNodeId = useExplorerSelectionStore((s) => s.setRenamingNodeId);

  useRegisterAction(
    "file.save",
    () => {
      if (registerGlobalActions) saveActiveFile();
    },
    [registerGlobalActions, fileId, tabId],
  );

  useRegisterAction(
    "file.saveAs",
    () => {
      if (!registerGlobalActions) return;
      saveActiveFile();
      void duplicateNode(fileId).then((newId) => {
        if (!newId) return;
        setSelectedNodeId(newId);
        setRenamingNodeId(newId);
        useTabsStore.getState().openTab(newId);
      });
    },
    [registerGlobalActions, fileId],
  );

  useRegisterAction(
    "edit.cut",
    () => {
      if (registerGlobalActions) editorRef.current?.getAction("editor.action.clipboardCutAction")?.run();
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "edit.copy",
    () => {
      if (registerGlobalActions) editorRef.current?.getAction("editor.action.clipboardCopyAction")?.run();
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "edit.paste",
    () => {
      if (registerGlobalActions) editorRef.current?.getAction("editor.action.clipboardPasteAction")?.run();
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "edit.selectAll",
    () => {
      if (!registerGlobalActions) return;
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (editor && model) editor.setSelection(model.getFullModelRange());
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "edit.deleteLine",
    () => {
      if (registerGlobalActions) editorRef.current?.getAction("editor.action.deleteLines")?.run();
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "edit.duplicateLine",
    () => {
      if (registerGlobalActions) editorRef.current?.getAction("editor.action.copyLinesDownAction")?.run();
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "edit.undo",
    () => {
      if (registerGlobalActions) editorRef.current?.trigger("menu", "undo", null);
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "edit.redo",
    () => {
      if (registerGlobalActions) editorRef.current?.trigger("menu", "redo", null);
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "search.find",
    () => {
      if (registerGlobalActions) editorRef.current?.getAction("actions.find")?.run();
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "search.replace",
    () => {
      if (registerGlobalActions) editorRef.current?.getAction("editor.action.startFindReplaceAction")?.run();
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "search.goToLine",
    () => {
      if (registerGlobalActions) editorRef.current?.getAction("editor.action.gotoLine")?.run();
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "edit.formatDocument",
    () => {
      if (registerGlobalActions && editorRef.current) formatActiveEditor(editorRef.current);
    },
    [registerGlobalActions],
  );
}
