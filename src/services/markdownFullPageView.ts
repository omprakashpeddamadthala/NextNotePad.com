import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useMarkdownFullPageViewStore } from "@/store/markdownFullPageViewStore";
import { closeAllSpecialViews } from "@/services/specialViews";

export function openMarkdownFullPage(fileId: string): void {
  const node = useWorkspaceStore.getState().nodes[fileId];
  if (node?.type === "file" && node.locked) {
    toast.error(`"${node.name}" is locked — unlock it first to view it.`);
    return;
  }
  closeAllSpecialViews();
  useMarkdownFullPageViewStore.getState().openFullPage(fileId);
}
