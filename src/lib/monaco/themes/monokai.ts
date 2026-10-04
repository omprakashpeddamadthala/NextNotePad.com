import type { ThemeModule } from "./types";

export const monokai: ThemeModule = {
  id: "monokai",
  label: "Monokai",
  monacoThemeId: "np-monokai",
  chrome: {
    background: "#272822",
    foreground: "#f8f8f2",
    panel: "#2d2e27",
    panelBorder: "#3e3d32",
    menuHover: "#3e3d32",
    toolbarBackground: "#3e3d32",
    statusBarBackground: "#414339",
    statusBarForeground: "#f8f8f2",
    accent: "#a6e22e",
    accentForeground: "#272822",
    tabActiveBackground: "#272822",
    tabInactiveBackground: "#3e3d32",
    tabBorder: "#1e1f1c",
    scrollbar: "#75715e",
    isDark: true,
  },
  monacoTheme: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715e" },
      { token: "keyword", foreground: "f92672" },
      { token: "string", foreground: "e6db74" },
      { token: "number", foreground: "ae81ff" },
      { token: "type", foreground: "66d9ef" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#3e3d32",
      "editorLineNumber.foreground": "#90908a",
      "editor.selectionBackground": "#49483e",
    },
  },
};
