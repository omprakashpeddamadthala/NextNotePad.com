import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { createFile, createFolder } from "@/services/fileOperations";
import { closeAllSpecialViews } from "@/services/specialViews";
import type { FolderNode } from "@/types/file";

const DAILY_NOTES_FOLDER_NAME = "Daily Notes";

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

export async function openTodayDailyNote(): Promise<void> {
  const folderId = await ensureDailyNotesFolder();
  const name = todayFileName();

  const nodes = useWorkspaceStore.getState().nodes;
  const existing = Object.values(nodes).find(
    (n) => !n.deleted && n.type === "file" && n.parentId === folderId && n.name === name,
  );
  const fileId = existing ? existing.id : await createFile(folderId, name, "");

  closeAllSpecialViews();
  useTabsStore.getState().openTab(fileId);
  useRecentFilesStore.getState().addRecent(fileId);
}
