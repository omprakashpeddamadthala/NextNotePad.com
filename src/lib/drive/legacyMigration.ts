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

const LEGACY_TABLES = ["Workspace", "Folder", "File", "UserSettings"] as const;
type LegacyTable = (typeof LEGACY_TABLES)[number];

// Deployed databases don't all have every legacy table, so each one is checked individually.
async function existingLegacyTables(): Promise<Set<LegacyTable>> {
  const rows = await prisma.$queryRawUnsafe<
    { name: LegacyTable; t: string | null }[]
  >(
    LEGACY_TABLES.map(
      (name) => `SELECT '${name}' AS name, to_regclass('"${name}"')::text AS t`,
    ).join(" UNION ALL "),
  );
  return new Set(rows.filter((r) => r.t).map((r) => r.name));
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
  const tables = await existingLegacyTables();
  const workspaces = tables.has("Workspace")
    ? await prisma.$queryRawUnsafe<LegacyWorkspace[]>(
        `SELECT "id","name","description","driveWorkspaceFolderId" FROM "Workspace" WHERE "userId" = $1 ORDER BY "createdAt" ASC`,
        userId,
      )
    : [];
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

    const folders = tables.has("Folder")
      ? await prisma.$queryRawUnsafe<LegacyFolder[]>(
          `SELECT "id","workspaceId","parentId","name","path","collapsed","hidden","driveFileId" FROM "Folder" WHERE "workspaceId" = $1 AND "deletedAt" IS NULL`,
          ws.id,
        )
      : [];
    folders.sort((a, b) => a.path.split("/").length - b.path.split("/").length);
    const folderMap = new Map<string, string>();
    for (const f of folders) {
      const parent = f.parentId ? folderMap.get(f.parentId) : folder.id;
      if (!parent) continue;
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

    const files = tables.has("File")
      ? await prisma.$queryRawUnsafe<LegacyFile[]>(
          `SELECT "id","workspaceId","parentId","name","content","language","encoding","hidden","locked","encryptionSalt","encryptionIv","driveFileId" FROM "File" WHERE "workspaceId" = $1 AND "deletedAt" IS NULL`,
          ws.id,
        )
      : [];
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

  const [settings] = tables.has("UserSettings")
    ? await prisma.$queryRawUnsafe<{ theme: string; json: string }[]>(
        `SELECT "theme","json" FROM "UserSettings" WHERE "userId" = $1`,
        userId,
      )
    : [];
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

export async function ensureLegacyMigrated(ds: DriveService): Promise<void> {
  const userId = ds.userId;
  if (done.has(userId)) return;
  const pending = running.get(userId);
  if (pending) return pending;

  const run = (async () => {
    const config = await new AppConfigService(ds).load();
    if (
      config.migrations.legacyDatabase ||
      (await existingLegacyTables()).size === 0
    ) {
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
