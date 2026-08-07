export type CursorStyle =
  | "line"
  | "block"
  | "underline"
  | "line-thin"
  | "block-outline"
  | "underline-thin";

export type AutoSaveMode = "off" | "2s" | "5s" | "10s" | "manual";

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
}
