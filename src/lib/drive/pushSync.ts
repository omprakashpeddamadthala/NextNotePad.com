import { prisma } from "@/lib/db/prisma";
import { getDriveClientForUser } from "./driveClient";
import { ensureRootFolder } from "./rootFolder";

type EntityType = "file" | "folder";
type Operation = "create" | "update" | "delete";

async function recordFailure(userId: string, entityType: EntityType, entityId: string, operation: Operation, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  try {
    await prisma.syncFailure.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      update: { operation, error: message, userId },
      create: { userId, entityType, entityId, operation, error: message },
    });
  } catch (err) {
    console.error("Failed to record sync failure:", err);
  }
}

async function clearFailure(entityType: EntityType, entityId: string) {
  try {
    await prisma.syncFailure.deleteMany({ where: { entityType, entityId } });
  } catch {
    // best-effort — a stale failure row is harmless
  }
}

/** True for a Drive 404 (gaxios sets `.status`/`.code` to the HTTP status). */
function isDriveNotFound(err: unknown): boolean {
  const status = (err as { status?: number; code?: number | string })?.status;
  const code = (err as { status?: number; code?: number | string })?.code;
  return status === 404 || code === 404 || code === "404";
}

/** Plain local read, resolved before any Drive call — so we always have a userId to attribute a failure to. */
async function getWorkspaceUserId(workspaceId: string): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  return workspace.userId;
}

async function getDriveContextForWorkspace(workspaceId: string) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: { user: true },
  });
  const drive = getDriveClientForUser(workspace.user);
  const rootFolderId = await ensureRootFolder(drive, workspaceId);
  return { drive, rootFolderId };
}

/** Falls back to the Drive root folder if the parent folder hasn't synced yet — a retry will fix the nesting once it has. */
async function resolveDriveParentId(parentFolderId: string | null, rootFolderId: string): Promise<string> {
  if (!parentFolderId) return rootFolderId;
  const parent = await prisma.folder.findUnique({ where: { id: parentFolderId } });
  return parent?.driveFileId ?? rootFolderId;
}

export async function pushFolderCreate(folderId: string): Promise<void> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return;
  const userId = await getWorkspaceUserId(folder.workspaceId);

  try {
    const { drive, rootFolderId } = await getDriveContextForWorkspace(folder.workspaceId);
    const parentDriveId = await resolveDriveParentId(folder.parentId, rootFolderId);
    const created = await drive.files.create({
      requestBody: { name: folder.name, mimeType: "application/vnd.google-apps.folder", parents: [parentDriveId] },
      fields: "id",
    });
    if (created.data.id) {
      await prisma.folder.update({ where: { id: folder.id }, data: { driveFileId: created.data.id } });
    }
    await clearFailure("folder", folderId);
  } catch (err) {
    await recordFailure(userId, "folder", folderId, "create", err);
  }
}

export async function pushFolderUpdate(folderId: string, opts?: { parentChanged?: boolean }): Promise<void> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return;
  if (!folder.driveFileId) {
    await pushFolderCreate(folderId);
    return;
  }
  const userId = await getWorkspaceUserId(folder.workspaceId);
  // Defaults to true (do the full parent-aware update) for callers that don't know — e.g. a
  // manual retry, where correctness matters more than shaving a round-trip off a rare path.
  const parentChanged = opts?.parentChanged ?? true;

  try {
    const { drive, rootFolderId } = await getDriveContextForWorkspace(folder.workspaceId);
    if (!parentChanged) {
      // Rename-only (or no-op) — the file's Drive parents are already correct, so skip the
      // extra "what are its current parents" round-trip entirely.
      await drive.files.update({ fileId: folder.driveFileId, requestBody: { name: folder.name }, fields: "id" });
    } else {
      const parentDriveId = await resolveDriveParentId(folder.parentId, rootFolderId);
      const current = await drive.files.get({ fileId: folder.driveFileId, fields: "parents" });
      await drive.files.update({
        fileId: folder.driveFileId,
        requestBody: { name: folder.name },
        addParents: parentDriveId,
        removeParents: (current.data.parents ?? []).join(","),
        fields: "id",
      });
    }
    await clearFailure("folder", folderId);
  } catch (err) {
    await recordFailure(userId, "folder", folderId, "update", err);
  }
}

