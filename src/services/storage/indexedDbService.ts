import { createStore, get, set, del, type UseStore } from "idb-keyval";

let fileContentStore: UseStore | undefined;

function getStore(): UseStore | undefined {
  if (typeof window === "undefined") return undefined;
  if (!fileContentStore) {
    fileContentStore = createStore("notepad-web-files", "contents");
  }
  return fileContentStore;
}

export async function getFileContent(fileId: string): Promise<string | undefined> {
  const store = getStore();
  if (!store) return undefined;
  return get<string>(fileId, store);
}

export async function setFileContent(fileId: string, content: string): Promise<void> {
  const store = getStore();
  if (!store) return;
  await set(fileId, content, store);
}

export async function deleteFileContent(fileId: string): Promise<void> {
  const store = getStore();
  if (!store) return;
  await del(fileId, store);
}

