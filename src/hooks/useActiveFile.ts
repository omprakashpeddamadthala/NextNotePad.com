import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { FileNode, Tab } from "@/types/file";

export interface ActiveFileInfo {
  tab: Tab | null;
  file: FileNode | null;
}

export function useActiveFile(): ActiveFileInfo {
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const tabs = useTabsStore((s) => s.tabs);
  const nodes = useWorkspaceStore((s) => s.nodes);

  const tab = tabs.find((t) => t.id === activeTabId) ?? null;
  const node = tab ? nodes[tab.fileId] : undefined;
  const file = node && node.type === "file" ? node : null;

  return { tab, file };
}
