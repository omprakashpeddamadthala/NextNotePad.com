import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useTrashStore } from "@/store/trashStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { usePendingGotoStore } from "@/store/pendingGotoStore";
import { generateId } from "@/lib/id";
import { joinPath } from "@/lib/utils/pathUtils";
import { detectLanguageFromFilename } from "@/lib/constants/languages";
import {
  collectSubtree,
  recomputeSubtreePaths,
  siblingNameExists,
  isDescendant,
  type NodeMap,
} from "@/lib/utils/treeUtils";
import type { FileNode, FolderNode, WorkspaceNode } from "@/types/file";
import * as localRepo from "@/services/storage/workspaceRepository";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import { getActiveRepository, isCloudMode } from "@/services/storage/activeRepository";

function splitNameExt(name: string): [string, string] {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return [name, ""];
  return [name.slice(0, dotIndex), name.slice(dotIndex)];
}

export function uniqueSiblingName(nodes: NodeMap, parentId: string | null, name: string): string {
  if (!siblingNameExists(nodes, parentId, name)) return name;
  const [base, ext] = splitNameExt(name);
  let counter = 1;
  let candidate = `${base} copy${ext}`;
  while (siblingNameExists(nodes, parentId, candidate)) {
    counter += 1;
    candidate = `${base} copy ${counter}${ext}`;
  }
  return candidate;
}

export function nextUntitledName(nodes: NodeMap, parentId: string | null): string {
  let counter = 1;
  let candidate = `new ${counter}.txt`;
  while (siblingNameExists(nodes, parentId, candidate)) {
    counter += 1;
    candidate = `new ${counter}.txt`;
  }
  return candidate;
}

export function nextUntitledFolderName(nodes: NodeMap, parentId: string | null): string {
  if (!siblingNameExists(nodes, parentId, "New Folder")) return "New Folder";
  let counter = 2;
  while (siblingNameExists(nodes, parentId, `New Folder ${counter}`)) counter += 1;
  return `New Folder ${counter}`;
}

/** Opens (or focuses) a file's tab and jumps the editor to a specific line/column. */
export function openFileAtLocation(fileId: string, line: number, column = 1): void {
  useTabsStore.getState().openTab(fileId);
  useRecentFilesStore.getState().addRecent(fileId);
  usePendingGotoStore.getState().requestGoto(fileId, line, column);
}

export async function createFile(parentId: string | null, name: string, content = ""): Promise<string> {
  const workspace = useWorkspaceStore.getState();
  if (siblingNameExists(workspace.nodes, parentId, name)) {
    toast.error(`"${name}" already exists here.`);
    throw new Error("duplicate-name");
  }

  if (isCloudMode()) {
    const node = (await cloudRepo.createCloudFile(parentId, name, content)) as FileNode;
    useWorkspaceStore.getState().addNode(node);
    return node.id;
  }

  const parent = parentId ? (workspace.nodes[parentId] as FolderNode | undefined) : null;
  const path = joinPath(parent?.path ?? "", name);
  const id = generateId();
  const now = Date.now();
  const node: FileNode = {
    id,
    name,
    path,
    parentId,
    type: "file",
    createdAt: now,
    updatedAt: now,
    lastSynced: null,
    version: 1,
    checksum: null,
    deleted: false,
    language: detectLanguageFromFilename(name),
    encoding: "UTF-8",
    size: content.length,
    pinnedFavorite: false,
  };
  workspace.addNode(node);
  void localRepo.writeFileContent(id, content);
  return id;
}

export async function createFolder(parentId: string | null, name: string): Promise<string> {
  const workspace = useWorkspaceStore.getState();
  if (siblingNameExists(workspace.nodes, parentId, name)) {
    toast.error(`"${name}" already exists here.`);
    throw new Error("duplicate-name");
  }

  if (isCloudMode()) {
    const node = (await cloudRepo.createCloudFolder(parentId, name)) as FolderNode;
    useWorkspaceStore.getState().addNode(node);
    return node.id;
  }

  const parent = parentId ? (workspace.nodes[parentId] as FolderNode | undefined) : null;
  const path = joinPath(parent?.path ?? "", name);
  const id = generateId();
  const now = Date.now();
  const node: FolderNode = {
    id,
    name,
    path,
    parentId,
    type: "folder",
    createdAt: now,
    updatedAt: now,
    lastSynced: null,
    version: 1,
    checksum: null,
    deleted: false,
    collapsed: false,
  };
  workspace.addNode(node);
  return id;
}

