import type { EditorSettings } from "@/types/settings";

export const DEFAULT_SETTINGS: EditorSettings = {
  fontFamily:
    "var(--font-mono), 'Geist Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
  fontSize: 15,
  tabWidth: 4,
  insertSpaces: true,
  wordWrap: false,
  autoSave: "5s",
  showLineNumbers: true,
  showMinimap: false,
  cursorStyle: "line",
  defaultEncoding: "UTF-8",
  defaultLanguage: "plaintext",
  restoreSession: true,
  renderWhitespace: false,
  autoClosingBrackets: true,
  zoomLevel: 0,
  aiProvider: "gemini",
};

export const AUTO_SAVE_INTERVALS_MS: Record<string, number> = {
  "2s": 2000,
  "5s": 5000,
  "10s": 10000,
};
