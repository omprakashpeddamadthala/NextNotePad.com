import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useMarkdownFullPageViewStore } from "@/store/markdownFullPageViewStore";
import { closeAllSpecialViews } from "@/services/specialViews";

/** Opens the full-page rendered markdown view for `fileId`, replacing the tab content — the same
 *  read-only render as the side-by-side preview, just without the editor taking half the space. */
export function openMarkdownFullPage(fileId: string): void {
  const node = useWorkspaceStore.getState().nodes[fileId];
  if (node?.type === "file" && node.locked) {
    toast.error(`"${node.name}" is locked — unlock it first to view it.`);
    return;
  }
  closeAllSpecialViews();
  useMarkdownFullPageViewStore.getState().openFullPage(fileId);
}
