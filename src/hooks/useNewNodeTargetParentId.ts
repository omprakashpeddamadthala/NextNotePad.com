import { useWorkspaceStore } from "@/store/workspaceStore";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";

/** Where a "New File"/"New Folder" action should land: inside the selected folder, or beside the selected file. */
export function useNewNodeTargetParentId(): string | null {
  const selectedNodeId = useExplorerSelectionStore((s) => s.selectedNodeId);
  const nodes = useWorkspaceStore((s) => s.nodes);
  if (!selectedNodeId) return null;
  const node = nodes[selectedNodeId];
  if (!node) return null;
  return node.type === "folder" ? node.id : node.parentId;
}
