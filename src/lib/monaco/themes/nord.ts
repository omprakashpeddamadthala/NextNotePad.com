import type { ThemeModule } from "./types";

export const nord: ThemeModule = {
  id: "nord",
  label: "Nord",
  monacoThemeId: "np-nord",
  chrome: {
    background: "#2e3440",
    foreground: "#d8dee9",
    panel: "#3b4252",
    panelBorder: "#434c5e",
    menuHover: "#434c5e",
    toolbarBackground: "#3b4252",
    statusBarBackground: "#5e81ac",
    statusBarForeground: "#eceff4",
    accent: "#88c0d0",
    accentForeground: "#2e3440",
    tabActiveBackground: "#2e3440",
    tabInactiveBackground: "#3b4252",
    tabBorder: "#434c5e",
    scrollbar: "#4c566a",
    isDark: true,
  },
  monacoTheme: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "616e88" },
      { token: "keyword", foreground: "81a1c1" },
      { token: "string", foreground: "a3be8c" },
      { token: "number", foreground: "b48ead" },
      { token: "type", foreground: "8fbcbb" },
    ],
    colors: {
      "editor.background": "#2e3440",
      "editor.foreground": "#d8dee9",
      "editor.lineHighlightBackground": "#3b4252",
      "editorLineNumber.foreground": "#4c566a",
      "editor.selectionBackground": "#434c5e",
    },
  },
};
