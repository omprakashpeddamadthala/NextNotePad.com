import type { WorkspaceNode } from "@/types/file";
import { ApiError, fetchJson, fetchOk, jsonBody } from "@/lib/api/fetchJson";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import {
  getCachedDriveFileIndexSync,
  getCachedWorkspaceListSync,
  getCachedWorkspaceTreeSync,
  hasCachedWorkspaceTreeSync,
  invalidateDriveFileIndex,
  invalidateFileContent,
  invalidateWorkspaceTree,
  loadActiveWorkspaceTree,
  loadWorkspaceTree,
  prefetchFileContents,
  readDriveFileContent,
  removeCachedTreeNode,
  updateCachedTreeNode,
  writeCachedFileContent,
} from "./driveDataClient";

export {
  getCachedDriveFileIndexSync,
  getCachedWorkspaceListSync,
  getCachedWorkspaceTreeSync,
  hasCachedWorkspaceTreeSync,
  prefetchFileContents,
};

// --- Same shape as the local repository (services/storage/workspaceRepository.ts) ---

export async function readFileContent(fileId: string): Promise<string> {
  const node = useWorkspaceStore.getState().nodes[fileId];
  return readDriveFileContent(
    fileId,
    node?.type === "file" ? node.version : undefined,
    { background: true },
  );
}

export async function writeFileContent(
  fileId: string,
  content: string,
): Promise<void> {
  await fetchOk(`/api/files/${fileId}`, {
    ...jsonBody("PATCH", { content }),
    action: "Save file",
    background: true,
  });
  const node = useWorkspaceStore.getState().nodes[fileId];
  await writeCachedFileContent(
    fileId,
    content,
    node?.type === "file" ? node.version : undefined,
  );
}

export async function deleteFileContent(fileId: string): Promise<void> {
  await fetchOk(`/api/files/${fileId}`, {
    method: "DELETE",
    action: "Delete file",
    background: true,
  });
  const wsId = activeWorkspaceId();
  await Promise.all([
    invalidateFileContent(fileId),
    wsId ? removeCachedTreeNode(wsId, fileId) : invalidateActiveTree(),
    invalidateDriveFileIndex(),
  ]);
}

export async function duplicateFileContent(
  sourceId: string,
  targetId: string,
): Promise<void> {
  const content = await readFileContent(sourceId);
  await writeFileContent(targetId, content);
}

export async function estimateStorageUsage(): Promise<null> {
  return null; // N/A server-side in Phase 2a
}

// --- Cloud-only metadata operations, used by fileOperations.ts when authenticated ---

function activeWorkspaceId(): string | null {
  return useMultiWorkspaceStore.getState().activeWorkspaceId;
}

async function invalidateActiveTree(): Promise<void> {
  const workspaceId = activeWorkspaceId();
  if (workspaceId) await invalidateWorkspaceTree(workspaceId);
}

export async function fetchWorkspaceTree(
  workspaceId = activeWorkspaceId(),
  options: {
    force?: boolean;
    background?: boolean;
    onFresh?: (value: {
      nodes: WorkspaceNode[];
      hasAnyHistory: boolean;
      workspaceId: string;
    }) => void;
  } = {},
): Promise<{
  nodes: WorkspaceNode[];
  hasAnyHistory: boolean;
  workspaceId: string;
}> {
  const load = async () => {
    if (!workspaceId) return loadActiveWorkspaceTree(options);
    try {
      return await loadWorkspaceTree(workspaceId, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404)
        return loadActiveWorkspaceTree(options);
      throw error;
    }
  };

  const result = await load();

  // Pre-load all files in the workspace immediately so clicking any file displays content with zero wait
  const fileNodes = result.nodes.filter(
    (n): n is Extract<WorkspaceNode, { type: "file" }> =>
      n.type === "file" && !n.deleted && !n.locked,
  );
  if (fileNodes.length > 0) {
    void prefetchFileContents(
      fileNodes.map((f) => ({ id: f.id, version: f.version, size: f.size })),
      { limit: 100, concurrency: 5 },
    );
  }

  return result;
}

