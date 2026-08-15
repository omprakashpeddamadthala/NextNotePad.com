import type { WorkspaceNode } from "@/types/file";
import { fetchJson, fetchOk, jsonBody } from "@/lib/api/fetchJson";

// --- Same shape as the local repository (services/storage/workspaceRepository.ts) ---

export async function readFileContent(fileId: string): Promise<string> {
  const data = await fetchJson<{ content: string }>(`/api/files/${fileId}`, { action: "Load file" });
  return data.content ?? "";
}

export async function writeFileContent(fileId: string, content: string): Promise<void> {
  await fetchOk(`/api/files/${fileId}`, { ...jsonBody("PATCH", { content }), action: "Save file" });
}

export async function deleteFileContent(fileId: string): Promise<void> {
  await fetchOk(`/api/files/${fileId}`, { method: "DELETE", action: "Delete file" });
}

export async function duplicateFileContent(sourceId: string, targetId: string): Promise<void> {
  const content = await readFileContent(sourceId);
  await writeFileContent(targetId, content);
}

export async function estimateStorageUsage(): Promise<null> {
  return null; // N/A server-side in Phase 2a
}

// --- Cloud-only metadata operations, used by fileOperations.ts when authenticated ---

export async function fetchWorkspaceTree(): Promise<{ nodes: WorkspaceNode[]; hasAnyHistory: boolean }> {
  return fetchJson<{ nodes: WorkspaceNode[]; hasAnyHistory: boolean }>("/api/workspace", {
    action: "Load workspace",
  });
}

export async function createCloudFile(
  parentId: string | null,
  name: string,
  content: string,
): Promise<WorkspaceNode> {
  return fetchJson<WorkspaceNode>("/api/files", {
    ...jsonBody("POST", { parentId, name, content }),
    action: "Create file",
  });
}

export async function createCloudFolder(parentId: string | null, name: string): Promise<WorkspaceNode> {
  return fetchJson<WorkspaceNode>("/api/folders", {
    ...jsonBody("POST", { parentId, name }),
    action: "Create folder",
  });
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
  return fetchJson<WorkspaceNode>(`/api/files/${fileId}`, {
    ...jsonBody("PATCH", patch),
    action: "Update file",
  });
}

export async function patchCloudFolder(
  folderId: string,
  patch: { name?: string; parentId?: string | null; collapsed?: boolean; hidden?: boolean },
): Promise<WorkspaceNode> {
  return fetchJson<WorkspaceNode>(`/api/folders/${folderId}`, {
    ...jsonBody("PATCH", patch),
    action: "Update folder",
  });
}

export async function deleteCloudFolder(folderId: string): Promise<void> {
  await fetchOk(`/api/folders/${folderId}`, { method: "DELETE", action: "Delete folder" });
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

export async function importWorkspace(nodes: ImportNodeInput[]): Promise<{ idMap: Record<string, string> }> {
  return fetchJson<{ idMap: Record<string, string> }>("/api/workspace/import", {
    // A full guest-workspace migration can be much larger than a normal request, so it gets a
    // longer leash than the default timeout before being treated as hung.
    ...jsonBody("POST", { nodes }),
    action: "Import workspace",
    timeoutMs: 60000,
  });
}
