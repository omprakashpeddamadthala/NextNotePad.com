import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { createFile, createFolder } from "@/services/fileOperations";
import type { FolderNode } from "@/types/file";

const DAILY_NOTES_FOLDER_NAME = "Daily Notes";

/** Local calendar date, not UTC — `toISOString()` would roll over to the wrong day near midnight. */
function todayFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}.txt`;
}

async function ensureDailyNotesFolder(): Promise<string> {
  const nodes = useWorkspaceStore.getState().nodes;
  const existing = Object.values(nodes).find(
    (n) => !n.deleted && n.type === "folder" && n.parentId === null && n.name === DAILY_NOTES_FOLDER_NAME,
  ) as FolderNode | undefined;
  if (existing) return existing.id;
  return createFolder(null, DAILY_NOTES_FOLDER_NAME);
}

/**
 * Opens today's daily note under the root "Daily Notes" folder — creating the folder and/or
 * the note the first time either is needed. A second click the same day reopens the same file
 * instead of creating a duplicate; the day after, a fresh dated file is created.
 */
export async function openTodayDailyNote(): Promise<void> {
  const folderId = await ensureDailyNotesFolder();
  const name = todayFileName();

  const nodes = useWorkspaceStore.getState().nodes;
  const existing = Object.values(nodes).find(
    (n) => !n.deleted && n.type === "file" && n.parentId === folderId && n.name === name,
  );
  const fileId = existing ? existing.id : await createFile(folderId, name, "");

  useTabsStore.getState().openTab(fileId);
  useRecentFilesStore.getState().addRecent(fileId);
}
