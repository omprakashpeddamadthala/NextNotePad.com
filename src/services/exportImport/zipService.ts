import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { FileNode, FolderNode, WorkspaceNode } from "@/types/file";
import type { NodeMap } from "@/lib/utils/treeUtils";
import { siblingNameExists } from "@/lib/utils/treeUtils";
import {
  getActiveRepository,
  isCloudMode,
} from "@/services/storage/activeRepository";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import * as localRepo from "@/services/storage/workspaceRepository";
import {
  createFile,
  createFolder,
  uniqueSiblingName,
} from "@/services/fileOperations";
import { useWorkspaceStore } from "@/store/workspaceStore";

const MANIFEST_PATH = ".nextnotepad/manifest.json";
const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 5_000;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;

interface ExportedNodeMetadata {
  path: string;
  type: "file" | "folder";
  language?: string;
  encoding?: string;
  hidden?: boolean;
  collapsed?: boolean;
  locked?: boolean;
  encryptionSalt?: string | null;
  encryptionIv?: string | null;
}

interface WorkspaceZipManifest {
  version: 1;
  nodes: ExportedNodeMetadata[];
}

function normalizedPath(path: string): string | null {
  const segments = path
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment && segment !== ".");
  if (segments.some((segment) => segment === "..")) return null;
  return segments.join("/");
}

function entryPath(entry: JSZip.JSZipObject): string | null {
  const originalName = (
    entry as JSZip.JSZipObject & { unsafeOriginalName?: string }
  ).unsafeOriginalName;
  return normalizedPath(originalName ?? entry.name);
}

function validateZipSize(file: File, zip: JSZip): void {
  if (file.size > MAX_ZIP_BYTES)
    throw new Error("ZIP is larger than the 50 MB import limit.");

  const entries = Object.values(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES)
    throw new Error("ZIP contains more than 5,000 entries.");

  let uncompressedBytes = 0;
  for (const entry of entries) {
    const size = (
      entry as JSZip.JSZipObject & {
        _data?: { uncompressedSize?: number };
      }
    )._data?.uncompressedSize;
    if (typeof size === "number") uncompressedBytes += size;
    if (uncompressedBytes > MAX_UNCOMPRESSED_BYTES)
      throw new Error("ZIP expands beyond the 100 MB import limit.");
  }
}

function metadataForNode(node: WorkspaceNode): ExportedNodeMetadata {
  if (node.type === "folder") {
    return {
      path: node.path.replace(/^\/+/, ""),
      type: "folder",
      hidden: node.hidden,
      collapsed: node.collapsed,
    };
  }
  return {
    path: node.path.replace(/^\/+/, ""),
    type: "file",
    language: node.language,
    encoding: node.encoding,
    hidden: node.hidden,
    locked: node.locked,
    encryptionSalt: node.encryptionSalt,
    encryptionIv: node.encryptionIv,
  };
}

