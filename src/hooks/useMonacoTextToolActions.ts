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
  formatJson,
  minifyJson,
  sortLinesAscending,
  sortLinesDescending,
  removeDuplicateLines,
  trimTrailingWhitespace,
  collapseBlankLines,
  tabsToSpaces,
  spacesToTabs,
  computeTextStats,
  generateUuid,
  unixToIsoDate,
  isoDateToUnix,
  decodeJwt,
  htmlEncode,
  htmlDecode,
  escapeJsonString,
  unescapeJsonString,
  decimalToHex,
  hexToDecimal,
  decimalToBinary,
  binaryToDecimal,
  hexToRgb,
  rgbToHex,
  slugify,
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

function reportTextStats(editor: MonacoEditorNS.IStandaloneCodeEditor): void {
  const text = getActiveEditorSelectionOrDocument(editor);
  if (!text) {
    toast.error("Open a file first to count its content.");
    return;
  }
  const { characters, charactersNoSpaces, words, lines } = computeTextStats(text);
  toast.success(
    `${words} words, ${characters} chars (${charactersNoSpaces} w/o spaces), ${lines} lines.`,
  );
}

/** Inserts text at the cursor, or replaces the selection if one exists — the "insert" counterpart
 *  to `transformActiveEditor`'s "selection-or-document" convention, used by tools (like UUID
 *  generation) that produce new content rather than transform existing content. */
function insertAtCursorOrSelection(
  editor: MonacoEditorNS.IStandaloneCodeEditor,
  text: string,
  successMessage: string,
): void {
  const selection = editor.getSelection();
  if (!selection) return;
  editor.executeEdits("tools", [{ range: selection, text }]);
  editor.pushUndoStop();
  toast.success(successMessage);
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

  useRegisterAction(
    "tools.json.format",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, formatJson, "JSON formatted.", "Invalid JSON — couldn't format.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.json.minify",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, minifyJson, "JSON minified.", "Invalid JSON — couldn't minify.");
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.lines.sortAsc",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, sortLinesAscending, "Lines sorted (A-Z).", "Couldn't sort lines.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.lines.sortDesc",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, sortLinesDescending, "Lines sorted (Z-A).", "Couldn't sort lines.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.lines.dedupe",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          removeDuplicateLines,
          "Duplicate lines removed.",
          "Couldn't de-duplicate lines.",
        );
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.whitespace.trimTrailing",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          trimTrailingWhitespace,
          "Trailing whitespace trimmed.",
          "Couldn't trim whitespace.",
        );
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.whitespace.collapseBlankLines",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          collapseBlankLines,
          "Blank lines collapsed.",
          "Couldn't collapse blank lines.",
        );
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.whitespace.tabsToSpaces",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, tabsToSpaces, "Tabs converted to spaces.", "Couldn't convert tabs.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.whitespace.spacesToTabs",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          spacesToTabs,
          "Spaces converted to tabs.",
          "Couldn't convert spaces.",
        );
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.textStats",
    () => {
      if (registerGlobalActions && editorRef.current) reportTextStats(editorRef.current);
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.generateUuid",
    () => {
      if (registerGlobalActions && editorRef.current)
        insertAtCursorOrSelection(editorRef.current, generateUuid(), "UUID inserted.");
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.timestamp.unixToIso",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          unixToIsoDate,
          "Converted to ISO date.",
          "Couldn't convert — select a valid Unix timestamp.",
        );
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.timestamp.isoToUnix",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          isoDateToUnix,
          "Converted to Unix timestamp.",
          "Couldn't convert — select a valid date string.",
        );
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.jwtDecode",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          decodeJwt,
          "JWT decoded.",
          "Couldn't decode — select a valid JWT (header.payload.signature).",
        );
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.html.encode",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, htmlEncode, "HTML-encoded.", "Couldn't HTML-encode this content.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.html.decode",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, htmlDecode, "HTML-decoded.", "Couldn't HTML-decode this content.");
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.escapeString.escape",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          escapeJsonString,
          "String escaped.",
          "Couldn't escape this content.",
        );
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.escapeString.unescape",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(
          editorRef.current,
          unescapeJsonString,
          "String unescaped.",
          "Couldn't unescape — is this validly-escaped text?",
        );
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.base.decToHex",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, decimalToHex, "Converted to hex.", "Couldn't convert — not a valid decimal number.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.base.hexToDec",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, hexToDecimal, "Converted to decimal.", "Couldn't convert — not a valid hex number.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.base.decToBin",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, decimalToBinary, "Converted to binary.", "Couldn't convert — not a valid decimal number.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.base.binToDec",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, binaryToDecimal, "Converted to decimal.", "Couldn't convert — not a valid binary number.");
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.color.hexToRgb",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, hexToRgb, "Converted to RGB.", "Couldn't convert — not a valid hex color.");
    },
    [registerGlobalActions],
  );
  useRegisterAction(
    "tools.color.rgbToHex",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, rgbToHex, "Converted to hex.", "Couldn't convert — not a valid rgb() color.");
    },
    [registerGlobalActions],
  );

  useRegisterAction(
    "tools.slugify",
    () => {
      if (registerGlobalActions && editorRef.current)
        transformActiveEditor(editorRef.current, slugify, "Slugified.", "Couldn't slugify this content.");
    },
    [registerGlobalActions],
  );
}
