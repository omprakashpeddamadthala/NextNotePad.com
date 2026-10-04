import type { ThemeModule } from "./types";

export const vsCode: ThemeModule = {
  id: "vs-code",
  label: "High Contrast",
  monacoThemeId: "np-high-contrast",
  chrome: {
    background: "#000000",
    foreground: "#FFFFFF",
    panel: "#141414",
    panelBorder: "#595959",
    menuHover: "#2A2A2A",
    toolbarBackground: "#141414",
    statusBarBackground: "#000000",
    statusBarForeground: "#FFFFFF",
    accent: "#6897BB",
    accentForeground: "#000000",
    tabActiveBackground: "#1F1F1F",
    tabInactiveBackground: "#000000",
    tabBorder: "#595959",
    scrollbar: "#595959",
    isDark: true,
  },
  monacoTheme: {
    base: "hc-black",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7CAE82", fontStyle: "italic" },
      { token: "keyword", foreground: "CC7832" },
      { token: "string", foreground: "6A8759" },
      { token: "number", foreground: "6897BB" },
    ],
    colors: {
      "editor.background": "#000000",
      "editor.foreground": "#FFFFFF",
      "editor.lineHighlightBackground": "#1A1A1A",
      "editorLineNumber.foreground": "#8C8C8C",
      "editorLineNumber.activeForeground": "#FFFFFF",
      "editor.selectionBackground": "#214283",
      "editorCursor.foreground": "#FFFFFF",
    },
  },
};
