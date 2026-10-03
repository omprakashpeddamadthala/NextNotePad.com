import { prisma } from "@/lib/db/prisma";
import { AppConfigService } from "./appConfigService";
import {
  DriveNotFoundError,
  type DriveEntry,
  type DriveService,
} from "./driveService";
import {
  createWorkspaceFolder,
  fileProps,
  folderProps,
  isFolder,
  listWorkspaceEntries,
  stripNulls,
} from "./workspaceService";

/**
 * One-time, idempotent copy of a user's pre-Drive-first data (the legacy `Workspace` / `Folder` /
 * `File` / `UserSettings` tables, no longer part of the Prisma schema) into their Drive.
 *
 * - Read via raw SQL so it works whether or not the tables still exist (fresh installs skip it).
 * - Progress is recorded as the legacy rows' `driveFileId` / `driveWorkspaceFolderId`, so a run
 *   interrupted half-way resumes without creating duplicates.
 * - Entries the old push-sync already created in Drive are reused (moved into place, content
 *   overwritten from the DB copy, which was always the authoritative one before this change).
 * - Completion is stamped into `.appConfig.json` (`migrations.legacyDatabase`); the legacy rows
 *   are left untouched so they can be verified before being dropped in a follow-up migration.
 */

interface LegacyWorkspace {
  id: string;
  name: string;
  description: string | null;
  driveWorkspaceFolderId: string | null;
}
interface LegacyFolder {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  path: string;
  collapsed: boolean;
  hidden: boolean;
  driveFileId: string | null;
}
interface LegacyFile {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  content: string;
  language: string;
  encoding: string;
  hidden: boolean;
  locked: boolean;
  encryptionSalt: string | null;
  encryptionIv: string | null;
  driveFileId: string | null;
}

const done = new Set<string>();
const running = new Map<string, Promise<void>>();

async function legacyTablesExist(): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ t: string | null }[]>(
    `SELECT to_regclass('"Workspace"')::text AS t`,
  );
  return Boolean(rows[0]?.t);
}

async function liveEntry(
  ds: DriveService,
  id: string | null,
): Promise<DriveEntry | null> {
  if (!id) return null;
  try {
    const e = await ds.get(id);
    return e.trashed ? null : e;
  } catch (err) {
    if (err instanceof DriveNotFoundError) return null;
    throw err;
  }
}

async function placeUnder(
  ds: DriveService,
  entry: DriveEntry,
  parentId: string,
  patch: Parameters<DriveService["update"]>[1],
) {
  const moveTo = entry.parents.includes(parentId)
    ? undefined
    : { parentId, fromParentId: entry.parents.join(",") };
  return ds.update(entry.id, { ...patch, moveTo });
}

