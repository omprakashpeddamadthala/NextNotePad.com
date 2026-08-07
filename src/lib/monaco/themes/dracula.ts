import type { ThemeModule } from "./types";

export const dracula: ThemeModule = {
  id: "dracula",
  label: "Dracula",
  monacoThemeId: "np-dracula",
  chrome: {
    background: "#282a36",
    foreground: "#f8f8f2",
    panel: "#21222c",
    panelBorder: "#191a21",
    menuHover: "#44475a",
    toolbarBackground: "#343746",
    statusBarBackground: "#bd93f9",
    statusBarForeground: "#282a36",
    accent: "#bd93f9",
    accentForeground: "#282a36",
    tabActiveBackground: "#282a36",
    tabInactiveBackground: "#21222c",
    tabBorder: "#191a21",
    scrollbar: "#6272a4",
    isDark: true,
  },
  monacoTheme: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6272a4" },
      { token: "keyword", foreground: "ff79c6" },
      { token: "string", foreground: "f1fa8c" },
      { token: "number", foreground: "bd93f9" },
      { token: "type", foreground: "8be9fd" },
    ],
    colors: {
      "editor.background": "#282a36",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#44475a",
      "editorLineNumber.foreground": "#6272a4",
      "editor.selectionBackground": "#44475a",
    },
  },
};
