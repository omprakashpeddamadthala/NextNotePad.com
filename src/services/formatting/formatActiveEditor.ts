import { toast } from "sonner";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { useSettingsStore } from "@/store/settingsStore";
import { CUSTOM_FORMATTERS } from "./formatters";

export function formatActiveEditor(editor: MonacoEditorNS.IStandaloneCodeEditor): void {
  const model = editor.getModel();
  if (!model) return;

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
  const before = model.getValue();
  void action.run().then(() => {
    if (model.getValue() === before) {
      toast.error(`No formatter available for "${language}"`);
    } else {
      toast.success(`Formatted ${language.toUpperCase()}`);
    }
  });
}
