import type { ThemeModule } from "./types";

/** Approximates the classic Notepad++ default look: white canvas, grey chrome, blue keywords. */
export const notepadPlusPlus: ThemeModule = {
  id: "notepad-plus-plus",
  label: "Notepad++",
  monacoThemeId: "np-notepad-plus-plus",
  chrome: {
    background: "#ffffff",
    foreground: "#000000",
    panel: "#f0f0f0",
    panelBorder: "#c8c8c8",
    menuHover: "#dbe9f9",
    toolbarBackground: "#f3f3f3",
    statusBarBackground: "#e8e8e8",
    statusBarForeground: "#000000",
    accent: "#8f6a00",
    accentForeground: "#ffffff",
    tabActiveBackground: "#ffffff",
    tabInactiveBackground: "#e4e4e4",
    tabBorder: "#c8c8c8",
    scrollbar: "#c2c2c2",
    isDark: false,
  },
  monacoTheme: {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "008000" },
      { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
      { token: "string", foreground: "808080" },
      { token: "number", foreground: "ff8000" },
      { token: "type", foreground: "0000ff" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#000000",
      "editor.lineHighlightBackground": "#e8e8ff",
      "editorLineNumber.foreground": "#a0a0a0",
      "editor.selectionBackground": "#c0dcf3",
      "editorGutter.background": "#f0f0f0",
    },
  },
};
