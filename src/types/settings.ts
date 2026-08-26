export type CursorStyle =
  | "line"
  | "block"
  | "underline"
  | "line-thin"
  | "block-outline"
  | "underline-thin";

export type AutoSaveMode = "off" | "2s" | "5s" | "10s" | "manual";

/** Which backend the "Fix Grammar & Spelling (AI)" feature calls — Gemini directly, or Claude via
 *  the AgentRouter gateway. Both are optional server-side integrations; either can be left
 *  unconfigured without affecting the other. */
export type AiProvider = "gemini" | "claude";

export type EncodingName =
  | "UTF-8"
  | "UTF-8 BOM"
  | "UTF-16 LE"
  | "UTF-16 BE"
  | "ASCII"
  | "ISO-8859-1";

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
}
