import type { WorkspaceNode } from "@/types/file";
import { ApiError, fetchJson, fetchOk, jsonBody } from "@/lib/api/fetchJson";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import {
  invalidateDriveFileIndex,
  invalidateFileContent,
  invalidateWorkspaceTree,
  loadActiveWorkspaceTree,
  loadWorkspaceTree,
  readDriveFileContent,
  writeCachedFileContent,
} from "./driveDataClient";
import { withWorkspaceMutation } from "./workspaceMutationGuard";

// --- Same shape as the local repository (services/storage/workspaceRepository.ts) ---

const fileMutationQueues = new Map<string, Promise<void>>();

function enqueueFileMutation<T>(
  fileId: string,
  mutation: () => Promise<T>,
): Promise<T> {
  const previous = fileMutationQueues.get(fileId) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(mutation);
  const tail = result.then(
    () => undefined,
    () => undefined,
  );
  fileMutationQueues.set(fileId, tail);
  void tail.finally(() => {
    if (fileMutationQueues.get(fileId) === tail)
      fileMutationQueues.delete(fileId);
  });
  return result;
}

export async function readFileContent(fileId: string): Promise<string> {
  const node = useWorkspaceStore.getState().nodes[fileId];
  return readDriveFileContent(
    fileId,
    node?.type === "file" ? node.version : undefined,
  );
}

export async function writeFileContent(
  fileId: string,
  content: string,
): Promise<void> {
  const workspaceId = requireActiveWorkspaceId();
  await enqueueFileMutation(fileId, () =>
    withWorkspaceMutation(async () => {
      const node = await fetchJson<WorkspaceNode>(
        workspaceUrl(`/api/files/${fileId}`, workspaceId),
        {
          ...jsonBody("PATCH", { content }),
          action: "Save file",
        },
      );
      await Promise.all([
        writeCachedFileContent(fileId, content, node.version),
        invalidateWorkspaceTree(workspaceId),
      ]);
      if (
        activeWorkspaceId() === workspaceId &&
        useWorkspaceStore.getState().nodes[fileId]?.type === "file"
      ) {
        useWorkspaceStore.getState().updateNode(fileId, node);
      }
    }),
  );
}

export async function deleteFileContent(
  fileId: string,
  workspaceId = requireActiveWorkspaceId(),
): Promise<void> {
  await enqueueFileMutation(fileId, () =>
    withWorkspaceMutation(async () => {
      await fetchOk(workspaceUrl(`/api/files/${fileId}`, workspaceId), {
        method: "DELETE",
        action: "Delete file",
      });
      await Promise.all([
        invalidateFileContent(fileId),
        invalidateWorkspaceTree(workspaceId),
        invalidateDriveFileIndex(),
      ]);
    }),
  );
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

function requireActiveWorkspaceId(): string {
  const workspaceId = activeWorkspaceId();
  if (!workspaceId) throw new Error("No active workspace.");
  return workspaceId;
}

function workspaceUrl(path: string, workspaceId: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${new URLSearchParams({ workspaceId })}`;
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
  if (!workspaceId) return loadActiveWorkspaceTree(options);
  try {
    return await loadWorkspaceTree(workspaceId, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404)
      return loadActiveWorkspaceTree(options);
    throw error;
  }
}

export async function createCloudFile(
  parentId: string | null,
  name: string,
  content: string,
  workspaceId = requireActiveWorkspaceId(),
): Promise<WorkspaceNode> {
  const node = await withWorkspaceMutation(() =>
    fetchJson<WorkspaceNode>(workspaceUrl("/api/files", workspaceId), {
      ...jsonBody("POST", { parentId, name, content }),
      action: "Create file",
    }),
  );
  await Promise.all([
    writeCachedFileContent(node.id, content, node.version),
    invalidateWorkspaceTree(workspaceId),
    invalidateDriveFileIndex(),
  ]);
  return node;
}

export async function createCloudFolder(
  parentId: string | null,
  name: string,
  workspaceId = requireActiveWorkspaceId(),
): Promise<WorkspaceNode> {
  const node = await withWorkspaceMutation(() =>
    fetchJson<WorkspaceNode>(workspaceUrl("/api/folders", workspaceId), {
      ...jsonBody("POST", { parentId, name }),
      action: "Create folder",
    }),
  );
  await invalidateWorkspaceTree(workspaceId);
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
  workspaceId = requireActiveWorkspaceId(),
): Promise<WorkspaceNode> {
  return enqueueFileMutation(fileId, () =>
    withWorkspaceMutation(async () => {
      const node = await fetchJson<WorkspaceNode>(
        workspaceUrl(`/api/files/${fileId}`, workspaceId),
        {
          ...jsonBody("PATCH", patch),
          action: "Update file",
        },
      );
      if (patch.content !== undefined)
        await writeCachedFileContent(fileId, patch.content, node.version);
      await Promise.all([
        invalidateWorkspaceTree(workspaceId),
        patch.name !== undefined ||
        patch.parentId !== undefined ||
        patch.hidden !== undefined
          ? invalidateDriveFileIndex()
          : Promise.resolve(),
      ]);
      return node;
    }),
  );
}

export async function patchCloudFolder(
  folderId: string,
  patch: {
    name?: string;
    parentId?: string | null;
    collapsed?: boolean;
    hidden?: boolean;
  },
  workspaceId = requireActiveWorkspaceId(),
): Promise<WorkspaceNode> {
  const node = await withWorkspaceMutation(() =>
    fetchJson<WorkspaceNode>(
      workspaceUrl(`/api/folders/${folderId}`, workspaceId),
      {
        ...jsonBody("PATCH", patch),
        action: "Update folder",
      },
    ),
  );
  await Promise.all([
    invalidateWorkspaceTree(workspaceId),
    patch.name !== undefined ||
    patch.parentId !== undefined ||
    patch.hidden !== undefined
      ? invalidateDriveFileIndex()
      : Promise.resolve(),
  ]);
  return node;
}

export async function deleteCloudFolder(
  folderId: string,
  workspaceId = requireActiveWorkspaceId(),
): Promise<void> {
  await withWorkspaceMutation(() =>
    fetchOk(workspaceUrl(`/api/folders/${folderId}`, workspaceId), {
      method: "DELETE",
      action: "Delete folder",
    }),
  );
  await Promise.all([
    invalidateWorkspaceTree(workspaceId),
    invalidateDriveFileIndex(),
  ]);
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
  const workspaceId = activeWorkspaceId();
  const result = await withWorkspaceMutation(() =>
    fetchJson<{ idMap: Record<string, string> }>("/api/workspace/import", {
      // A full guest-workspace migration can be much larger than a normal request, so it gets a
      // longer leash than the default timeout before being treated as hung.
      ...jsonBody("POST", { nodes }),
      action: "Import workspace",
      timeoutMs: 60000,
    }),
  );
  await Promise.all([
    workspaceId ? invalidateWorkspaceTree(workspaceId) : Promise.resolve(),
    invalidateDriveFileIndex(),
  ]);
  return result;
}
