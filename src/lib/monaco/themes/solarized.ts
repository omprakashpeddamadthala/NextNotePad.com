import type { ThemeModule } from "./types";

export const solarized: ThemeModule = {
  id: "solarized",
  label: "Solarized",
  monacoThemeId: "np-solarized",
  chrome: {
    background: "#002b36",
    foreground: "#839496",
    panel: "#073642",
    panelBorder: "#0a4a5a",
    menuHover: "#0a4a5a",
    toolbarBackground: "#073642",
    statusBarBackground: "#268bd2",
    statusBarForeground: "#fdf6e3",
    accent: "#268bd2",
    accentForeground: "#fdf6e3",
    tabActiveBackground: "#002b36",
    tabInactiveBackground: "#073642",
    tabBorder: "#0a4a5a",
    scrollbar: "#586e75",
    isDark: true,
  },
  monacoTheme: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "586e75" },
      { token: "keyword", foreground: "859900" },
      { token: "string", foreground: "2aa198" },
      { token: "number", foreground: "d33682" },
      { token: "type", foreground: "b58900" },
    ],
    colors: {
      "editor.background": "#002b36",
      "editor.foreground": "#839496",
      "editor.lineHighlightBackground": "#073642",
      "editorLineNumber.foreground": "#586e75",
      "editor.selectionBackground": "#274642",
    },
  },
};
