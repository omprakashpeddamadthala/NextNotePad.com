import type { Monaco } from "@monaco-editor/react";
import type { IDisposable, editor as MonacoEditorNS, languages } from "monaco-editor";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/settingsStore";
import { scanWords } from "@/services/spellcheck/wordScanner";
import {
  ignoreWord,
  isWordCorrect,
  loadSpeller,
  suggestionsFor,
} from "@/services/spellcheck/spellChecker";

const OWNER = "spellcheck";
const SOURCE = "Spelling";
const CHECK_DELAY_MS = 400;
/** Very large notes are skipped so spell check never makes typing feel slow. */
const MAX_CHECKED_LENGTH = 300_000;
const MAX_PERSONAL_WORDS = 2000;
const LANGUAGES = ["plaintext", "markdown"];
const ADD_WORD_COMMAND = "nextnotepad.spellcheck.addWord";
const IGNORE_WORD_COMMAND = "nextnotepad.spellcheck.ignoreWord";

let providerRegistered = false;
let warnedLoadFailure = false;
/** One re-check function per open editor, used after "Ignore". */
const recheckers = new Set<() => void>();

function addToDictionary(word: string): void {
  const { settings, updateSettings } = useSettingsStore.getState();
  const lower = word.toLowerCase();
  if (settings.spellCheckWords.includes(lower)) return;
  updateSettings({
    spellCheckWords: [...settings.spellCheckWords, lower].slice(-MAX_PERSONAL_WORDS),
  });
}

/** Commands and quick fixes are global in Monaco, so they are registered once. */
function registerQuickFixes(monaco: Monaco): void {
  if (providerRegistered) return;
  providerRegistered = true;

  monaco.editor.registerCommand(ADD_WORD_COMMAND, (_accessor: unknown, word: string) =>
    addToDictionary(word),
  );
  monaco.editor.registerCommand(IGNORE_WORD_COMMAND, (_accessor: unknown, word: string) => {
    ignoreWord(word);
    recheckers.forEach((recheck) => recheck());
  });

  const provider: languages.CodeActionProvider = {
    provideCodeActions: async (model, _range, context) => {
      const markers = context.markers.filter((m) => m.source === SOURCE);
      const actions: languages.CodeAction[] = [];
      if (markers.length > 0) {
        const speller = await loadSpeller();
        for (const marker of markers) {
          const word = model.getValueInRange(marker);
          suggestionsFor(speller, word).forEach((suggestion, i) =>
            actions.push({
              title: `Change to “${suggestion}”`,
              kind: "quickfix",
              diagnostics: [marker],
              isPreferred: i === 0,
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    versionId: model.getVersionId(),
                    textEdit: { range: marker, text: suggestion },
                  },
                ],
              },
            }),
          );
          actions.push(
            {
              title: `Add “${word}” to dictionary`,
              kind: "quickfix",
              diagnostics: [marker],
              command: { id: ADD_WORD_COMMAND, title: "Add to dictionary", arguments: [word] },
            },
            {
              title: `Ignore “${word}”`,
              kind: "quickfix",
              diagnostics: [marker],
              command: { id: IGNORE_WORD_COMMAND, title: "Ignore", arguments: [word] },
            },
          );
        }
      }
      return { actions, dispose: () => {} };
    },
  };
  monaco.languages.registerCodeActionProvider(LANGUAGES, provider);
}

/**
 * Underlines misspelled words in plain-text and Markdown notes while the
 * "Spell check" setting is on. Returns a function that stops it.
 */
export function attachSpellCheck(
  monaco: Monaco,
  editor: MonacoEditorNS.IStandaloneCodeEditor,
): () => void {
  registerQuickFixes(monaco);

  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let suggestAction: IDisposable | null = null;

  async function check() {
    const model = editor.getModel();
    if (!model || disposed) return;
    const { spellCheck, spellCheckWords } = useSettingsStore.getState().settings;
    const language = model.getLanguageId();
    if (
      !spellCheck ||
      !LANGUAGES.includes(language) ||
      model.getValueLength() > MAX_CHECKED_LENGTH
    ) {
      monaco.editor.setModelMarkers(model, OWNER, []);
      return;
    }

    let speller;
    try {
      speller = await loadSpeller();
    } catch {
      if (!warnedLoadFailure) {
        warnedLoadFailure = true;
        toast.error("Spell check couldn't load its dictionary. Check your connection.");
      }
      return;
    }
    if (disposed || editor.getModel() !== model) return;

    const personal = new Set(spellCheckWords);
    const known = new Map<string, boolean>();
    const markers: MonacoEditorNS.IMarkerData[] = [];
    for (const w of scanWords(model.getValue(), { markdown: language === "markdown" })) {
      let correct = known.get(w.word);
      if (correct === undefined) {
        correct = isWordCorrect(speller, w.word, personal);
        known.set(w.word, correct);
      }
      if (correct) continue;
      const start = model.getPositionAt(w.start);
      const end = model.getPositionAt(w.end);
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        source: SOURCE,
        message: `“${w.word}” may be misspelled. Right-click for suggestions.`,
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column,
      });
    }
    monaco.editor.setModelMarkers(model, OWNER, markers);
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void check(), CHECK_DELAY_MS);
  }

  // The right-click entry exists only while spell check is on.
  function syncContextMenu() {
    const on = useSettingsStore.getState().settings.spellCheck;
    if (on && !suggestAction) {
      suggestAction = editor.addAction({
        id: "nextnotepad.spellcheck.suggest",
        label: "Spelling Suggestions",
        contextMenuGroupId: "1_modification",
        contextMenuOrder: 0,
        // trigger() reaches Quick Fix in every Monaco version; getAction() doesn't in 0.56+.
        run: (ed) => ed.trigger("spellcheck", "editor.action.quickFix", null),
      });
    } else if (!on && suggestAction) {
      suggestAction.dispose();
      suggestAction = null;
    }
  }

  const subscriptions = [
    editor.onDidChangeModel(schedule),
    editor.onDidChangeModelContent(schedule),
    editor.onDidChangeModelLanguage(schedule),
  ];
  const unsubscribeSettings = useSettingsStore.subscribe((state, prev) => {
    if (
      state.settings.spellCheck !== prev.settings.spellCheck ||
      state.settings.spellCheckWords !== prev.settings.spellCheckWords
    ) {
      syncContextMenu();
      schedule();
    }
  });
  recheckers.add(schedule);
  syncContextMenu();
  schedule();

  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    subscriptions.forEach((s) => s.dispose());
    unsubscribeSettings();
    recheckers.delete(schedule);
    suggestAction?.dispose();
  };
}
