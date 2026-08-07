import type { Monaco } from "@monaco-editor/react";
import type { ThemeName } from "@/types/theme";
import type { ThemeModule } from "./types";
import { notepadLight } from "./notepadLight";
import { notepadDark } from "./notepadDark";
import { notepadPlusPlus } from "./notepadPlusPlus";
import { vsCode } from "./vsCode";
import { monokai } from "./monokai";
import { dracula } from "./dracula";
import { solarized } from "./solarized";
import { nord } from "./nord";
import { oneDark } from "./oneDark";

export const THEME_MODULES: Record<ThemeName, ThemeModule> = {
  "notepad-light": notepadLight,
  "notepad-dark": notepadDark,
  "notepad-plus-plus": notepadPlusPlus,
  "vs-code": vsCode,
  monokai,
  dracula,
  solarized,
  nord,
  "one-dark": oneDark,
};

let registered = false;

export function registerMonacoThemes(monaco: Monaco): void {
  if (registered) return;
  for (const theme of Object.values(THEME_MODULES)) {
    monaco.editor.defineTheme(theme.monacoThemeId, theme.monacoTheme);
  }
  registered = true;
}
