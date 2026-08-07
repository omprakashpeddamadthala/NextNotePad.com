import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useMigrationPromptStore } from "@/store/migrationPromptStore";
import * as localRepo from "@/services/storage/workspaceRepository";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import type { WorkspaceNode } from "@/types/file";
import type { NodeMap } from "@/lib/utils/treeUtils";

function toNodeMap(nodes: WorkspaceNode[]): NodeMap {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

/**
 * Called right after `authStore` flips to "authenticated". First-ever login with existing
 * guest files migrates them into the new cloud workspace (guest data in localStorage is left
 * untouched — see `guestOnlyLocalStorage`). Returning users just get their cloud tree loaded.
 *
 * Migration is gated on `hasAnyHistory` (has this workspace ever had a row, even a since-deleted
 * one) rather than "current cloud tree is empty" — a returning user who deletes everything and
 * reloads would otherwise look identical to a brand-new account, re-triggering migration and
 * resurrecting the guest snapshot's (stale, frozen) files that were already deleted from the cloud.
 *
 * Before migrating, asks the user via `SyncOfflineFilesDialog` (rendered in `AppShell`) — signing
 * in shouldn't silently push local-only content to Drive without consent.
 */
export async function migrateOrLoadCloudWorkspace(): Promise<void> {
  const { nodes: cloudNodes, hasAnyHistory } = await cloudRepo.fetchWorkspaceTree();
  const guestNodeList = Object.values(useWorkspaceStore.getState().nodes).filter((n) => !n.deleted);

  if (!hasAnyHistory && guestNodeList.length > 0) {
    const fileCount = guestNodeList.filter((n) => n.type === "file").length;
    const accepted = await useMigrationPromptStore.getState().request(fileCount);
    if (!accepted) {
      useWorkspaceStore.getState().replaceAll(toNodeMap(cloudNodes));
      useTabsStore.getState().resetSession();
      return;
    }

    const payload = await Promise.all(
      guestNodeList.map(async (n) => ({
        id: n.id,
        parentId: n.parentId,
        name: n.name,
        type: n.type,
        ...(n.type === "file"
          ? { language: n.language, encoding: n.encoding, content: await localRepo.readFileContent(n.id) }
          : {}),
      })),
    );

    try {
      const { idMap } = await cloudRepo.importWorkspace(payload);
      useTabsStore.getState().remapFileIds(idMap);
      const { nodes: freshNodes } = await cloudRepo.fetchWorkspaceTree();
      useWorkspaceStore.getState().replaceAll(toNodeMap(freshNodes));
      const count = Object.keys(idMap).length;
      toast.success(`Signed in — migrated ${count} item${count === 1 ? "" : "s"} to your cloud workspace.`);
    } catch (err) {
      console.error("Guest workspace migration failed:", err);
      toast.error("Couldn't migrate your local files to the cloud. They're still safe in this browser.");
      // Leave the (still-empty) cloud tree as the source of truth and drop any tabs referencing
      // guest ids — status is already "authenticated", so leaving them would 404 against the cloud repo.
      useWorkspaceStore.getState().replaceAll(toNodeMap(cloudNodes));
      useTabsStore.getState().resetSession();
    }
    return;
  }

  useWorkspaceStore.getState().replaceAll(toNodeMap(cloudNodes));
  useTabsStore.getState().resetSession();
}
