/**
 * Workspace-level Google Drive folder management.
 *
 * Architecture:
 *   Google Drive root
 *     └─ NextNotePad.com/          ← app root (driveRootFolderId on Workspace)
 *          ├─ My Workspace/         ← per-workspace folder (driveWorkspaceFolderId on Workspace)
 *          ├─ Project Alpha/
 *          └─ ...
 *
 * This module creates and resolves the per-workspace subfolder under the app root.
 */

import type { drive_v3 } from "googleapis";
import { prisma } from "@/lib/db/prisma";
import { ensureRootFolder } from "./rootFolder";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

/** Returns true if a Drive file/folder still exists and isn't trashed. */
async function driveFileIsLive(drive: drive_v3.Drive, fileId: string): Promise<boolean> {
  try {
    const res = await drive.files.get({ fileId, fields: "id,trashed" });
    return res.data.trashed !== true;
  } catch {
    return false;
  }
}

/**
 * Finds or creates a named folder directly inside the given parent Drive folder.
 * Returns the Drive file ID of the folder.
 */
async function findOrCreateNamedFolder(
  drive: drive_v3.Drive,
  parentId: string,
  folderName: string,
): Promise<string> {
  // Search for an existing folder with this name under the parent
  const sanitizedName = folderName.replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name='${sanitizedName}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false and '${parentId}' in parents`,
    fields: "files(id,name)",
    spaces: "drive",
  });

  const existingId = existing.data.files?.[0]?.id;
  if (existingId) return existingId;

  // Create it
  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: FOLDER_MIME_TYPE,
      parents: [parentId],
    },
    fields: "id",
  });

  const folderId = created.data.id;
  if (!folderId) throw new Error(`Failed to create Drive folder "${folderName}".`);
  return folderId;
}

/**
 * Ensures the workspace-level Drive folder exists and its ID is cached on the Workspace row.
 * Creates the folder if needed, and self-heals if the cached ID is stale (folder deleted in Drive).
 */
export async function ensureWorkspaceFolder(drive: drive_v3.Drive, workspaceId: string): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

  // Fast path: we have a cached folder ID and it's still live
  if (workspace.driveWorkspaceFolderId) {
    if (await driveFileIsLive(drive, workspace.driveWorkspaceFolderId)) {
      return workspace.driveWorkspaceFolderId;
    }
    // Stale — clear it and fall through to recreate
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { driveWorkspaceFolderId: null },
    });
  }

  // Get (or create) the app root folder first
  const rootFolderId = await ensureRootFolder(drive, workspaceId);

  // Create the workspace-named subfolder under the app root
  const folderId = await findOrCreateNamedFolder(drive, rootFolderId, workspace.name);

  // Cache it
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { driveWorkspaceFolderId: folderId },
  });

  return folderId;
}

/**
 * Renames a workspace folder in Google Drive.
 * If the workspace already has a linked Drive folder, updates its name in Drive.
 * If the linked folder no longer exists in Drive, creates a new one with the new name.
 */
export async function renameWorkspaceFolder(
  drive: drive_v3.Drive,
  workspaceId: string,
  newName: string,
): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

  if (workspace.driveWorkspaceFolderId) {
    if (await driveFileIsLive(drive, workspace.driveWorkspaceFolderId)) {
      await drive.files.update({
        fileId: workspace.driveWorkspaceFolderId,
        requestBody: { name: newName },
        fields: "id,name",
      });
      return workspace.driveWorkspaceFolderId;
    }
    // Stale/deleted folder in Drive — clear it so we recreate under root
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { driveWorkspaceFolderId: null },
    });
  }

  // If no folder existed or previous one was deleted, ensure under root with the new name
  const rootFolderId = await ensureRootFolder(drive, workspaceId);
  const folderId = await findOrCreateNamedFolder(drive, rootFolderId, newName);

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { driveWorkspaceFolderId: folderId },
  });

  return folderId;
}

/**
 * Deletes or trashes a workspace folder in Google Drive when a workspace is deleted.
 * Handles cases where driveWorkspaceFolderId is cached, or locates it by name if missing.
 */
export async function deleteWorkspaceFolder(
  drive: drive_v3.Drive,
  workspace: { id: string; name: string; driveWorkspaceFolderId: string | null },
): Promise<void> {
  let folderId = workspace.driveWorkspaceFolderId;

  // If no folder ID cached on workspace, search by name in the app root folder
  if (!folderId) {
    try {
      const rootFolderId = await ensureRootFolder(drive, workspace.id);
      const sanitizedName = workspace.name.replace(/'/g, "\\'");
      const res = await drive.files.list({
        q: `name='${sanitizedName}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false and '${rootFolderId}' in parents`,
        fields: "files(id)",
        spaces: "drive",
      });
      folderId = res.data.files?.[0]?.id ?? null;
    } catch (err) {
      console.error(`Failed to find Drive folder by name for workspace ${workspace.id}:`, err);
    }
  }

  if (folderId) {
    try {
      // First attempt permanent delete so it is completely removed from Google Drive
      await drive.files.delete({ fileId: folderId });
    } catch {
      // If permanent delete fails (e.g. permission or scope), fallback to moving to trash
      try {
        await drive.files.update({
          fileId: folderId,
          requestBody: { trashed: true },
        });
      } catch (trashErr) {
        console.error(`Failed to delete or trash Drive workspace folder ${folderId}:`, trashErr);
      }
    }
  }
}

/**
 * Backwards-compatible alias for deleteWorkspaceFolder.
 */
export async function trashWorkspaceFolder(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<void> {
  try {
    await drive.files.delete({ fileId: folderId });
  } catch {
    try {
      await drive.files.update({
        fileId: folderId,
        requestBody: { trashed: true },
      });
    } catch (err) {
      console.error(`Failed to trash Drive workspace folder ${folderId}:`, err);
    }
  }
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: string;
  modifiedTime?: string;
}

/**
 * Lists the direct children of a Drive folder — returns folders first, then files.
 * Skips trashed items and native Google Apps files (Docs, Sheets, Slides, etc).
 */
export async function listDriveFolderContents(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<DriveItem[]> {
  const items: DriveItem[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id,name,mimeType,size,modifiedTime)",
      pageSize: 200,
      pageToken,
      spaces: "drive",
      orderBy: "folder,name",
    });

    for (const f of res.data.files ?? []) {
      if (!f.id || !f.name || !f.mimeType) continue;
      // Skip native Google Apps documents — no plain-text content to show
      if (f.mimeType.startsWith("application/vnd.google-apps.") && f.mimeType !== FOLDER_MIME_TYPE) {
        continue;
      }
      items.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        isFolder: f.mimeType === FOLDER_MIME_TYPE,
        size: f.size ?? undefined,
        modifiedTime: f.modifiedTime ?? undefined,
      });
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return items;
}
