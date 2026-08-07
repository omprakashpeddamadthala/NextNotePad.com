import type { ThemeModule } from "./types";

export const vsCode: ThemeModule = {
  id: "vs-code",
  label: "VS Code",
  monacoThemeId: "np-vs-code",
  chrome: {
    background: "#1e1e1e",
    foreground: "#cccccc",
    panel: "#252526",
    panelBorder: "#1e1e1e",
    menuHover: "#2a2d2e",
    toolbarBackground: "#333333",
    statusBarBackground: "#007acc",
    statusBarForeground: "#ffffff",
    accent: "#007acc",
    accentForeground: "#ffffff",
    tabActiveBackground: "#1e1e1e",
    tabInactiveBackground: "#2d2d2d",
    tabBorder: "#252526",
    scrollbar: "#424242",
    isDark: true,
  },
  monacoTheme: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6a9955" },
      { token: "keyword", foreground: "c586c0" },
      { token: "string", foreground: "ce9178" },
      { token: "number", foreground: "b5cea8" },
      { token: "type", foreground: "4ec9b0" },
    ],
    colors: {
      "editor.background": "#1e1e1e",
      "editor.foreground": "#cccccc",
      "editor.lineHighlightBackground": "#2a2a2a",
      "editorLineNumber.foreground": "#858585",
      "editor.selectionBackground": "#264f78",
    },
  },
};
