import type { ThemeModule } from "./types";

/** Approximates the classic Notepad++ default look: white canvas, grey chrome, blue keywords. */
export const notepadPlusPlus: ThemeModule = {
  id: "notepad-plus-plus",
  label: "Notepad++",
  monacoThemeId: "np-notepad-plus-plus",
  chrome: {
    background: "#ffffff",
    foreground: "#18181b",
    panel: "#f8f8fa",
    panelBorder: "#e4e4e9",
    menuHover: "#eef0f5",
    toolbarBackground: "#f8f8fa",
    statusBarBackground: "#1e1e24",
    statusBarForeground: "#f4f4f5",
    accent: "#2563eb",
    accentForeground: "#ffffff",
    tabActiveBackground: "#ffffff",
    tabInactiveBackground: "#f0f0f3",
    tabBorder: "#e4e4e9",
    scrollbar: "#cbd5e1",
    isDark: false,
  },
  monacoTheme: {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "008000" },
      { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
      { token: "string", foreground: "a31515" },
      { token: "number", foreground: "ff8000" },
      { token: "type", foreground: "267f99" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#18181b",
      "editor.lineHighlightBackground": "#f8f9fa",
      "editorLineNumber.foreground": "#9ca3af",
      "editor.selectionBackground": "#dbeafe",
      "editorGutter.background": "#fafafa",
    },
  },
};
