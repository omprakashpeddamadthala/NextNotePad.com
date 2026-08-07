import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { NodeMap } from "@/lib/utils/treeUtils";
import { siblingNameExists } from "@/lib/utils/treeUtils";
import { getActiveRepository } from "@/services/storage/activeRepository";
import { createFile, createFolder, uniqueSiblingName } from "@/services/fileOperations";
import { useWorkspaceStore } from "@/store/workspaceStore";

export async function exportWorkspaceZip(nodes: NodeMap): Promise<number> {
  const zip = new JSZip();
  const files = Object.values(nodes).filter((n) => n.type === "file" && !n.deleted);
  for (const file of files) {
    const content = await getActiveRepository().readFileContent(file.id);
    zip.file(file.path.replace(/^\/+/, ""), content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `notepad-web-workspace-${new Date().toISOString().slice(0, 10)}.zip`);
  return files.length;
}

export async function importWorkspaceZip(file: File): Promise<{ filesImported: number }> {
  const zip = await JSZip.loadAsync(file);
  let filesImported = 0;
  const folderIdByPath = new Map<string, string | null>([["", null]]);

  async function ensureFolder(path: string): Promise<string | null> {
    const cached = folderIdByPath.get(path);
    if (cached !== undefined) return cached;

    const segments = path.split("/").filter(Boolean);
    let currentPath = "";
    let parentId: string | null = null;
    for (const seg of segments) {
      currentPath = currentPath ? `${currentPath}/${seg}` : seg;
      const cachedSegment = folderIdByPath.get(currentPath);
      if (cachedSegment !== undefined) {
        parentId = cachedSegment;
        continue;
      }
      const nodes = useWorkspaceStore.getState().nodes;
      const name = siblingNameExists(nodes, parentId, seg) ? uniqueSiblingName(nodes, parentId, seg) : seg;
      const id = await createFolder(parentId, name);
      folderIdByPath.set(currentPath, id);
      parentId = id;
    }
    return parentId;
  }

  const entries = Object.values(zip.files).filter((f) => !f.dir);
  for (const entry of entries) {
    const segments = entry.name.split("/");
    const filename = segments.pop();
    if (!filename) continue;
    const parentPath = segments.join("/");
    const parentId = await ensureFolder(parentPath);
    const content = await entry.async("string");
    const nodes = useWorkspaceStore.getState().nodes;
    const name = siblingNameExists(nodes, parentId, filename) ? uniqueSiblingName(nodes, parentId, filename) : filename;
    await createFile(parentId, name, content);
    filesImported += 1;
  }

  return { filesImported };
}