export async function createCloudFile(
  parentId: string | null,
  name: string,
  content: string,
): Promise<WorkspaceNode> {
  const wsId = activeWorkspaceId();
  const query = wsId ? `?${new URLSearchParams({ workspaceId: wsId })}` : "";
  const node = await fetchJson<WorkspaceNode>(`/api/files${query}`, {
    ...jsonBody("POST", { parentId, name, content }),
    action: "Create file",
    background: true,
  });
  await Promise.all([
    writeCachedFileContent(node.id, content, node.version),
    wsId ? updateCachedTreeNode(wsId, node) : invalidateActiveTree(),
    invalidateDriveFileIndex(),
  ]);
  return node;
}

export async function createCloudFolder(
  parentId: string | null,
  name: string,
): Promise<WorkspaceNode> {
  const wsId = activeWorkspaceId();
  const query = wsId ? `?${new URLSearchParams({ workspaceId: wsId })}` : "";
  const node = await fetchJson<WorkspaceNode>(`/api/folders${query}`, {
    ...jsonBody("POST", { parentId, name }),
    action: "Create folder",
    background: true,
  });
  if (wsId) {
    await updateCachedTreeNode(wsId, node);
  } else {
    await invalidateActiveTree();
  }
  return node;
}

export async function patchCloudFile(
  fileId: string,
  patch: {
    name?: string;
    parentId?: string | null;
    language?: string;
    hidden?: boolean;
    content?: string;
    locked?: boolean;
    encryptionSalt?: string | null;
    encryptionIv?: string | null;
  },
): Promise<WorkspaceNode> {
  const wsId = activeWorkspaceId();
  const query = wsId ? `?${new URLSearchParams({ workspaceId: wsId })}` : "";
  const node = await fetchJson<WorkspaceNode>(`/api/files/${fileId}${query}`, {
    ...jsonBody("PATCH", patch),
    action: "Update file",
    background: true,
  });
  if (patch.content !== undefined)
    await writeCachedFileContent(fileId, patch.content, node.version);
  if (
    patch.name !== undefined ||
    patch.parentId !== undefined ||
    patch.hidden !== undefined
  ) {
    if (wsId) {
      await updateCachedTreeNode(wsId, node);
    } else {
      await Promise.all([invalidateActiveTree(), invalidateDriveFileIndex()]);
    }
  }
  return node;
}

export async function patchCloudFolder(
  folderId: string,
  patch: {
    name?: string;
    parentId?: string | null;
    collapsed?: boolean;
    hidden?: boolean;
  },
): Promise<WorkspaceNode> {
  const wsId = activeWorkspaceId();
  const query = wsId ? `?${new URLSearchParams({ workspaceId: wsId })}` : "";
  const node = await fetchJson<WorkspaceNode>(
    `/api/folders/${folderId}${query}`,
    {
      ...jsonBody("PATCH", patch),
      action: "Update folder",
      background: true,
    },
  );
  if (
    patch.name !== undefined ||
    patch.parentId !== undefined ||
    patch.hidden !== undefined
  ) {
    if (wsId) {
      await updateCachedTreeNode(wsId, node);
    } else {
      await Promise.all([invalidateActiveTree(), invalidateDriveFileIndex()]);
    }
  }
  return node;
}

export async function deleteCloudFolder(folderId: string): Promise<void> {
  const wsId = activeWorkspaceId();
  const query = wsId ? `?${new URLSearchParams({ workspaceId: wsId })}` : "";
  await fetchOk(`/api/folders/${folderId}${query}`, {
    method: "DELETE",
    action: "Delete folder",
    background: true,
  });
  if (wsId) {
    await removeCachedTreeNode(wsId, folderId);
  } else {
    await Promise.all([invalidateActiveTree(), invalidateDriveFileIndex()]);
  }
}

export interface ImportNodeInput {
  id: string;
  parentId: string | null;
  name: string;
  type: "file" | "folder";
  language?: string;
  encoding?: string;
  content?: string;
  locked?: boolean;
  encryptionSalt?: string | null;
  encryptionIv?: string | null;
}

export async function importWorkspace(
  nodes: ImportNodeInput[],
): Promise<{ idMap: Record<string, string> }> {
  const result = await fetchJson<{ idMap: Record<string, string> }>(
    "/api/workspace/import",
    {
      // A full guest-workspace migration can be much larger than a normal request, so it gets a
      // longer leash than the default timeout before being treated as hung.
      ...jsonBody("POST", { nodes }),
      action: "Import workspace",
      timeoutMs: 60000,
    },
  );
  await Promise.all([invalidateActiveTree(), invalidateDriveFileIndex()]);
  return result;
}