export async function exportWorkspaceZip(nodes: NodeMap): Promise<number> {
  const zip = new JSZip();
  const exportedNodes = Object.values(nodes).filter((node) => !node.deleted);
  const files = exportedNodes.filter(
    (node): node is FileNode => node.type === "file",
  );

  for (const folder of exportedNodes.filter(
    (node): node is FolderNode => node.type === "folder",
  )) {
    zip.folder(folder.path.replace(/^\/+/, ""));
  }
  for (const file of files) {
    const content = await getActiveRepository().readFileContent(file.id);
    zip.file(file.path.replace(/^\/+/, ""), content);
  }

  const manifest: WorkspaceZipManifest = {
    version: 1,
    nodes: exportedNodes.map(metadataForNode),
  };
  zip.file(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(
    blob,
    `notepad-web-workspace-${new Date().toISOString().slice(0, 10)}.zip`,
  );
  return files.length;
}

async function readManifest(zip: JSZip): Promise<WorkspaceZipManifest | null> {
  const entry = zip.file(MANIFEST_PATH);
  if (!entry) return null;
  try {
    const parsed = JSON.parse(
      await entry.async("string"),
    ) as WorkspaceZipManifest;
    return parsed.version === 1 && Array.isArray(parsed.nodes) ? parsed : null;
  } catch {
    return null;
  }
}

async function applyMetadata(
  nodeId: string,
  metadata: ExportedNodeMetadata | undefined,
): Promise<void> {
  if (!metadata) return;
  if (metadata.type === "folder") {
    const patch = {
      collapsed: metadata.collapsed ?? true,
      hidden: metadata.hidden ?? false,
    };
    if (isCloudMode()) await cloudRepo.patchCloudFolder(nodeId, patch);
    useWorkspaceStore.getState().updateNode(nodeId, patch);
    return;
  }

  const patch = {
    language: metadata.language,
    hidden: metadata.hidden ?? false,
    locked: metadata.locked ?? false,
    encryptionSalt: metadata.encryptionSalt ?? null,
    encryptionIv: metadata.encryptionIv ?? null,
  };
  if (isCloudMode()) await cloudRepo.patchCloudFile(nodeId, patch);
  useWorkspaceStore.getState().updateNode(nodeId, patch);
}

async function rollbackCreatedNodes(createdIds: string[]): Promise<void> {
  for (const id of [...createdIds].reverse()) {
    const node = useWorkspaceStore.getState().nodes[id];
    if (!node) continue;
    try {
      if (isCloudMode()) {
        if (node.type === "folder") await cloudRepo.deleteCloudFolder(id);
        else await cloudRepo.deleteFileContent(id);
      } else if (node.type === "file") {
        await localRepo.deleteFileContent(id);
      }
    } catch {
      // Keep rolling back the remaining nodes even if one cleanup request fails.
    }
  }
  useWorkspaceStore.getState().removeNodes(createdIds);
}

export async function importWorkspaceZip(
  file: File,
): Promise<{ filesImported: number }> {
  if (file.size > MAX_ZIP_BYTES)
    throw new Error("ZIP is larger than the 50 MB import limit.");
  const zip = await JSZip.loadAsync(file);
  validateZipSize(file, zip);
  const manifest = await readManifest(zip);
  const metadataByPath = new Map(
    (manifest?.nodes ?? []).map((node) => [node.path, node]),
  );
  const createdIds: string[] = [];
  let filesImported = 0;
  const folderIdByPath = new Map<string, string | null>([["", null]]);

  async function ensureFolder(path: string): Promise<string | null> {
    const normalized = normalizedPath(path);
    if (normalized === null) throw new Error("ZIP contains an unsafe path.");
    const cached = folderIdByPath.get(normalized);
    if (cached !== undefined) return cached;

    const segments = normalized.split("/").filter(Boolean);
    let currentPath = "";
    let parentId: string | null = null;
    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const cachedSegment = folderIdByPath.get(currentPath);
      if (cachedSegment !== undefined) {
        parentId = cachedSegment;
        continue;
      }
      const nodes = useWorkspaceStore.getState().nodes;
      const name = siblingNameExists(nodes, parentId, segment)
        ? uniqueSiblingName(nodes, parentId, segment)
        : segment;
      const id = await createFolder(parentId, name);
      createdIds.push(id);
      folderIdByPath.set(currentPath, id);
      parentId = id;
      await applyMetadata(id, metadataByPath.get(currentPath));
    }
    return parentId;
  }

  try {
    const explicitFolderPaths = new Set<string>();
    for (const entry of Object.values(zip.files)) {
      if (!entry.dir) continue;
      const path = entryPath(entry);
      if (path === null) throw new Error("ZIP contains an unsafe path.");
      if (path && path !== ".nextnotepad") explicitFolderPaths.add(path);
    }
    for (const metadata of manifest?.nodes ?? []) {
      if (metadata.type === "folder") explicitFolderPaths.add(metadata.path);
    }
    for (const folderPath of [...explicitFolderPaths].sort(
      (a, b) => a.split("/").length - b.split("/").length,
    )) {
      await ensureFolder(folderPath);
    }

    const entries = Object.values(zip.files).filter(
      (entry) => !entry.dir && entry.name !== MANIFEST_PATH,
    );
    for (const entry of entries) {
      const normalized = entryPath(entry);
      if (normalized === null) throw new Error("ZIP contains an unsafe path.");
      if (!normalized) continue;
      const segments = normalized.split("/");
      const filename = segments.pop();
      if (!filename) continue;
      const parentPath = segments.join("/");
      const parentId = await ensureFolder(parentPath);
      const content = await entry.async("string");
      const nodes = useWorkspaceStore.getState().nodes;
      const name = siblingNameExists(nodes, parentId, filename)
        ? uniqueSiblingName(nodes, parentId, filename)
        : filename;
      const id = await createFile(parentId, name, content);
      createdIds.push(id);
      await applyMetadata(id, metadataByPath.get(normalized));
      filesImported += 1;
    }
  } catch (error) {
    await rollbackCreatedNodes(createdIds);
    throw error;
  }

  return { filesImported };
}
