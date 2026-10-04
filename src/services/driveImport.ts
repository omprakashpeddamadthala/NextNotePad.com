import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import type { WorkspaceNode } from "@/types/file";
import type { NodeMap } from "@/lib/utils/treeUtils";

function toNodeMap(nodes: WorkspaceNode[]): NodeMap {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

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
