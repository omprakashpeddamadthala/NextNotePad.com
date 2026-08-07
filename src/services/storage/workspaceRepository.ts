import * as idb from "./indexedDbService";

/** File content lives in IndexedDB, keyed by file id; tree metadata lives in Zustand/localStorage. */
export async function readFileContent(fileId: string): Promise<string> {
  return (await idb.getFileContent(fileId)) ?? "";
}

export async function writeFileContent(fileId: string, content: string): Promise<void> {
  await idb.setFileContent(fileId, content);
}

export async function deleteFileContent(fileId: string): Promise<void> {
  await idb.deleteFileContent(fileId);
}

export async function duplicateFileContent(sourceId: string, targetId: string): Promise<void> {
  const content = await idb.getFileContent(sourceId);
  if (content !== undefined) await idb.setFileContent(targetId, content);
}

export interface StorageEstimate {
  usage: number;
  quota: number;
}

export async function estimateStorageUsage(): Promise<StorageEstimate | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
