"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { Lock, Unlock } from "lucide-react";
import { SkeletonText } from "@/components/ui/skeleton";
import { LoadFailure } from "@/components/ui/load-failure";
import { handleMonacoBeforeMount } from "@/lib/monaco/setupMonaco";
import { THEME_MODULES } from "@/lib/monaco/themes";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { getActiveRepository } from "@/services/storage/activeRepository";
import { unlockSingleFile } from "@/services/fileLock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useMonacoTextToolActions } from "@/hooks/useMonacoTextToolActions";
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

/** Covers the editor area for a locked file — nothing is decrypted or readable until the correct
 *  passphrase is entered. Keyed by fileId in the parent so switching between locked tabs never
 *  carries over a stale passphrase/error from a different file. */
function LockedFileOverlay({ fileId }: { fileId: string }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await unlockSingleFile(fileId, passphrase);
      if (result.status === "wrong-passphrase") setError("Incorrect passphrase.");
      // On success, the workspace node's `locked` flips to false, which the parent reacts to.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <Lock className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">This file is locked</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex w-full max-w-xs flex-col gap-2">
        <Input
          type="password"
          autoFocus
          placeholder="Passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          autoComplete="off"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={busy}>
          <Unlock className="size-4" /> Unlock
        </Button>
      </form>
    </div>
  );
}

export function MonacoEditorWrapper({ fileId, tabId, registerGlobalActions }: MonacoEditorWrapperProps) {
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
  const setSelectedNodeId = useExplorerSelectionStore((s) => s.setSelectedNodeId);

  const file = nodes[fileId];
  const language = file?.type === "file" ? file.language : "plaintext";
  const isLocked = file?.type === "file" && file.locked;
  const readOnly = useTabsStore((s) => s.tabs.find((t) => t.id === tabId)?.readOnly ?? false);

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
  async function persistFile(id: string, tid: string, opts?: { silent?: boolean }) {
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
        description: opts?.silent ? `${detail} Your changes are still here — retry with Ctrl+S.` : detail,
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
    // isLocked is intentionally included: a locked->unlocked transition (via LockedFileOverlay)
    // must re-run this to actually load the now-decrypted content into a model. reloadNonce lets
    // the failure state's Try Again button re-run the same load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, tabId, isLocked, reloadNonce]);

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
    void persistFile(id, tid);
  }

  useMonacoGlobalActions({ registerGlobalActions, editorRef, fileId, tabId, saveActiveFile });
  useMonacoTextToolActions({ registerGlobalActions, editorRef });

  const themeModule = THEME_MODULES[theme];

  return (
    <div className="relative h-full">
      {isLocked && <LockedFileOverlay key={fileId} fileId={fileId} />}
      {loadError !== null && !isLocked && (
        <div className="absolute inset-0 z-10 bg-background">
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
        <div className="absolute inset-0 z-10 animate-in fade-in bg-background px-4 py-3 duration-150">
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