export function renameNode(id: string, newName: string): void {
  const workspace = useWorkspaceStore.getState();
  const node = workspace.nodes[id];
  if (!node) return;
  if (siblingNameExists(workspace.nodes, node.parentId, newName, id)) {
    toast.error(`"${newName}" already exists here.`);
    throw new Error("duplicate-name");
  }
  const parent = node.parentId ? workspace.nodes[node.parentId] : null;
  const pathPatch = recomputeSubtreePaths(workspace.nodes, id, parent?.path ?? "", newName);
  workspace.updatePaths(pathPatch);
  workspace.updateNode(id, {
    name: newName,
    ...(node.type === "file" ? { language: detectLanguageFromFilename(newName) } : {}),
  });

  if (isCloudMode()) {
    const patch =
      node.type === "file" ? { name: newName, language: detectLanguageFromFilename(newName) } : { name: newName };
    const patchFn = node.type === "folder" ? cloudRepo.patchCloudFolder : cloudRepo.patchCloudFile;
    void patchFn(id, patch).catch(() => toast.error(`Failed to sync rename of "${newName}".`));
  }
}

/** Explicit language override (e.g. from the Language menu) — separate from a rename, since the
 *  user is deliberately picking something other than what the filename would otherwise imply. */
export function setFileLanguage(id: string, language: string): void {
  const workspace = useWorkspaceStore.getState();
  const node = workspace.nodes[id];
  if (!node || node.type !== "file") return;

  workspace.updateNode(id, { language });

  if (isCloudMode()) {
    void cloudRepo
      .patchCloudFile(id, { language })
      .catch(() => toast.error(`Failed to sync language change for "${node.name}".`));
  }
}

export function moveNode(id: string, newParentId: string | null): void {
  const workspace = useWorkspaceStore.getState();
  const node = workspace.nodes[id];
  if (!node) return;
  if (newParentId === id) return;
  if (newParentId && isDescendant(workspace.nodes, id, newParentId)) {
    toast.error("Can't move a folder into itself.");
    return;
  }
  if (node.parentId === newParentId) return;
  const newParent = newParentId ? workspace.nodes[newParentId] : null;
  if (siblingNameExists(workspace.nodes, newParentId, node.name, id)) {
    toast.error(`"${node.name}" already exists in the destination.`);
    return;
  }
  const pathPatch = recomputeSubtreePaths(workspace.nodes, id, newParent?.path ?? "", node.name);
  workspace.updatePaths(pathPatch);
  workspace.updateNode(id, { parentId: newParentId });

  if (isCloudMode()) {
    const patchFn = node.type === "folder" ? cloudRepo.patchCloudFolder : cloudRepo.patchCloudFile;
    void patchFn(id, { parentId: newParentId }).catch(() => toast.error(`Failed to sync move of "${node.name}".`));
  }
}

export async function duplicateNode(id: string): Promise<string | null> {
  const workspace = useWorkspaceStore.getState();
  const node = workspace.nodes[id];
  if (!node) return null;
  const newName = uniqueSiblingName(workspace.nodes, node.parentId, node.name);

  if (isCloudMode()) {
    if (node.type === "file") {
      const content = await cloudRepo.readFileContent(id);
      const created = (await cloudRepo.createCloudFile(node.parentId, newName, content)) as FileNode;
      useWorkspaceStore.getState().addNode(created);
      return created.id;
    }

    const createdFolder = (await cloudRepo.createCloudFolder(node.parentId, newName)) as FolderNode;
    useWorkspaceStore.getState().addNode(createdFolder);

    const descendants = collectSubtree(workspace.nodes, id);
    const idMap = new Map<string, string>([[id, createdFolder.id]]);
    for (const d of descendants) {
      const mappedParentId = idMap.get(d.parentId!) ?? createdFolder.id;
      if (d.type === "folder") {
        const createdSub = (await cloudRepo.createCloudFolder(mappedParentId, d.name)) as FolderNode;
        useWorkspaceStore.getState().addNode(createdSub);
        idMap.set(d.id, createdSub.id);
      } else {
        const content = await cloudRepo.readFileContent(d.id);
        const createdFile = (await cloudRepo.createCloudFile(mappedParentId, d.name, content)) as FileNode;
        useWorkspaceStore.getState().addNode(createdFile);
        idMap.set(d.id, createdFile.id);
      }
    }
    return createdFolder.id;
  }

  const parent = node.parentId ? workspace.nodes[node.parentId] : null;
  const newPath = joinPath(parent?.path ?? "", newName);
  const newId = generateId();
  const now = Date.now();

  if (node.type === "file") {
    const newNode: FileNode = {
      ...node,
      id: newId,
      name: newName,
      path: newPath,
      createdAt: now,
      updatedAt: now,
      lastSynced: null,
      version: 1,
      checksum: null,
    };
    workspace.addNode(newNode);
    await localRepo.duplicateFileContent(id, newId);
    return newId;
  }

  const newFolder: FolderNode = {
    ...node,
    id: newId,
    name: newName,
    path: newPath,
    createdAt: now,
    updatedAt: now,
    lastSynced: null,
    version: 1,
    checksum: null,
  };
  const descendants = collectSubtree(workspace.nodes, id);
  const idMap = new Map<string, string>([[id, newId]]);
  for (const d of descendants) idMap.set(d.id, generateId());

  const newDescendants: WorkspaceNode[] = descendants.map((d) => {
    const mappedId = idMap.get(d.id)!;
    const mappedParentId = idMap.get(d.parentId!) ?? newId;
    const parentPath = mappedParentId === newId ? newPath : (workspace.nodes[d.parentId!]?.path ?? "");
    return {
      ...d,
      id: mappedId,
      parentId: mappedParentId,
      path: joinPath(parentPath, d.name),
      createdAt: now,
      updatedAt: now,
      lastSynced: null,
      version: 1,
      checksum: null,
    } as WorkspaceNode;
  });

  workspace.addNode(newFolder);
  workspace.addNodes(newDescendants);

  await Promise.all(
    descendants
      .filter((d) => d.type === "file")
      .map((d) => localRepo.duplicateFileContent(d.id, idMap.get(d.id)!)),
  );

  return newId;
}

