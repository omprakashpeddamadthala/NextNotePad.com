"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
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
import { useRegisterAction } from "@/hooks/useRegisterAction";
import { AUTO_SAVE_INTERVALS_MS } from "@/lib/constants/defaultSettings";
import { duplicateNode } from "@/services/fileOperations";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { CUSTOM_FORMATTERS } from "@/services/formatting/formatters";
import { toggleBookmark, nextBookmarkLine } from "@/lib/monaco/bookmarks";
import { usePendingGotoStore } from "@/store/pendingGotoStore";
import { useEditorInsertStore } from "@/store/editorInsertStore";
import { useMarkdownPreviewContentStore } from "@/store/markdownPreviewContentStore";
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  caseConverters,
  computeHash,
  type HashAlgorithm,
} from "@/services/textTools/textTools";

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
  const setRenamingNodeId = useExplorerSelectionStore((s) => s.setRenamingNodeId);

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
      formatActiveEditor();
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

  /** Formats the selection if one exists, otherwise the whole document. JSON/XML use our own
   *  formatter (guaranteed-correct, no CDN dependency); everything else uses Monaco's built-in. */
  function formatActiveEditor() {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;

    const selection = editor.getSelection();
    const hasSelection = Boolean(selection && !selection.isEmpty());
    const language = model.getLanguageId();
    const customFormatter = CUSTOM_FORMATTERS[language];
    const tabWidth = useSettingsStore.getState().settings.tabWidth;

    if (customFormatter) {
      const range = hasSelection && selection ? selection : model.getFullModelRange();
      const original = model.getValueInRange(range);
      try {
        const formatted = customFormatter(original, tabWidth);
        editor.executeEdits("format", [{ range, text: formatted }]);
        editor.pushUndoStop();
        toast.success(`Formatted ${language.toUpperCase()}`);
      } catch {
        toast.error(`Couldn't format — invalid ${language.toUpperCase()}`);
      }
      return;
    }

    const actionId = hasSelection ? "editor.action.formatSelection" : "editor.action.formatDocument";
    const action = editor.getAction(actionId);
    if (!action) {
      toast.error(`No formatter available for "${language}"`);
      return;
    }
    // Monaco's built-in action only does anything if a formatting provider is registered for
    // this language — that's true for JS/TS/CSS/HTML/JSON out of the box, but most languages
    // (Python, Go, Rust, Java, YAML, ...) have none, and `action.run()` succeeds silently
    // without changing anything. Compare before/after so that case gets an honest message
    // instead of the button looking like it did nothing.
    const before = model.getValue();
    void action.run().then(() => {
      if (model.getValue() === before) {
        toast.error(`No formatter available for "${language}"`);
      } else {
        toast.success(`Formatted ${language.toUpperCase()}`);
      }
    });
  }

  /** Applies a pure text transform to the selection if one exists, otherwise the whole document —
   *  the same "selection-or-document" convention `formatActiveEditor` uses. Backs every Tools-menu
   *  action (Base64, URL, case conversion): they act on the tab you already have open instead of a
   *  separate copy/paste dialog. */
  function transformActiveEditor(transform: (text: string) => string, successMessage: string, errorMessage: string) {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;

    const selection = editor.getSelection();
    const hasSelection = Boolean(selection && !selection.isEmpty());
    const range = hasSelection && selection ? selection : model.getFullModelRange();
    const original = model.getValueInRange(range);
    try {
      const transformed = transform(original);
      editor.executeEdits("tools", [{ range, text: transformed }]);
      editor.pushUndoStop();
      toast.success(successMessage);
    } catch {
      toast.error(errorMessage);
    }
  }

  /** Reads the selection if one exists, otherwise the whole document — read-only counterpart to
   *  `transformActiveEditor`, used by the hash tool since hashing doesn't mutate the buffer. */
  function getActiveEditorSelectionOrDocument(): string | null {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return null;
    const selection = editor.getSelection();
    const hasSelection = Boolean(selection && !selection.isEmpty());
    return hasSelection && selection ? model.getValueInRange(selection) : model.getValue();
  }

  async function hashActiveEditor(algorithm: HashAlgorithm) {
    const text = getActiveEditorSelectionOrDocument();
    if (!text) {
      toast.error("Open a file first to hash its content.");
      return;
    }
    const hex = await computeHash(algorithm, text);
    await navigator.clipboard.writeText(hex);
    toast.success(`${algorithm} copied to clipboard: ${hex}`);
  }

  /** Inserts dictated text at the cursor/selection, adding a leading space if it would otherwise
   *  run into the preceding word — keeps consecutive voice-typed phrases from merging together. */
  function insertDictatedText(text: string) {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!editor || !model || !selection) return;

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

  useEffect(() => {
    if (!registerGlobalActions) return;
    useEditorInsertStore.getState().register(insertDictatedText);
    return () => useEditorInsertStore.getState().unregister(insertDictatedText);
  }, [registerGlobalActions]);

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
      if (registerGlobalActions) formatActiveEditor();
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.base64Encode",
    () => {
      if (registerGlobalActions)
        transformActiveEditor(base64Encode, "Base64-encoded.", "Couldn't Base64-encode this content.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.base64Decode",
    () => {
      if (registerGlobalActions)
        transformActiveEditor(base64Decode, "Base64-decoded.", "Couldn't Base64-decode — is this valid Base64?");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.urlEncode",
    () => {
      if (registerGlobalActions) transformActiveEditor(urlEncode, "URL-encoded.", "Couldn't URL-encode this content.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.urlDecode",
    () => {
      if (registerGlobalActions)
        transformActiveEditor(urlDecode, "URL-decoded.", "Couldn't URL-decode — is this a valid encoded string?");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.upper",
    () => {
      if (registerGlobalActions) transformActiveEditor(caseConverters.upper, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.lower",
    () => {
      if (registerGlobalActions) transformActiveEditor(caseConverters.lower, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.title",
    () => {
      if (registerGlobalActions) transformActiveEditor(caseConverters.title, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.sentence",
    () => {
      if (registerGlobalActions)
        transformActiveEditor(caseConverters.sentence, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.camel",
    () => {
      if (registerGlobalActions) transformActiveEditor(caseConverters.camel, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.pascal",
    () => {
      if (registerGlobalActions) transformActiveEditor(caseConverters.pascal, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.snake",
    () => {
      if (registerGlobalActions) transformActiveEditor(caseConverters.snake, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.kebab",
    () => {
      if (registerGlobalActions) transformActiveEditor(caseConverters.kebab, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.constant",
    () => {
      if (registerGlobalActions)
        transformActiveEditor(caseConverters.constant, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.hash.SHA-1",
    () => {
      if (registerGlobalActions) void hashActiveEditor("SHA-1");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.hash.SHA-256",
    () => {
      if (registerGlobalActions) void hashActiveEditor("SHA-256");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.hash.SHA-384",
    () => {
      if (registerGlobalActions) void hashActiveEditor("SHA-384");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.hash.SHA-512",
    () => {
      if (registerGlobalActions) void hashActiveEditor("SHA-512");
    },
    [registerGlobalActions],
  );

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
