import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { closeAllSpecialViews } from "@/services/specialViews";

export function openFileForUser(fileId: string): void {
  const node = useWorkspaceStore.getState().nodes[fileId];
  if (!node || node.type !== "file") return;

  useRecentFilesStore.getState().addRecent(fileId);

  closeAllSpecialViews();
  useTabsStore.getState().openTab(fileId);
}
