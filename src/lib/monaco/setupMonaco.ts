import type { Monaco } from "@monaco-editor/react";
import { registerMonacoThemes } from "./themes";

/** Passed as `beforeMount` to every `<Editor />` instance. */
export function handleMonacoBeforeMount(monaco: Monaco): void {
  registerMonacoThemes(monaco);
}
