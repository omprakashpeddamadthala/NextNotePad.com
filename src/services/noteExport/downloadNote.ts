import { toast } from "sonner";
import { readNoteContent } from "@/services/copyNote";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { downloadFileName, encodeText } from "./encodeText";

/** Saves one note to the computer as a file, in the note's own encoding. */
export async function downloadNote(fileId: string): Promise<void> {
  const node = useWorkspaceStore.getState().nodes[fileId];
  if (!node || node.type !== "file") return;
  if (node.locked) {
    toast.error("Unlock this note before downloading it.");
    return;
  }

  let content: string;
  try {
    content = await readNoteContent(fileId);
  } catch {
    toast.error("Couldn't read this note to download it.");
    return;
  }

  const bytes = encodeText(content, node.encoding);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "text/plain",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadFileName(node.name, node.language);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
