import type { drive_v3 } from "googleapis";
import { prisma } from "@/lib/db/prisma";
import { getDriveClientForUser } from "./driveClient";
import { ensureRootFolder } from "./rootFolder";
import { detectLanguageFromFilename } from "@/lib/constants/languages";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const GOOGLE_APPS_MIME_PREFIX = "application/vnd.google-apps.";

interface DriveEntry {
  id: string;
  name: string;
  mimeType: string;
}

/** Lists every non-trashed direct child of a Drive folder, paginating as needed. */
async function listChildren(drive: drive_v3.Drive, parentId: string): Promise<DriveEntry[]> {
  const entries: DriveEntry[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id,name,mimeType)",
      pageSize: 1000,
      pageToken,
      spaces: "drive",
    });
    for (const f of res.data.files ?? []) {
      if (f.id && f.name && f.mimeType) entries.push({ id: f.id, name: f.name, mimeType: f.mimeType });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return entries;
}

async function downloadFileContent(drive: drive_v3.Drive, fileId: string): Promise<string> {
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "text" });
  return typeof res.data === "string" ? res.data : String(res.data ?? "");
}

export interface DriveImportResult {
  filesImported: number;
  foldersImported: number;
  skipped: number;
}

/**
 * One-time (on-demand) pull: walks the user's "NextNotePad.com" Drive folder and creates a local
 * File/Folder row for anything found there that isn't already linked (by driveFileId) to an
 * existing row — the read counterpart to the push-only sync `pushSync.ts` already does, for files
 * added directly in Drive (or from before this integration existed) that never made it into the
 * app's own workspace. Native Google Docs/Sheets/Slides are skipped — no plain-text content to
 * pull without a format conversion this app doesn't do.
 */
export async function importFromDrive(workspaceId: string): Promise<DriveImportResult> {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, include: { user: true } });
  const drive = getDriveClientForUser(workspace.user);
  const rootFolderId = await ensureRootFolder(drive, workspaceId);

  const [knownFolders, knownFiles] = await Promise.all([
    prisma.folder.findMany({ where: { workspaceId, driveFileId: { not: null } } }),
    prisma.file.findMany({ where: { workspaceId, driveFileId: { not: null } } }),
  ]);
  const knownDriveIds = new Set([...knownFolders.map((f) => f.driveFileId), ...knownFiles.map((f) => f.driveFileId)]);

  let filesImported = 0;
  let foldersImported = 0;
  let skipped = 0;

  // BFS over the Drive tree, rooted at the "NextNotePad.com" folder. `localParentId: null` at the
  // root matches this app's top-level-node convention.
  const queue: { driveId: string; localParentId: string | null; parentPath: string }[] = [
    { driveId: rootFolderId, localParentId: null, parentPath: "" },
  ];

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    const { driveId, localParentId, parentPath } = next;
    const children = await listChildren(drive, driveId);

    for (const child of children) {
      if (knownDriveIds.has(child.id)) {
        // Already linked locally — still need to walk into a known folder in case files were
        // added directly in Drive underneath it since it was last pushed.
        if (child.mimeType === FOLDER_MIME_TYPE) {
          const existing = await prisma.folder.findFirst({ where: { workspaceId, driveFileId: child.id } });
          if (existing) queue.push({ driveId: child.id, localParentId: existing.id, parentPath: existing.path });
        }
        continue;
      }

      if (child.mimeType === FOLDER_MIME_TYPE) {
        const path = `${parentPath}/${child.name}`;
        const created = await prisma.folder.create({
          data: { workspaceId, parentId: localParentId, name: child.name, path, driveFileId: child.id },
        });
        foldersImported++;
        queue.push({ driveId: child.id, localParentId: created.id, parentPath: created.path });
        continue;
      }

      if (child.mimeType.startsWith(GOOGLE_APPS_MIME_PREFIX)) {
        skipped++;
        continue;
      }

      try {
        const content = await downloadFileContent(drive, child.id);
        const path = `${parentPath}/${child.name}`;
        await prisma.file.create({
          data: {
            workspaceId,
            parentId: localParentId,
            name: child.name,
            path,
            language: detectLanguageFromFilename(child.name),
            encoding: "UTF-8",
            content,
            size: content.length,
            driveFileId: child.id,
          },
        });
        filesImported++;
      } catch {
        skipped++;
      }
    }
  }

  return { filesImported, foldersImported, skipped };
}
