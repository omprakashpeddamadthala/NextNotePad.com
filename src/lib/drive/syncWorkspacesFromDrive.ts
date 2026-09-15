import type { drive_v3 } from "googleapis";
import { prisma } from "@/lib/db/prisma";
import { getDriveClientForUser } from "./driveClient";

const DRIVE_ROOT_FOLDER_NAME = "NextNotePad.com";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export interface SyncWorkspacesResult {
  created: number;
  updated: number;
  totalDriveFolders: number;
}

/**
 * Scans the user's "NextNotePad.com" Google Drive root folder for all subfolders.
 * Ensures each top-level subfolder in Drive is mapped to a Workspace in the database.
 */
export async function syncWorkspacesFromDrive(userId: string): Promise<SyncWorkspacesResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    return { created: 0, updated: 0, totalDriveFolders: 0 };
  }

  let drive: drive_v3.Drive;
  try {
    drive = getDriveClientForUser(user);
  } catch (err) {
    console.error("Failed to instantiate Drive client for workspace sync:", err);
    return { created: 0, updated: 0, totalDriveFolders: 0 };
  }

  // 1. Locate the "NextNotePad.com" app root folder ID in Google Drive
  let rootFolderId: string | null = null;

  const existingWsWithRoot = await prisma.workspace.findFirst({
    where: { userId, driveRootFolderId: { not: null } },
    select: { driveRootFolderId: true },
  });

  if (existingWsWithRoot?.driveRootFolderId) {
    rootFolderId = existingWsWithRoot.driveRootFolderId;
  } else {
    try {
      const rootRes = await drive.files.list({
        q: `name='${DRIVE_ROOT_FOLDER_NAME}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false and 'root' in parents`,
        fields: "files(id,name)",
        spaces: "drive",
      });
      rootFolderId = rootRes.data.files?.[0]?.id ?? null;
    } catch (err) {
      console.error("Failed to query Drive root folder:", err);
      return { created: 0, updated: 0, totalDriveFolders: 0 };
    }
  }

  if (!rootFolderId) {
    return { created: 0, updated: 0, totalDriveFolders: 0 };
  }

  // Backfill `driveRootFolderId` on any workspace for this user that lacks it
  await prisma.workspace.updateMany({
    where: { userId, driveRootFolderId: null },
    data: { driveRootFolderId: rootFolderId },
  });

  // 2. Fetch all direct subfolders under "NextNotePad.com"
  const driveSubfolders: { id: string; name: string }[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const res = await drive.files.list({
        q: `'${rootFolderId}' in parents and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`,
        fields: "nextPageToken, files(id,name)",
        pageSize: 200,
        pageToken,
        spaces: "drive",
      });

      for (const f of res.data.files ?? []) {
        if (f.id && f.name) {
          driveSubfolders.push({ id: f.id, name: f.name });
        }
      }

      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  } catch (err) {
    console.error("Failed to list subfolders under NextNotePad.com root in Drive:", err);
    return { created: 0, updated: 0, totalDriveFolders: 0 };
  }

  // 3. Compare with DB workspaces
  const userWorkspaces = await prisma.workspace.findMany({
    where: { userId },
  });

  const liveDriveFolderIds = new Set(driveSubfolders.map((sf) => sf.id));

  // Sync deletions from Google Drive: if a workspace was linked to a Drive folder
  // that was deleted or trashed directly in Drive, delete it here too (preserving at least one workspace).
  for (const w of userWorkspaces) {
    if (w.driveWorkspaceFolderId && !liveDriveFolderIds.has(w.driveWorkspaceFolderId)) {
      const remainingCount = await prisma.workspace.count({ where: { userId } });
      if (remainingCount > 1) {
        if (user.activeWorkspaceId === w.id) {
          const another = await prisma.workspace.findFirst({
            where: { userId, id: { not: w.id } },
            orderBy: { createdAt: "asc" },
          });
          await prisma.user.update({
            where: { id: userId },
            data: { activeWorkspaceId: another?.id ?? null },
          });
        }
        await prisma.workspace.delete({ where: { id: w.id } });
      }
    }
  }

  const currentWorkspaces = await prisma.workspace.findMany({
    where: { userId },
  });

  const knownDriveFolderIds = new Set(
    currentWorkspaces.map((w) => w.driveWorkspaceFolderId).filter((id): id is string => Boolean(id))
  );

  let created = 0;
  let updated = 0;

  for (const sf of driveSubfolders) {
    const existingByDriveId = currentWorkspaces.find((w) => w.driveWorkspaceFolderId === sf.id);
    if (existingByDriveId) {
      if (existingByDriveId.name.trim() !== sf.name.trim()) {
        const collision = currentWorkspaces.some(
          (w) => w.id !== existingByDriveId.id && w.name.trim().toLowerCase() === sf.name.trim().toLowerCase()
        );
        if (!collision) {
          await prisma.workspace.update({
            where: { id: existingByDriveId.id },
            data: { name: sf.name },
          });
          existingByDriveId.name = sf.name;
          updated++;
        }
      }
      continue;
    }

    if (knownDriveFolderIds.has(sf.id)) {
      continue;
    }

    // Check if there is an unlinked workspace with matching name (case-insensitive)
    const matchByName = currentWorkspaces.find(
      (w) =>
        !w.driveWorkspaceFolderId &&
        w.name.trim().toLowerCase() === sf.name.trim().toLowerCase()
    );

    if (matchByName) {
      await prisma.workspace.update({
        where: { id: matchByName.id },
        data: {
          driveRootFolderId: rootFolderId,
          driveWorkspaceFolderId: sf.id,
        },
      });
      knownDriveFolderIds.add(sf.id);
      updated++;
    } else {
      await prisma.workspace.create({
        data: {
          userId,
          name: sf.name,
          driveRootFolderId: rootFolderId,
          driveWorkspaceFolderId: sf.id,
        },
      });
      knownDriveFolderIds.add(sf.id);
      created++;
    }
  }

  return { created, updated, totalDriveFolders: driveSubfolders.length };
}
