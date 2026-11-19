export type CursorStyle =
  | "line"
  | "block"
  | "underline"
  | "line-thin"
  | "block-outline"
  | "underline-thin";

export type AutoSaveMode = "off" | "2s" | "5s" | "10s" | "manual";

export type AiProvider = "gemini" | "claude";

export type EncodingName =
  | "UTF-8"
  | "UTF-8 BOM"
  | "UTF-16 LE"
  | "UTF-16 BE"
  | "ASCII"
  | "ISO-8859-1";

export interface UserTemplate {
  id: string;
  name: string;
  /** File extension for notes made from it, e.g. "md" or "txt". */
  extension: string;
  content: string;
}

export interface EditorSettings {
  fontFamily: string;
  fontSize: number;
  tabWidth: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  autoSave: AutoSaveMode;
  showLineNumbers: boolean;
  showMinimap: boolean;
  cursorStyle: CursorStyle;
  defaultEncoding: EncodingName;
  defaultLanguage: string;
  restoreSession: boolean;
  renderWhitespace: boolean;
  autoClosingBrackets: boolean;
  zoomLevel: number;
  aiProvider: AiProvider;
  /** Auto-correct voice typing (grammar, fillers, spoken punctuation). */
  dictationAutoCorrect: boolean;
  /** Underline misspelled words in plain-text and Markdown notes. */
  spellCheck: boolean;
  /** Words added to the personal spell-check dictionary. */
  spellCheckWords: string[];
  userTemplates: UserTemplate[];
}
