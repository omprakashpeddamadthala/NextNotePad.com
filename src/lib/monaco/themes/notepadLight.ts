import type { ThemeModule } from "./types";

export const notepadLight: ThemeModule = {
  id: "notepad-light",
  label: "Light",
  monacoThemeId: "np-notepad-light",
  chrome: {
    background: "#ffffff",
    foreground: "#1f1f1f",
    panel: "#f5f5f5",
    panelBorder: "#e0e0e0",
    menuHover: "#e8e8e8",
    toolbarBackground: "#f3f3f3",
    statusBarBackground: "#0078d4",
    statusBarForeground: "#ffffff",
    accent: "#0078d4",
    accentForeground: "#ffffff",
    tabActiveBackground: "#ffffff",
    tabInactiveBackground: "#ececec",
    tabBorder: "#d9d9d9",
    scrollbar: "#c2c2c2",
    isDark: false,
  },
  monacoTheme: {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "008000" },
      { token: "keyword", foreground: "0000ff" },
      { token: "string", foreground: "a31515" },
      { token: "number", foreground: "098658" },
      { token: "type", foreground: "267f99" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#1f1f1f",
      "editor.lineHighlightBackground": "#f0f0f0",
      "editorLineNumber.foreground": "#858585",
      "editor.selectionBackground": "#add6ff",
    },
  },
};