export async function pushFolderDelete(folderId: string): Promise<void> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder?.driveFileId) return;
  const userId = await getWorkspaceUserId(folder.workspaceId);

  try {
    const { drive } = await getDriveContextForWorkspace(folder.workspaceId);
    await drive.files.update({ fileId: folder.driveFileId, requestBody: { trashed: true } });
    await clearFailure("folder", folderId);
  } catch (err) {
    // Already gone from Drive (e.g. permanently deleted there directly) — that's the delete's
    // desired end state, so treat it as success rather than a failure nothing can ever retry past.
    if (isDriveNotFound(err)) {
      await clearFailure("folder", folderId);
      return;
    }
    await recordFailure(userId, "folder", folderId, "delete", err);
  }
}

export async function pushFileCreate(fileId: string): Promise<void> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return;
  const userId = await getWorkspaceUserId(file.workspaceId);

  try {
    const { drive, rootFolderId } = await getDriveContextForWorkspace(file.workspaceId);
    const parentDriveId = await resolveDriveParentId(file.parentId, rootFolderId);
    const created = await drive.files.create({
      requestBody: { name: file.name, parents: [parentDriveId] },
      media: { mimeType: "text/plain", body: file.content },
      fields: "id",
    });
    if (created.data.id) {
      await prisma.file.update({ where: { id: file.id }, data: { driveFileId: created.data.id } });
    }
    await clearFailure("file", fileId);
  } catch (err) {
    await recordFailure(userId, "file", fileId, "create", err);
  }
}

export async function pushFileUpdate(fileId: string, opts?: { parentChanged?: boolean }): Promise<void> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return;
  if (!file.driveFileId) {
    await pushFileCreate(fileId);
    return;
  }
  const userId = await getWorkspaceUserId(file.workspaceId);
  // Defaults to true (do the full parent-aware update) for callers that don't know — e.g. a
  // manual retry, where correctness matters more than shaving a round-trip off a rare path.
  const parentChanged = opts?.parentChanged ?? true;

  try {
    const { drive, rootFolderId } = await getDriveContextForWorkspace(file.workspaceId);
    if (!parentChanged) {
      // Content edit and/or rename-only — parents are already correct, so skip the extra
      // "what are its current parents" round-trip. This is the hot path (every autosave goes
      // through here), so avoiding it matters a lot more than for the folder-update equivalent.
      await drive.files.update({
        fileId: file.driveFileId,
        requestBody: { name: file.name },
        media: { mimeType: "text/plain", body: file.content },
        fields: "id",
      });
    } else {
      const parentDriveId = await resolveDriveParentId(file.parentId, rootFolderId);
      const current = await drive.files.get({ fileId: file.driveFileId, fields: "parents" });
      await drive.files.update({
        fileId: file.driveFileId,
        requestBody: { name: file.name },
        media: { mimeType: "text/plain", body: file.content },
        addParents: parentDriveId,
        removeParents: (current.data.parents ?? []).join(","),
        fields: "id",
      });
    }
    await clearFailure("file", fileId);
  } catch (err) {
    await recordFailure(userId, "file", fileId, "update", err);
  }
}

export async function pushFileDelete(fileId: string): Promise<void> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file?.driveFileId) return;
  const userId = await getWorkspaceUserId(file.workspaceId);

  try {
    const { drive } = await getDriveContextForWorkspace(file.workspaceId);
    await drive.files.update({ fileId: file.driveFileId, requestBody: { trashed: true } });
    await clearFailure("file", fileId);
  } catch (err) {
    if (isDriveNotFound(err)) {
      await clearFailure("file", fileId);
      return;
    }
    await recordFailure(userId, "file", fileId, "delete", err);
  }
}

export async function retrySyncFailure(failure: { entityType: string; entityId: string; operation: string }): Promise<void> {
  if (failure.entityType === "file") {
    if (failure.operation === "delete") return pushFileDelete(failure.entityId);
    return pushFileUpdate(failure.entityId);
  }
  if (failure.operation === "delete") return pushFolderDelete(failure.entityId);
  return pushFolderUpdate(failure.entityId);
}
