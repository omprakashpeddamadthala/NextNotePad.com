import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import type { FileNode } from "@/types/file";

/** Switches the active Drive workspace, showing a cached tree instantly when one exists. */
export async function switchToWorkspace(id: string): Promise<void> {
  const { activeWorkspaceId, switchingWorkspace, switchWorkspace } =
    useMultiWorkspaceStore.getState();
  if (id === activeWorkspaceId || switchingWorkspace) return;

  const cachedTree = cloudRepo.getCachedWorkspaceTreeSync(id);
  if (cachedTree) {
    useWorkspaceStore
      .getState()
      .replaceAll(
        Object.fromEntries(cachedTree.nodes.map((node) => [node.id, node])),
      );
    useTabsStore.getState().resetSession();

    const files = cachedTree.nodes.filter(
      (n): n is FileNode => n.type === "file" && !n.deleted && !n.locked,
    );
    if (files.length > 0) {
      void cloudRepo.prefetchFileContents(
        files.map((f) => ({ id: f.id, version: f.version, size: f.size })),
        { limit: 100, concurrency: 5 },
      );
    }

    void (async () => {
      try {
        await switchWorkspace(id, { background: true });
        const fresh = await cloudRepo.fetchWorkspaceTree(id, {
          background: true,
        });
        if (useMultiWorkspaceStore.getState().activeWorkspaceId === id) {
          useWorkspaceStore
            .getState()
            .replaceAll(
              Object.fromEntries(fresh.nodes.map((node) => [node.id, node])),
            );
        }
      } catch {}
    })();
    return;
  }

  const treePromise = cloudRepo.fetchWorkspaceTree(id, {
    onFresh: (fresh) => {
      if (
        useMultiWorkspaceStore.getState().activeWorkspaceId ===
        fresh.workspaceId
      ) {
        useWorkspaceStore
          .getState()
          .replaceAll(
            Object.fromEntries(fresh.nodes.map((node) => [node.id, node])),
          );
      }
    },
  });
  void treePromise.catch(() => undefined);
  const switched = await switchWorkspace(id);
  if (!switched) {
    return;
  }

  try {
    const data = await treePromise;
    useWorkspaceStore
      .getState()
      .replaceAll(Object.fromEntries(data.nodes.map((n) => [n.id, n])));
  } catch {
    useWorkspaceStore.getState().clearWorkspace();
  }
  useTabsStore.getState().resetSession();
}
