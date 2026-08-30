"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { SkeletonText } from "@/components/ui/skeleton";
import { LoadFailure } from "@/components/ui/load-failure";
import { LockedFileOverlay } from "./LockedFileOverlay";
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
import { runAction } from "@/services/shortcuts/actionRegistry";
import { usePendingGotoStore } from "@/store/pendingGotoStore";
import { useMarkdownPreviewContentStore } from "@/store/markdownPreviewContentStore";
import { useMonacoGlobalActions } from "@/hooks/useMonacoGlobalActions";
import { useMonacoTextToolActions } from "@/hooks/useMonacoTextToolActions";
import { useMonacoAiActions } from "@/hooks/useMonacoAiActions";
import { useVoiceDictationTarget } from "@/hooks/useVoiceDictationTarget";

const Editor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Loading editor…
      </div>
    ),
  },
);

interface MonacoEditorWrapperProps {
  fileId: string;
  tabId: string;
  registerGlobalActions?: boolean;
}

export function MonacoEditorWrapper({
  fileId,
  tabId,
  registerGlobalActions,
}: MonacoEditorWrapperProps) {
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const currentFileIdRef = useRef<string | null>(null);
  const currentTabIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  /** Bumped by the retry button to re-run the load effect after a failure. */
  const [reloadNonce, setReloadNonce] = useState(0);

  const theme = useSettingsStore((s) => s.theme);
  const settings = useSettingsStore((s) => s.settings);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const updateNode = useWorkspaceStore((s) => s.updateNode);
  const setDirty = useTabsStore((s) => s.setDirty);
  const updateViewState = useTabsStore((s) => s.updateViewState);
  const setStatus = useEditorStatusStore((s) => s.setStatus);
  const setSelectedNodeId = useExplorerSelectionStore(
    (s) => s.setSelectedNodeId,
  );

  const file = nodes[fileId];
  const language = file?.type === "file" ? file.language : "plaintext";
  const isLocked = file?.type === "file" && file.locked;
  const readOnly = useTabsStore(
    (s) => s.tabs.find((t) => t.id === tabId)?.readOnly ?? false,
  );

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Reads the autosave setting live (not from a closure) since Monaco listeners are registered once at mount. */
  function scheduleAutoSave(id: string, tid: string) {
    const autoSave = useSettingsStore.getState().settings.autoSave;
    if (autoSave === "off" || autoSave === "manual") return;
    const delay = AUTO_SAVE_INTERVALS_MS[autoSave] ?? 5000;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      void persistFile(id, tid, { silent: true });
    }, delay);
  }

  /** Single write path for both autosave and Ctrl+S. Only marks the tab clean once the write
   *  actually succeeded — a failed save has to keep the file dirty, or the user is told their
   *  work is saved when the server never received it. */
  async function persistFile(
    id: string,
    tid: string,
    opts?: { silent?: boolean },
  ) {
    const model = modelRegistry.getModel(id);
    if (!model) return;
    const value = model.getValue();
    try {
      await getActiveRepository().writeFileContent(id, value);
      modelRegistry.markSaved(id, value);
      setDirty(tid, false);
      updateNode(id, { size: value.length });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error.";
      // Autosave failures still surface — silently dropping them is how you lose work — but as
      // a single id'd toast so a flapping connection can't stack up dozens of them.
      toast.error(`Couldn't save "${nodes[id]?.name ?? "file"}".`, {
        id: `save-failed-${id}`,
        description: opts?.silent
          ? `${detail} Your changes are still here — retry with Ctrl+S.`
          : detail,
      });
    }
  }

  function persistViewState(prevTabId: string | null) {
    const editor = editorRef.current;
    if (!editor || !prevTabId) return;
    const state = editor.saveViewState();
    if (!state) return;
    const position = editor.getPosition();
    const selection = editor.getSelection();
    updateViewState(prevTabId, {
      cursor: {
        lineNumber: position?.lineNumber ?? 1,
        column: position?.column ?? 1,
      },
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
  function pushMarkdownPreviewContent(
    id: string,
    model: MonacoEditorNS.ITextModel,
  ) {
    if (!registerGlobalActions) return;
    const node = useWorkspaceStore.getState().nodes[id];
    if (node?.type === "file" && node.language === "markdown") {
      useMarkdownPreviewContentStore
        .getState()
        .setContent(id, model.getValue());
    }
  }

  async function switchToFile(id: string, tid: string) {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    persistViewState(currentTabIdRef.current);

    const node = useWorkspaceStore.getState().nodes[id];
    if (node?.type === "file" && node.locked) {
      // Nothing to load until the LockedFileOverlay's passphrase prompt unlocks it — that flips
      // `node.locked` to false, which re-triggers this effect via the isLocked dependency below.
      setLoading(false);
      currentFileIdRef.current = id;
      currentTabIdRef.current = tid;
      return;
    }

    let model = modelRegistry.getModel(id);
    if (!model) {
      setLoading(true);
      setLoadError(null);
      let content: string;
      try {
        content = await getActiveRepository().readFileContent(id);
      } catch (err) {
        // Without this, a failed read rejected out of the effect entirely: the error surfaced as
        // an unhandled rejection and `setLoading(false)` never ran, leaving the pane stuck on
        // "Loading…" forever with no way to recover short of a page reload.
        setLoadError(err);
        setLoading(false);
        return;
      }
      const loadedNode = useWorkspaceStore.getState().nodes[id];
      model = modelRegistry.getOrCreateModel(
        monaco,
        id,
        content,
        loadedNode?.type === "file" ? loadedNode.language : "plaintext",
      );
    }
    // Must run on every path, not just the fresh-load one above: reopening a file whose model is
    // still cached from an earlier tab (models outlive tab-close, by design, to keep undo history)
    // skips that branch entirely, and `loading` starts `true` on every mount — leaving the skeleton
    // stuck on screen forever over a fully-loaded editor if this were left inside the `if`.
    setLoading(false);

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
    // isLocked is intentionally included: a locked->unlocked transition (via LockedFileOverlay)
    // must re-run this to actually load the now-decrypted content into a model. reloadNonce lets
    // the failure state's Try Again button re-run the same load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, tabId, isLocked, reloadNonce]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (monaco && file)
      modelRegistry.setModelLanguage(monaco, fileId, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const pendingGoto = usePendingGotoStore((s) => s.pending);
  useEffect(() => {
    if (!pendingGoto || pendingGoto.fileId !== fileId) return;
    const editor = editorRef.current;
    if (!editor || editor.getModel() !== modelRegistry.getModel(fileId)) return;
    editor.setPosition({
      lineNumber: pendingGoto.line,
      column: pendingGoto.column,
    });
    editor.revealLineInCenter(pendingGoto.line);
    editor.focus();
    usePendingGotoStore.getState().clear();
  }, [pendingGoto, fileId]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const initialModel = editor.getModel();
    void switchToFile(fileId, tabId).then(() => {
      if (initialModel && initialModel !== editorRef.current?.getModel())
        initialModel.dispose();
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

    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        formatActiveEditor(editor);
      },
    );

    editor.onMouseDown((e) => {
      if (e.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN)
        return;
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

    // Only shows in the right-click menu when text is selected — matches the Tools-menu
    // command's own selection-or-document convention, but a full-document AI rewrite from a
    // bare right-click (no selection) would be a surprising, hard-to-undo action to expose there.
    // Monaco's context menu has no submenu API, so provider choice (matching the Tools menu's
    // Gemini/Claude split) is exposed as two flat, explicitly-labeled actions per feature rather
    // than one default-provider action.
    const AI_CONTEXT_MENU_ACTIONS: {
      id: string;
      label: string;
      order: number;
      actionId: string;
    }[] = [
      {
        id: "tools.ai.fixGrammar.contextMenu.gemini",
        label: "Correct the Sentence (AI) — Gemini",
        order: 1,
        actionId: "tools.ai.fixGrammar.gemini",
      },
      {
        id: "tools.ai.fixGrammar.contextMenu.claude",
        label: "Correct the Sentence (AI) — Claude",
        order: 2,
        actionId: "tools.ai.fixGrammar.claude",
      },
      {
        id: "tools.ai.generateMdSyntax.contextMenu.gemini",
        label: "Generate MD Syntax (AI) — Gemini",
        order: 3,
        actionId: "tools.ai.generateMdSyntax.gemini",
      },
      {
        id: "tools.ai.generateMdSyntax.contextMenu.claude",
        label: "Generate MD Syntax (AI) — Claude",
        order: 4,
        actionId: "tools.ai.generateMdSyntax.claude",
      },
      {
        id: "tools.ai.generatePrompt.contextMenu.gemini",
        label: "Generate Prompt (AI) — Gemini",
        order: 5,
        actionId: "tools.ai.generatePrompt.gemini",
      },
      {
        id: "tools.ai.generatePrompt.contextMenu.claude",
        label: "Generate Prompt (AI) — Claude",
        order: 6,
        actionId: "tools.ai.generatePrompt.claude",
      },
    ];

    for (const { id, label, order, actionId } of AI_CONTEXT_MENU_ACTIONS) {
      editor.addAction({
        id,
        label,
        contextMenuGroupId: "9_ai",
        contextMenuOrder: order,
        precondition: "editorHasSelection",
        run: () => {
          runAction(actionId);
        },
      });
    }
  };

  useVoiceDictationTarget(editorRef, registerGlobalActions);

  function saveActiveFile() {
    const id = currentFileIdRef.current;
    const tid = currentTabIdRef.current;
    if (!id || !tid) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    void persistFile(id, tid);
  }

  useMonacoGlobalActions({
    registerGlobalActions,
    editorRef,
    fileId,
    tabId,
    saveActiveFile,
  });
  useMonacoTextToolActions({ registerGlobalActions, editorRef });
  useMonacoAiActions({ registerGlobalActions, editorRef });

  const themeModule = THEME_MODULES[theme];

  return (
    <div className="relative h-full">
      {isLocked && <LockedFileOverlay key={fileId} fileId={fileId} />}
      {loadError !== null && !isLocked && (
        <div className="bg-background absolute inset-0 z-10">
          <LoadFailure
            error={loadError}
            onRetry={() => {
              setLoadError(null);
              setReloadNonce((n) => n + 1);
            }}
          />
        </div>
      )}
      {loading && !isLocked && !loadError && (
        <div className="animate-in fade-in bg-background absolute inset-0 z-10 px-4 py-3 duration-150">
          <SkeletonText lines={8} />
        </div>
      )}
      <Editor
        height="100%"
        theme={themeModule.monacoThemeId}
        defaultLanguage={language}
        defaultValue=""
        keepCurrentModel
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
          autoClosingBrackets: settings.autoClosingBrackets
            ? "always"
            : "never",
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
