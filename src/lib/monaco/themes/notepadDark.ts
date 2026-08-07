import type { ThemeModule } from "./types";

export const notepadDark: ThemeModule = {
  id: "notepad-dark",
  label: "Dark",
  monacoThemeId: "np-notepad-dark",
  chrome: {
    background: "#1e1e1e",
    foreground: "#d4d4d4",
    panel: "#252526",
    panelBorder: "#3c3c3c",
    menuHover: "#3c3c3c",
    toolbarBackground: "#2d2d2d",
    statusBarBackground: "#0078d4",
    statusBarForeground: "#ffffff",
    accent: "#0078d4",
    accentForeground: "#ffffff",
    tabActiveBackground: "#1e1e1e",
    tabInactiveBackground: "#2d2d2d",
    tabBorder: "#252526",
    scrollbar: "#4f4f4f",
    isDark: true,
  },
  monacoTheme: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6a9955" },
      { token: "keyword", foreground: "569cd6" },
      { token: "string", foreground: "ce9178" },
      { token: "number", foreground: "b5cea8" },
      { token: "type", foreground: "4ec9b0" },
    ],
    colors: {
      "editor.background": "#1e1e1e",
      "editor.foreground": "#d4d4d4",
      "editor.lineHighlightBackground": "#2a2a2a",
      "editorLineNumber.foreground": "#858585",
      "editor.selectionBackground": "#264f78",
    },
  },
};
