import { generateId } from "@/lib/id";
import { detectLanguageFromFilename } from "@/lib/constants/languages";
import { joinPath } from "@/lib/utils/pathUtils";
import type { FileNode, FolderNode, WorkspaceNode } from "@/types/file";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { writeFileContent } from "@/services/storage/workspaceRepository";

const EXTENSIONS = ["ts", "js", "json", "md", "css", "py", "go", "html", "yaml", "sql"];

/** Dev-only: generates a large randomized tree to validate virtualization performance. */
export function seedMockWorkspace(targetFiles = 2000, targetFolders = 200): void {
  const nodes: Record<string, WorkspaceNode> = {};
  const folderIds: (string | null)[] = [null];
  const now = Date.now();
  const fileContents: Record<string, string> = {};

  for (let i = 0; i < targetFolders; i++) {
    const parentId = folderIds[Math.floor(Math.random() * folderIds.length)];
    const parent = parentId ? (nodes[parentId] as FolderNode) : null;
    const name = `folder-${i}`;
    const id = generateId();
    const path = joinPath(parent?.path ?? "", name);
    const folder: FolderNode = {
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
      collapsed: true,
      hidden: false,
    };
    nodes[id] = folder;
    folderIds.push(id);
  }

  for (let i = 0; i < targetFiles; i++) {
    const parentId = folderIds[Math.floor(Math.random() * folderIds.length)];
    const parent = parentId ? (nodes[parentId] as FolderNode) : null;
    const ext = EXTENSIONS[i % EXTENSIONS.length];
    const name = `file-${i}.${ext}`;
    const id = generateId();
    const path = joinPath(parent?.path ?? "", name);
    const content = `// Mock file ${i}\nexport const value = ${i};\n`;
    const file: FileNode = {
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
      hidden: false,
      locked: false,
      encryptionSalt: null,
      encryptionIv: null,
    };
    nodes[id] = file;
    fileContents[id] = content;
  }

  useWorkspaceStore.getState().addNodes(Object.values(nodes));

  for (const [id, content] of Object.entries(fileContents)) {
    void writeFileContent(id, content);
  }
}
