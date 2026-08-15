import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { openMarkdownFullPage } from "@/services/markdownFullPageView";

/**
 * The single "what happens when you open this file" rule, shared by every entry point that
 * opens a file by user action (explorer tree, the welcome screen's recent list).
 *
 * Markdown lands in the read-only full-page viewer — its Edit button switches to the editor —
 * while everything else opens an editor tab directly. A locked markdown file is the exception:
 * it goes through the normal tab, because that's where its unlock prompt lives.
 */
export function openFileForUser(fileId: string): void {
  const node = useWorkspaceStore.getState().nodes[fileId];
  if (!node || node.type !== "file") return;

  useRecentFilesStore.getState().addRecent(fileId);

  if (node.language === "markdown" && !node.locked) {
    openMarkdownFullPage(fileId);
    return;
  }
  useTabsStore.getState().openTab(fileId);
}
