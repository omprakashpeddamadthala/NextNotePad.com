import { toast } from "sonner";
import { readNoteContent } from "@/services/copyNote";
import { renderMarkdown } from "@/lib/markdown/renderMarkdown";
import { useWorkspaceStore } from "@/store/workspaceStore";

const PRINT_CSS = `
  @page { margin: 18mm 16mm; }
  body { font: 11pt/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; margin: 0; }
  header { border-bottom: 1px solid #ccc; padding-bottom: 6pt; margin-bottom: 14pt; font-weight: 600; }
  pre { font: 10pt/1.5 ui-monospace, "JetBrains Mono", Consolas, monospace; white-space: pre-wrap; word-break: break-word; margin: 0; }
  .md img { max-width: 100%; }
  .md pre, .md code { font-family: ui-monospace, Consolas, monospace; font-size: 9.5pt; background: #f4f4f5; }
  .md pre { padding: 8pt; border-radius: 4pt; }
  .md table { border-collapse: collapse; }
  .md th, .md td { border: 1px solid #ccc; padding: 4pt 6pt; }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isMarkdown(name: string, language: string): boolean {
  return language === "markdown" || /\.(md|markdown)$/i.test(name);
}

/**
 * Prints one note through a hidden frame, so the app layout never ends up on
 * paper. Plain text prints as monospace; Markdown prints rendered.
 */
export async function printNote(fileId: string): Promise<void> {
  const node = useWorkspaceStore.getState().nodes[fileId];
  if (!node || node.type !== "file") return;
  if (node.locked) {
    toast.error("Unlock this note before printing it.");
    return;
  }

  let content: string;
  try {
    content = await readNoteContent(fileId);
  } catch {
    toast.error("Couldn't read this note to print it.");
    return;
  }

  const body = isMarkdown(node.name, node.language)
    ? `<div class="md">${renderMarkdown(content)}</div>`
    : `<pre>${escapeHtml(content)}</pre>`;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  // No scripts inside the frame; the parent calls print() on it.
  frame.setAttribute("sandbox", "allow-same-origin allow-modals");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    node.name,
  )}</title><style>${PRINT_CSS}</style></head><body><header>${escapeHtml(
    node.name,
  )}</header>${body}</body></html>`;

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return;
    win.addEventListener("afterprint", () => frame.remove());
    win.focus();
    win.print();
  };
  document.body.appendChild(frame);
}
