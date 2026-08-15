import type { WorkspaceNode } from "@/types/file";

async function parseJsonOrThrow<T>(res: Response, action: string): Promise<T> {
  if (!res.ok) throw new Error(`${action} failed (${res.status})`);
  return res.json();
}

// --- Same shape as the local repository (services/storage/workspaceRepository.ts) ---

export async function readFileContent(fileId: string): Promise<string> {
  const res = await fetch(`/api/files/${fileId}`);
  const data = await parseJsonOrThrow<{ content: string }>(res, "Load file");
  return data.content ?? "";
}

export async function writeFileContent(fileId: string, content: string): Promise<void> {
  await fetch(`/api/files/${fileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function deleteFileContent(fileId: string): Promise<void> {
  await fetch(`/api/files/${fileId}`, { method: "DELETE" });
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
  const res = await fetch("/api/workspace");
  return parseJsonOrThrow<{ nodes: WorkspaceNode[]; hasAnyHistory: boolean }>(res, "Load workspace");
}

export async function createCloudFile(
  parentId: string | null,
  name: string,
  content: string,
): Promise<WorkspaceNode> {
  const res = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentId, name, content }),
  });
  return parseJsonOrThrow<WorkspaceNode>(res, "Create file");
}

export async function createCloudFolder(parentId: string | null, name: string): Promise<WorkspaceNode> {
  const res = await fetch("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentId, name }),
  });
  return parseJsonOrThrow<WorkspaceNode>(res, "Create folder");
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
  const res = await fetch(`/api/files/${fileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJsonOrThrow<WorkspaceNode>(res, "Update file");
}

export async function patchCloudFolder(
  folderId: string,
  patch: { name?: string; parentId?: string | null; collapsed?: boolean; hidden?: boolean },
): Promise<WorkspaceNode> {
  const res = await fetch(`/api/folders/${folderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJsonOrThrow<WorkspaceNode>(res, "Update folder");
}

export async function deleteCloudFolder(folderId: string): Promise<void> {
  await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
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
  const res = await fetch("/api/workspace/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodes }),
  });
  return parseJsonOrThrow<{ idMap: Record<string, string> }>(res, "Import workspace");
}
