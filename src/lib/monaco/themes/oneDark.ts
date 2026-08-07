import type { ThemeModule } from "./types";

export const oneDark: ThemeModule = {
  id: "one-dark",
  label: "One Dark",
  monacoThemeId: "np-one-dark",
  chrome: {
    background: "#282c34",
    foreground: "#abb2bf",
    panel: "#21252b",
    panelBorder: "#181a1f",
    menuHover: "#2c313a",
    toolbarBackground: "#21252b",
    statusBarBackground: "#61afef",
    statusBarForeground: "#282c34",
    accent: "#61afef",
    accentForeground: "#282c34",
    tabActiveBackground: "#282c34",
    tabInactiveBackground: "#21252b",
    tabBorder: "#181a1f",
    scrollbar: "#4b5263",
    isDark: true,
  },
  monacoTheme: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5c6370" },
      { token: "keyword", foreground: "c678dd" },
      { token: "string", foreground: "98c379" },
      { token: "number", foreground: "d19a66" },
      { token: "type", foreground: "e5c07b" },
    ],
    colors: {
      "editor.background": "#282c34",
      "editor.foreground": "#abb2bf",
      "editor.lineHighlightBackground": "#2c313a",
      "editorLineNumber.foreground": "#495162",
      "editor.selectionBackground": "#3e4451",
    },
  },
};
