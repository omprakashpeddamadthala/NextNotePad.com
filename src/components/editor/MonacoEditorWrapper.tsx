"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { handleMonacoBeforeMount } from "@/lib/monaco/setupMonaco";
import { THEME_MODULES } from "@/lib/monaco/themes";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { getActiveRepository } from "@/services/storage/activeRepository";
import { useSettingsStore } from "@/store/settingsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useEditorStatusStore } from "@/store/editorStatusStore";
import { AUTO_SAVE_INTERVALS_MS } from "@/lib/constants/defaultSettings";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { formatActiveEditor } from "@/services/formatting/formatActiveEditor";
import { toggleBookmark, nextBookmarkLine } from "@/lib/monaco/bookmarks";
import { usePendingGotoStore } from "@/store/pendingGotoStore";
import { useMarkdownPreviewContentStore } from "@/store/markdownPreviewContentStore";
import { useMonacoGlobalActions } from "@/hooks/useMonacoGlobalActions";
import { useVoiceDictationTarget } from "@/hooks/useVoiceDictationTarget";

const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

interface MonacoEditorWrapperProps {
  fileId: string;
  tabId: string;
  registerGlobalActions?: boolean;
}

export function MonacoEditorWrapper({ fileId, tabId, registerGlobalActions }: MonacoEditorWrapperProps) {
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const currentFileIdRef = useRef<string | null>(null);
  const currentTabIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);

  const theme = useSettingsStore((s) => s.theme);
  const settings = useSettingsStore((s) => s.settings);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const updateNode = useWorkspaceStore((s) => s.updateNode);
  const setDirty = useTabsStore((s) => s.setDirty);
  const updateViewState = useTabsStore((s) => s.updateViewState);
  const setStatus = useEditorStatusStore((s) => s.setStatus);
  const setSelectedNodeId = useExplorerSelectionStore((s) => s.setSelectedNodeId);

  const file = nodes[fileId];
  const language = file?.type === "file" ? file.language : "plaintext";
  const readOnly = useTabsStore((s) => s.tabs.find((t) => t.id === tabId)?.readOnly ?? false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Reads the autosave setting live (not from a closure) since Monaco listeners are registered once at mount. */
  function scheduleAutoSave(id: string, tid: string) {
    const autoSave = useSettingsStore.getState().settings.autoSave;
    if (autoSave === "off" || autoSave === "manual") return;
    const delay = AUTO_SAVE_INTERVALS_MS[autoSave] ?? 5000;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const model = modelRegistry.getModel(id);
      if (!model) return;
      const value = model.getValue();
      void getActiveRepository()
        .writeFileContent(id, value)
        .then(() => {
          modelRegistry.markSaved(id, value);
          setDirty(tid, false);
          updateNode(id, { size: value.length });
        });
    }, delay);
  }

  function persistViewState(prevTabId: string | null) {
    const editor = editorRef.current;
    if (!editor || !prevTabId) return;
    const state = editor.saveViewState();
    if (!state) return;
    const position = editor.getPosition();
    const selection = editor.getSelection();
    updateViewState(prevTabId, {
      cursor: { lineNumber: position?.lineNumber ?? 1, column: position?.column ?? 1 },
      scrollTop: state.viewState.scrollTop ?? 0,
      selection: selection
        ? {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          }
        : undefined,
    });
  }

  /** Pushes this pane's current content to `MarkdownPreview` if it's showing a markdown file —
   *  primary pane only, so a split-compare secondary pane never fights it for the preview. */
  function pushMarkdownPreviewContent(id: string, model: MonacoEditorNS.ITextModel) {
    if (!registerGlobalActions) return;
    const node = useWorkspaceStore.getState().nodes[id];
    if (node?.type === "file" && node.language === "markdown") {
      useMarkdownPreviewContentStore.getState().setContent(id, model.getValue());
    }
  }

  async function switchToFile(id: string, tid: string) {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    persistViewState(currentTabIdRef.current);

    let model = modelRegistry.getModel(id);
    if (!model) {
      setLoading(true);
      const content = await getActiveRepository().readFileContent(id);
      const node = useWorkspaceStore.getState().nodes[id];
      model = modelRegistry.getOrCreateModel(
        monaco,
        id,
        content,
        node?.type === "file" ? node.language : "plaintext",
      );
      setLoading(false);
    }

    editor.setModel(model);
    setDirty(tid, modelRegistry.isDirty(id));
    pushMarkdownPreviewContent(id, model);

    const tab = useTabsStore.getState().tabs.find((t) => t.id === tid);
    if (tab?.viewState) {
      editor.setPosition(tab.viewState.cursor);
      editor.revealPositionInCenter(tab.viewState.cursor);
    } else {
      editor.revealLine(1);
    }
    // Don't steal focus from an in-progress inline rename in the explorer (e.g. right after "New File").
    if (!useExplorerSelectionStore.getState().renamingNodeId) editor.focus();

    currentFileIdRef.current = id;
    currentTabIdRef.current = tid;

    const totalLines = model.getLineCount();
    const pos = editor.getPosition();
    setStatus({
      line: pos?.lineNumber ?? 1,
      column: pos?.column ?? 1,
      totalLines,
      selectionLength: 0,
      eol: model.getValue().includes("\r\n") ? "CRLF" : "LF",
    });
  }

  useEffect(() => {
    if (editorRef.current) void switchToFile(fileId, tabId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, tabId]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (monaco && file) modelRegistry.setModelLanguage(monaco, fileId, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const pendingGoto = usePendingGotoStore((s) => s.pending);
  useEffect(() => {
    if (!pendingGoto || pendingGoto.fileId !== fileId) return;
    const editor = editorRef.current;
    if (!editor || editor.getModel() !== modelRegistry.getModel(fileId)) return;
    editor.setPosition({ lineNumber: pendingGoto.line, column: pendingGoto.column });
    editor.revealLineInCenter(pendingGoto.line);
    editor.focus();
    usePendingGotoStore.getState().clear();
  }, [pendingGoto, fileId]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const initialModel = editor.getModel();
    void switchToFile(fileId, tabId).then(() => {
      if (initialModel && initialModel !== editorRef.current?.getModel()) initialModel.dispose();
    });

    editor.onDidChangeModelContent(() => {
      const id = currentFileIdRef.current;
      const tid = currentTabIdRef.current;
      if (!id || !tid) return;
      const dirty = modelRegistry.isDirty(id);
      setDirty(tid, dirty);
      if (dirty) scheduleAutoSave(id, tid);
      const model = modelRegistry.getModel(id);
      if (model) pushMarkdownPreviewContent(id, model);
    });

    editor.onDidChangeCursorPosition((e) => {
      const model = editor.getModel();
      const selection = editor.getSelection();
      let selectionLength = 0;
      if (model && selection && !selection.isEmpty()) {
        selectionLength = model.getValueLengthInRange(selection);
      }
      setStatus({
        line: e.position.lineNumber,
        column: e.position.column,
        totalLines: model?.getLineCount() ?? 1,
        selectionLength,
      });
    });

    editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Insert) {
        setStatus({ insertMode: !useEditorStatusStore.getState().insertMode });
      }
    });

    editor.onDidFocusEditorText(() => {
      const node = useWorkspaceStore.getState().nodes[fileId];
      if (node) setSelectedNodeId(node.id);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction("editor.action.copyLinesDownAction")?.run();
    });

    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      formatActiveEditor(editor);
    });

    editor.onMouseDown((e) => {
      if (e.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) return;
      const model = editor.getModel();
      const id = currentFileIdRef.current;
      if (model && id && e.target.position) {
        toggleBookmark(model, id, e.target.position.lineNumber, monaco);
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F2, () => {
      const model = editor.getModel();
      const id = currentFileIdRef.current;
      const pos = editor.getPosition();
      if (model && id && pos) toggleBookmark(model, id, pos.lineNumber, monaco);
    });

    editor.addCommand(monaco.KeyCode.F2, () => {
      const id = currentFileIdRef.current;
      const pos = editor.getPosition();
      if (!id || !pos) return;
      const nextLine = nextBookmarkLine(id, pos.lineNumber);
      if (nextLine) {
        editor.setPosition({ lineNumber: nextLine, column: 1 });
        editor.revealLineInCenter(nextLine);
      }
    });
  };

  useVoiceDictationTarget(editorRef, registerGlobalActions);

  function saveActiveFile() {
    const id = currentFileIdRef.current;
    const tid = currentTabIdRef.current;
    if (!id || !tid) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const model = modelRegistry.getModel(id);
    if (!model) return;
    const value = model.getValue();
    void getActiveRepository()
      .writeFileContent(id, value)
      .then(() => {
        modelRegistry.markSaved(id, value);
        setDirty(tid, false);
        updateNode(id, { size: value.length });
      });
  }

  useMonacoGlobalActions({ registerGlobalActions, editorRef, fileId, tabId, saveActiveFile });

  const themeModule = THEME_MODULES[theme];

  return (
    <div className="relative h-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
          Loading…
        </div>
      )}
      <Editor
        height="100%"
        theme={themeModule.monacoThemeId}
        defaultLanguage={language}
        defaultValue=""
        beforeMount={handleMonacoBeforeMount}
        onMount={handleMount}
        options={{
          fontFamily: settings.fontFamily,
          fontSize: settings.fontSize + settings.zoomLevel,
          tabSize: settings.tabWidth,
          insertSpaces: settings.insertSpaces,
          wordWrap: settings.wordWrap ? "on" : "off",
          minimap: { enabled: settings.showMinimap },
          lineNumbers: settings.showLineNumbers ? "on" : "off",
          renderWhitespace: settings.renderWhitespace ? "all" : "none",
          cursorStyle: settings.cursorStyle,
          autoClosingBrackets: settings.autoClosingBrackets ? "always" : "never",
          readOnly,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          glyphMargin: true,
          // Monaco defaults reserve room for 5-digit line numbers plus wide decoration/glyph
          // padding — reads as a bulky VS Code gutter. Notepad++'s margin is a tight fit to
          // the actual digit count, so trim these to match (see feedback-notepad-authentic-look).
          lineNumbersMinChars: 3,
          lineDecorationsWidth: 6,
        }}
      />
    </div>
  );
}
