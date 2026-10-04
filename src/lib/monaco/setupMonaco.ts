import type { Monaco } from "@monaco-editor/react";
import { registerMonacoThemes } from "./themes";

export function handleMonacoBeforeMount(monaco: Monaco): void {
  registerMonacoThemes(monaco);
}
