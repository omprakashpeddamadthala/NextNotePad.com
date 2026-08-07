export type ThemeName =
  | "notepad-light"
  | "notepad-dark"
  | "notepad-plus-plus"
  | "vs-code"
  | "monokai"
  | "dracula"
  | "solarized"
  | "nord"
  | "one-dark";

interface ChromeColors {
  background: string;
  foreground: string;
  panel: string;
  panelBorder: string;
  menuHover: string;
  toolbarBackground: string;
  statusBarBackground: string;
  statusBarForeground: string;
  accent: string;
  accentForeground: string;
  tabActiveBackground: string;
  tabInactiveBackground: string;
  tabBorder: string;
  scrollbar: string;
  isDark: boolean;
}

export interface ThemeDefinition {
  id: ThemeName;
  label: string;
  monacoThemeId: string;
  chrome: ChromeColors;
}
