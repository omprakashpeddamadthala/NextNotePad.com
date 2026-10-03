import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useMigrationPromptStore } from "@/store/migrationPromptStore";
import * as localRepo from "@/services/storage/workspaceRepository";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import type { WorkspaceNode } from "@/types/file";
import type { NodeMap } from "@/lib/utils/treeUtils";
import { prefetchFileContents } from "@/services/storage/driveDataClient";
import { useAuthStore } from "@/store/authStore";

const MIGRATION_PENDING_PREFIX = "np-guest-migration-pending:";

function migrationPendingKey(): string | null {
  const userId = useAuthStore.getState().user?.id;
  return userId ? `${MIGRATION_PENDING_PREFIX}${userId}` : null;
}

function isMigrationPending(): boolean {
  const key = migrationPendingKey();
  if (!key || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setMigrationPending(pending: boolean): void {
  const key = migrationPendingKey();
  if (!key || typeof window === "undefined") return;
  try {
    if (pending) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // The guest snapshot remains intact even if this retry hint cannot be persisted.
  }
}

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
export async function migrateOrLoadCloudWorkspace(): Promise<string | null> {
  let cloudNodes: WorkspaceNode[] = [];
  let hasAnyHistory = false;
  let loadedWorkspaceId: string | null = null;
  const retryPendingMigration = isMigrationPending();
  const guestNodeList = Object.values(
    useWorkspaceStore.getState().nodes,
  ).filter((node) => !node.deleted);

  try {
    const tree = await cloudRepo.fetchWorkspaceTree(undefined, {
      onFresh: (fresh) => {
        if (
          useMultiWorkspaceStore.getState().activeWorkspaceId ===
          fresh.workspaceId
        ) {
          useWorkspaceStore.getState().replaceAll(toNodeMap(fresh.nodes));
        }
      },
    });
    cloudNodes = tree.nodes;
    hasAnyHistory = tree.hasAnyHistory;
    loadedWorkspaceId = tree.workspaceId;
  } catch (err) {
    console.error("Failed to load cloud workspace tree:", err);
    useWorkspaceStore.getState().replaceAll({});
    useTabsStore.getState().resetSession();
    return null;
  }

  if ((!hasAnyHistory || retryPendingMigration) && guestNodeList.length > 0) {
    // Never make the one-time migration decision from a cached empty tree. A returning user may
    // have deleted every visible item, while `hasAnyHistory` still prevents resurrecting an old
    // guest snapshot.
    const verified = await cloudRepo.fetchWorkspaceTree(undefined, {
      force: true,
      background: true,
    });
    cloudNodes = verified.nodes;
    hasAnyHistory = verified.hasAnyHistory;
    loadedWorkspaceId = verified.workspaceId;
  }

  if ((!hasAnyHistory || retryPendingMigration) && guestNodeList.length > 0) {
    const fileCount = guestNodeList.filter((n) => n.type === "file").length;
    const accepted =
      retryPendingMigration ||
      (await useMigrationPromptStore.getState().request(fileCount));
    if (!accepted) {
      setMigrationPending(false);
      useWorkspaceStore.getState().replaceAll(toNodeMap(cloudNodes));
      useTabsStore.getState().resetSession();
      return loadedWorkspaceId;
    }

    const payload = await Promise.all(
      guestNodeList.map(async (n) => ({
        id: n.id,
        parentId: n.parentId,
        name: n.name,
        type: n.type,
        ...(n.type === "file"
          ? {
              language: n.language,
              encoding: n.encoding,
              content: await localRepo.readFileContent(n.id),
              locked: n.locked,
              encryptionSalt: n.encryptionSalt,
              encryptionIv: n.encryptionIv,
            }
          : {}),
      })),
    );

    try {
      setMigrationPending(true);
      const { idMap } = await cloudRepo.importWorkspace(payload);
      useTabsStore.getState().remapFileIds(idMap);
      const { nodes: freshNodes, workspaceId } =
        await cloudRepo.fetchWorkspaceTree();
      useWorkspaceStore.getState().replaceAll(toNodeMap(freshNodes));
      loadedWorkspaceId = workspaceId;
      setMigrationPending(false);
      const count = Object.keys(idMap).length;
      toast.success(
        `Signed in — migrated ${count} item${count === 1 ? "" : "s"} to your cloud workspace.`,
      );
    } catch (err) {
      console.error("Guest workspace migration failed:", err);
      toast.error(
        "Couldn't migrate your local files to the cloud. They're still safe in this browser.",
      );
      // Leave the (still-empty) cloud tree as the source of truth and drop any tabs referencing
      // guest ids — status is already "authenticated", so leaving them would 404 against the cloud repo.
      useWorkspaceStore.getState().replaceAll(toNodeMap(cloudNodes));
      useTabsStore.getState().resetSession();
    }
    return loadedWorkspaceId;
  }

  useWorkspaceStore.getState().replaceAll(toNodeMap(cloudNodes));
  useTabsStore.getState().resetSession();
  const recentIds = new Set(
    useRecentFilesStore
      .getState()
      .recent.slice(0, 8)
      .map((entry) => entry.fileId),
  );
  void prefetchFileContents(
    cloudNodes
      .filter(
        (node): node is Extract<WorkspaceNode, { type: "file" }> =>
          node.type === "file" && recentIds.has(node.id),
      )
      .map((node) => ({
        id: node.id,
        version: node.version,
        size: node.size,
      })),
  );
  return loadedWorkspaceId;
}
