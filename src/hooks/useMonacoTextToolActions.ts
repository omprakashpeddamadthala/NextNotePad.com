import type { RefObject } from "react";
import { toast } from "sonner";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { useRegisterAction } from "@/hooks/useRegisterAction";
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  caseConverters,
  computeHash,
  type HashAlgorithm,
} from "@/services/textTools/textTools";

interface UseMonacoTextToolActionsParams {
  registerGlobalActions: boolean | undefined;
  editorRef: RefObject<MonacoEditorNS.IStandaloneCodeEditor | null>;
}

/** Applies a pure text transform to the selection if one exists, otherwise the whole document —
 *  the same "selection-or-document" convention `formatActiveEditor` uses. Backs every Tools-menu
 *  action (Base64, URL, case conversion): they act on the tab you already have open instead of a
 *  separate copy/paste dialog. */
function transformActiveEditor(
  editor: MonacoEditorNS.IStandaloneCodeEditor,
  transform: (text: string) => string,
  successMessage: string,
  errorMessage: string,
): void {
  const model = editor.getModel();
  if (!model) return;

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
function getActiveEditorSelectionOrDocument(editor: MonacoEditorNS.IStandaloneCodeEditor): string | null {
  const model = editor.getModel();
  if (!model) return null;
  const selection = editor.getSelection();
  const hasSelection = Boolean(selection && !selection.isEmpty());
  return hasSelection && selection ? model.getValueInRange(selection) : model.getValue();
}

async function hashActiveEditor(editor: MonacoEditorNS.IStandaloneCodeEditor, algorithm: HashAlgorithm): Promise<void> {
  const text = getActiveEditorSelectionOrDocument(editor);
  if (!text) {
    toast.error("Open a file first to hash its content.");
    return;
  }
  const hex = await computeHash(algorithm, text);
  await navigator.clipboard.writeText(hex);
  toast.success(`${algorithm} copied to clipboard: ${hex}`);
}

/** Wires every Tools-menu action (Base64/URL encode-decode, case conversion, hashing) into the
 *  shared action registry. Split out of `MonacoEditorWrapper` for the same reason
 *  `useMonacoGlobalActions` is: this is "menu command -> text transform" glue, not editor
 *  lifecycle management. */
export function useMonacoTextToolActions({ registerGlobalActions, editorRef }: UseMonacoTextToolActionsParams): void {
  useRegisterAction(
    "tools.base64Encode",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          base64Encode,
          "Base64-encoded.",
          "Couldn't Base64-encode this content.",
        );
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.base64Decode",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          base64Decode,
          "Base64-decoded.",
          "Couldn't Base64-decode — is this valid Base64?",
        );
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.urlEncode",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, urlEncode, "URL-encoded.", "Couldn't URL-encode this content.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.urlDecode",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          urlDecode,
          "URL-decoded.",
          "Couldn't URL-decode — is this a valid encoded string?",
        );
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.upper",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.upper, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.lower",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.lower, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.title",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.title, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.sentence",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.sentence, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.camel",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.camel, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.pascal",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.pascal, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.snake",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.snake, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.kebab",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.kebab, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.case.constant",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, caseConverters.constant, "Case converted.", "Couldn't convert case.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.hash.SHA-1",
    () => {
      if (registerGlobalActions && editorRef.current) void hashActiveEditor(editorRef.current, "SHA-1");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.hash.SHA-256",
    () => {
      if (registerGlobalActions && editorRef.current) void hashActiveEditor(editorRef.current, "SHA-256");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.hash.SHA-384",
    () => {
      if (registerGlobalActions && editorRef.current) void hashActiveEditor(editorRef.current, "SHA-384");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.hash.SHA-512",
    () => {
      if (registerGlobalActions && editorRef.current) void hashActiveEditor(editorRef.current, "SHA-512");
    },
    [registerGlobalActions],
  );
}