export async function migrateLegacyData(
  ds: DriveService,
): Promise<{ workspaces: number; folders: number; files: number }> {
  const userId = ds.userId;
  const counts = { workspaces: 0, folders: 0, files: 0 };
  const workspaces = await prisma.$queryRawUnsafe<LegacyWorkspace[]>(
    `SELECT "id","name","description","driveWorkspaceFolderId" FROM "Workspace" WHERE "userId" = $1 ORDER BY "createdAt" ASC`,
    userId,
  );
  const wsParent = await ds.ensureWorkspacesFolder();
  const existingDriveWorkspaces = await listWorkspaceEntries(ds);
  const wsMap = new Map<string, string>();

  for (const ws of workspaces) {
    let folder = await liveEntry(ds, ws.driveWorkspaceFolderId);
    if (folder && isFolder(folder)) {
      folder = await placeUnder(ds, folder, wsParent, {
        appProperties: { nnp_kind: "workspace" },
        description: ws.description,
      });
    } else {
      folder =
        existingDriveWorkspaces.find((w) => w.name === ws.name) ??
        (await createWorkspaceFolder(ds, ws.name, ws.description));
      await prisma.$executeRawUnsafe(
        `UPDATE "Workspace" SET "driveWorkspaceFolderId" = $1 WHERE "id" = $2`,
        folder.id,
        ws.id,
      );
    }
    wsMap.set(ws.id, folder.id);
    counts.workspaces++;

    const folders = await prisma.$queryRawUnsafe<LegacyFolder[]>(
      `SELECT "id","workspaceId","parentId","name","path","collapsed","hidden","driveFileId" FROM "Folder" WHERE "workspaceId" = $1 AND "deletedAt" IS NULL`,
      ws.id,
    );
    // Parents before children: a folder's path always has fewer segments than its descendants'.
    folders.sort((a, b) => a.path.split("/").length - b.path.split("/").length);
    const folderMap = new Map<string, string>();
    for (const f of folders) {
      const parent = f.parentId ? folderMap.get(f.parentId) : folder.id;
      if (!parent) continue; // parent was soft-deleted; the subtree is effectively deleted too
      const props = folderProps({ collapsed: f.collapsed, hidden: f.hidden });
      const live = await liveEntry(ds, f.driveFileId);
      const entry =
        live && isFolder(live)
          ? await placeUnder(ds, live, parent, {
              name: f.name,
              appProperties: props,
            })
          : await ds.createFolder(f.name, parent, props);
      if (entry.id !== f.driveFileId) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Folder" SET "driveFileId" = $1 WHERE "id" = $2`,
          entry.id,
          f.id,
        );
      }
      folderMap.set(f.id, entry.id);
      counts.folders++;
    }

    const files = await prisma.$queryRawUnsafe<LegacyFile[]>(
      `SELECT "id","workspaceId","parentId","name","content","language","encoding","hidden","locked","encryptionSalt","encryptionIv","driveFileId" FROM "File" WHERE "workspaceId" = $1 AND "deletedAt" IS NULL`,
      ws.id,
    );
    for (const f of files) {
      const parent = f.parentId ? folderMap.get(f.parentId) : folder.id;
      if (!parent) continue;
      const props = fileProps(f);
      const live = await liveEntry(ds, f.driveFileId);
      const entry =
        live && !isFolder(live)
          ? await placeUnder(ds, live, parent, {
              name: f.name,
              appProperties: props,
              content: f.content ?? "",
            })
          : await ds.createFile(f.name, parent, f.content ?? "", {
              appProperties: stripNulls(props),
            });
      if (entry.id !== f.driveFileId) {
        await prisma.$executeRawUnsafe(
          `UPDATE "File" SET "driveFileId" = $1 WHERE "id" = $2`,
          entry.id,
          f.id,
        );
      }
      counts.files++;
    }
  }

  const [settings] = await prisma.$queryRawUnsafe<
    { theme: string; json: string }[]
  >(`SELECT "theme","json" FROM "UserSettings" WHERE "userId" = $1`, userId);
  const [userRow] = await prisma
    .$queryRawUnsafe<{ activeWorkspaceId: string | null }[]>(
      `SELECT "activeWorkspaceId" FROM "User" WHERE "id" = $1`,
      userId,
    )
    .catch(() => [{ activeWorkspaceId: null }]);

  await new AppConfigService(ds).update((c) => {
    if (settings && !c.settings.theme && !c.settings.editor) {
      let editor: Record<string, unknown> | null = null;
      try {
        editor = JSON.parse(settings.json) as Record<string, unknown>;
      } catch {
        editor = null;
      }
      c.settings = { ...c.settings, theme: settings.theme, editor };
    }
    const mappedActive = userRow?.activeWorkspaceId
      ? wsMap.get(userRow.activeWorkspaceId)
      : undefined;
    if (mappedActive) c.activeWorkspaceId = mappedActive;
    c.migrations = {
      ...c.migrations,
      legacyDatabase: { completedAt: new Date().toISOString(), ...counts },
    };
  });
  return counts;
}

/** Runs the legacy migration at most once per user (and once concurrently per process). Cheap
 *  after the first call: the in-process flag, then the cached `.appConfig.json` stamp. */
export async function ensureLegacyMigrated(ds: DriveService): Promise<void> {
  const userId = ds.userId;
  if (done.has(userId)) return;
  const pending = running.get(userId);
  if (pending) return pending;

  const run = (async () => {
    const config = await new AppConfigService(ds).load();
    if (config.migrations.legacyDatabase || !(await legacyTablesExist())) {
      done.add(userId);
      return;
    }
    const counts = await migrateLegacyData(ds);
    console.info(
      `Migrated legacy DB data to Drive for user ${userId}:`,
      counts,
    );
    done.add(userId);
  })().finally(() => running.delete(userId));
  running.set(userId, run);
  return run;
}
