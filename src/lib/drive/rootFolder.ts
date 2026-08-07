import type { drive_v3 } from "googleapis";
import { prisma } from "@/lib/db/prisma";

const DRIVE_ROOT_FOLDER_NAME = "NextNotePad.com";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

/** True if the file still exists in Drive and isn't trashed — a cached id can go stale if the user deletes it directly in Drive. */
async function driveFileIsLive(drive: drive_v3.Drive, fileId: string): Promise<boolean> {
  try {
    const res = await drive.files.get({ fileId, fields: "id,trashed" });
    return res.data.trashed !== true;
  } catch {
    return false;
  }
}

async function findOrCreateRootFolder(drive: drive_v3.Drive, workspaceId: string): Promise<string> {
  const existing = await drive.files.list({
    q: `name='${DRIVE_ROOT_FOLDER_NAME}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false and 'root' in parents`,
    fields: "files(id,name)",
    spaces: "drive",
  });

  let folderId = existing.data.files?.[0]?.id;
  if (!folderId) {
    const created = await drive.files.create({
      requestBody: { name: DRIVE_ROOT_FOLDER_NAME, mimeType: FOLDER_MIME_TYPE },
      fields: "id",
    });
    folderId = created.data.id ?? undefined;
  }
  if (!folderId) throw new Error("Failed to create or locate the Drive root folder.");

  await prisma.workspace.update({ where: { id: workspaceId }, data: { driveRootFolderId: folderId } });
  return folderId;
}

// Verifying the cached root folder is still live costs a full extra Drive round-trip — worth
// paying once in a while (the folder can be deleted directly in Drive, outside the app), but not
// on every single push, which was making every file operation noticeably slower for a check that
// almost always just confirms what was already known. Amortize it with a short in-memory TTL
// instead — one process-lifetime cache, fine for this single-process deployment.
const LIVENESS_TTL_MS = 5 * 60 * 1000;
const lastVerifiedAt = new Map<string, number>();

/** Returns the "NextNotePad.com" Drive folder id for this workspace, creating it (or finding a pre-existing one) if needed. */
export async function ensureRootFolder(drive: drive_v3.Drive, workspaceId: string): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  if (workspace.driveRootFolderId) {
    const verifiedRecently = (Date.now() - (lastVerifiedAt.get(workspaceId) ?? 0)) < LIVENESS_TTL_MS;
    if (verifiedRecently) return workspace.driveRootFolderId;
    if (await driveFileIsLive(drive, workspace.driveRootFolderId)) {
      lastVerifiedAt.set(workspaceId, Date.now());
      return workspace.driveRootFolderId;
    }
  }

  const folderId = await findOrCreateRootFolder(drive, workspaceId);
  lastVerifiedAt.set(workspaceId, Date.now());
  return folderId;
}
