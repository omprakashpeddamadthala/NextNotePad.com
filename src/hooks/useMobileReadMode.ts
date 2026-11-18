import { useActiveFile } from "@/hooks/useActiveFile";
import { useUIStore } from "@/store/uiStore";
import type { FileNode } from "@/types/file";

export function isMarkdownNode(node: FileNode): boolean {
  const name = node.name.toLowerCase();
  return (
    node.language === "markdown" ||
    name.endsWith(".md") ||
    name.endsWith(".markdown")
  );
}

/**
 * Read/Edit state of the active note on phones. Markdown notes reuse the
 * existing rendered view; every other note uses the plain-text read view.
 */
export function useMobileReadMode() {
  const { file } = useActiveFile();
  const mobileReadMode = useUIStore((s) => s.mobileReadMode);
  const toggleMobileReadMode = useUIStore((s) => s.toggleMobileReadMode);
  const markdownEditingFileIds = useUIStore((s) => s.markdownEditingFileIds);
  const setMarkdownEditing = useUIStore((s) => s.setMarkdownEditing);

  const canToggle = Boolean(file && !file.locked);
  const isMarkdown = file ? isMarkdownNode(file) : false;
  const reading = !canToggle
    ? false
    : isMarkdown
      ? !markdownEditingFileIds[file!.id]
      : mobileReadMode;

  function toggle() {
    if (!file || !canToggle) return;
    if (isMarkdown) setMarkdownEditing(file.id, reading);
    else toggleMobileReadMode();
  }

  return { canToggle, reading, toggle };
}