/**
 * Guest mode soft-deletes into the local Recycle Bin (restorable). Cloud mode soft-deletes
 * server-side directly — Phase 2a has no restore UI for cloud deletes yet (Phase 2b/3 territory).
 */
export function moveToTrash(id: string): void {
  const workspace = useWorkspaceStore.getState();
  const tabs = useTabsStore.getState();
  const node = workspace.nodes[id];
  if (!node) return;

  const descendants = collectSubtree(workspace.nodes, id);
  const idsToRemove = [id, ...descendants.map((d) => d.id)];
  for (const removedId of idsToRemove) {
    const tab = tabs.tabForFile(removedId);
    if (tab) tabs.closeTab(tab.id);
  }

  if (isCloudMode()) {
    workspace.removeNodes(idsToRemove);
    const deleteCall = node.type === "folder" ? cloudRepo.deleteCloudFolder(id) : cloudRepo.deleteFileContent(id);
    void deleteCall.catch(() => toast.error(`Failed to delete "${node.name}" on the server.`));
    return;
  }

  const trash = useTrashStore.getState();
  trash.addEntry({ node, deletedAt: Date.now(), descendants });
  workspace.removeNodes(idsToRemove);
}

export function restoreFromTrash(nodeId: string): void {
  const trash = useTrashStore.getState();
  const workspace = useWorkspaceStore.getState();
  const entry = trash.removeEntry(nodeId);
  if (!entry) return;

  let node = entry.node;
  const parentStillExists = node.parentId ? Boolean(workspace.nodes[node.parentId]) : true;
  if (!parentStillExists) {
    node = { ...node, parentId: null, path: joinPath("", node.name) };
  }
  if (siblingNameExists(workspace.nodes, node.parentId, node.name)) {
    node = { ...node, name: uniqueSiblingName(workspace.nodes, node.parentId, node.name) };
  }

  workspace.addNode(node);
  workspace.addNodes(entry.descendants);
}

export async function permanentlyDelete(nodeId: string): Promise<void> {
  const trash = useTrashStore.getState();
  const entry = trash.removeEntry(nodeId);
  if (!entry) return;
  const allFiles = [entry.node, ...entry.descendants].filter((n) => n.type === "file");
  await Promise.all(allFiles.map((f) => getActiveRepository().deleteFileContent(f.id)));
}

/** Imports OS files dropped onto the explorer (flat — directory drops are handled by the Export/Import zip flow). */
export async function importNativeFiles(files: FileList | File[], parentId: string | null): Promise<void> {
  for (const file of Array.from(files)) {
    const workspace = useWorkspaceStore.getState();
    const name = uniqueSiblingName(workspace.nodes, parentId, file.name);
    const content = await file.text();
    await createFile(parentId, name, content);
  }
}

export async function emptyTrash(): Promise<void> {
  const trash = useTrashStore.getState();
  const allFiles = trash.entries.flatMap((entry) =>
    [entry.node, ...entry.descendants].filter((n) => n.type === "file"),
  );
  await Promise.all(allFiles.map((f) => getActiveRepository().deleteFileContent(f.id)));
  trash.emptyTrash();
}
