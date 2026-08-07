import type { editor } from "monaco-editor";
import type { ThemeDefinition } from "@/types/theme";

export interface ThemeModule extends ThemeDefinition {
  monacoTheme: editor.IStandaloneThemeData;
}
