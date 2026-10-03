import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import type { WorkspaceNode } from "@/types/file";
import type { NodeMap } from "@/lib/utils/treeUtils";

function toNodeMap(nodes: WorkspaceNode[]): NodeMap {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

/** Re-reads the active workspace tree from Drive (the source of truth) — picks up changes made
 *  from another device/tab since this page loaded. Nodes already in memory keep their local
 *  state (open tabs, unsaved edits live in the editor models, not in the tree). */
export async function syncFromDrive(): Promise<void> {
  try {
    const before = Object.keys(useWorkspaceStore.getState().nodes).length;
    const { nodes } = await cloudRepo.fetchWorkspaceTree();
    useWorkspaceStore.getState().replaceAll(toNodeMap(nodes));
    const diff = nodes.length - before;
    toast.success(
      diff > 0
        ? `Refreshed from Drive — ${diff} new item${diff === 1 ? "" : "s"}.`
        : "Up to date with Google Drive.",
    );
  } catch {
    toast.error(
      "Couldn't refresh from Drive — check your connection and try again.",
    );
  }
}
