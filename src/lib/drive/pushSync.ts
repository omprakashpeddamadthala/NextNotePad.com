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

/**
 * If a folder is created and then immediately given a child (e.g. Daily Notes: create the
 * folder, then create today's note inside it), both pushes fire from separate `after()`
 * callbacks on separate requests — the child's push can easily run before the parent's Drive
 * folder has been created. Tracking in-flight `pushFolderCreate` calls here lets a child that
 * needs its parent's Drive id either await the SAME push already underway, or kick one off
 * itself if none is running, instead of racing it (which used to make the child silently land
 * at the Drive root as a sibling instead of nested inside its parent).
 */
const pendingFolderCreates = new Map<string, Promise<void>>();

/** Resolves the parent's Drive folder id, pushing the parent first if it hasn't synced yet
 *  (deduped via `pendingFolderCreates` against that parent's own in-flight push, if any) —
 *  only falls back to the Drive root if the parent push itself fails. */
async function resolveDriveParentId(parentFolderId: string | null, rootFolderId: string): Promise<string> {
  if (!parentFolderId) return rootFolderId;
  let parent = await prisma.folder.findUnique({ where: { id: parentFolderId } });
  if (!parent) return rootFolderId;
  if (!parent.driveFileId) {
    await pushFolderCreate(parentFolderId);
    parent = await prisma.folder.findUnique({ where: { id: parentFolderId } });
  }
  return parent?.driveFileId ?? rootFolderId;
}

export async function pushFolderCreate(folderId: string): Promise<void> {
  const inFlight = pendingFolderCreates.get(folderId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.driveFileId) return; // gone, or already pushed by a racing caller
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
  })();

  pendingFolderCreates.set(folderId, promise);
  try {
    await promise;
  } finally {
    pendingFolderCreates.delete(folderId);
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
    if (isDriveNotFound(err)) {
      // The linked Drive folder is gone (deleted directly in Drive, outside app control) — the
      // local folder still exists, so re-create it under a fresh id rather than recording a
      // failure that would just 404 again on every retry forever.
      await prisma.folder.update({ where: { id: folderId }, data: { driveFileId: null } });
      await pushFolderCreate(folderId);
      return;
    }
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
    if (isDriveNotFound(err)) {
      // Same self-healing as the folder-update path: the linked Drive file is gone, so
      // re-create it under a fresh id instead of a permanent, retry-proof failure.
      await prisma.file.update({ where: { id: fileId }, data: { driveFileId: null } });
      await pushFileCreate(fileId);
      return;
    }
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
