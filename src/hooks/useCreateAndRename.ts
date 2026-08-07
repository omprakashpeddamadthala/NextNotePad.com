import { useWorkspaceStore } from "@/store/workspaceStore";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { useTabsStore } from "@/store/tabsStore";
import { createFile, createFolder, nextUntitledName, nextUntitledFolderName } from "@/services/fileOperations";

export function useCreateAndRename() {
  const setCollapsed = useWorkspaceStore((s) => s.setCollapsed);
  const setSelectedNodeId = useExplorerSelectionStore((s) => s.setSelectedNodeId);
  const setRenamingNodeId = useExplorerSelectionStore((s) => s.setRenamingNodeId);
  const openTab = useTabsStore((s) => s.openTab);

  async function createFileAndRename(parentId: string | null) {
    const nodes = useWorkspaceStore.getState().nodes;
    const name = nextUntitledName(nodes, parentId);
    const id = await createFile(parentId, name, "");
    if (parentId) setCollapsed(parentId, false);
    setSelectedNodeId(id);
    setRenamingNodeId(id);
    openTab(id);
    return id;
  }

  async function createFolderAndRename(parentId: string | null) {
    const nodes = useWorkspaceStore.getState().nodes;
    const name = nextUntitledFolderName(nodes, parentId);
    const id = await createFolder(parentId, name);
    if (parentId) setCollapsed(parentId, false);
    setSelectedNodeId(id);
    setRenamingNodeId(id);
    return id;
  }

  return { createFileAndRename, createFolderAndRename };
}
