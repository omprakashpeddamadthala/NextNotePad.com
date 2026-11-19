import { fetchJson } from "@/lib/api/fetchJson";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { getActiveRepository } from "@/services/storage/activeRepository";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export interface NoteVersion {
  id: string;
  modifiedTime: number;
  size: number;
}

export async function fetchVersions(fileId: string): Promise<NoteVersion[]> {
  const data = await fetchJson<{ revisions: NoteVersion[] }>(
    `/api/files/${encodeURIComponent(fileId)}/revisions`,
    { action: "Load version history", background: true },
  );
  return data.revisions;
}

export async function fetchVersionText(fileId: string, versionId: string): Promise<string> {
  const data = await fetchJson<{ content: string }>(
    `/api/files/${encodeURIComponent(fileId)}/revisions/${encodeURIComponent(versionId)}`,
    { action: "Load version", background: true },
  );
  return data.content;
}

/**
 * Saves an old version's text as the note's newest version, so the version
 * being replaced stays in the history too. Undo (Ctrl+Z) also works.
 */
export async function restoreVersion(fileId: string, content: string): Promise<void> {
  await getActiveRepository().writeFileContent(fileId, content);
  const model = modelRegistry.getModel(fileId);
  if (model) {
    // Mark saved first so the editor doesn't treat the restored text as unsaved.
    modelRegistry.markSaved(fileId, content);
    model.pushEditOperations([], [{ range: model.getFullModelRange(), text: content }], () => null);
  }
  useWorkspaceStore.getState().updateNode(fileId, { size: content.length });
  const { tabs, setDirty } = useTabsStore.getState();
  for (const tab of tabs) if (tab.fileId === fileId) setDirty(tab.id, false);
}
