import { prisma } from "@/lib/db/prisma";

/** Soft-deleting a folder must cascade to every descendant — `deletedAt` isn't a real FK, so Prisma's cascade doesn't cover it. */
export async function softDeleteFolderSubtree(folderId: string, when: Date): Promise<void> {
  const [childFolders, childFiles] = await Promise.all([
    prisma.folder.findMany({ where: { parentId: folderId } }),
    prisma.file.findMany({ where: { parentId: folderId } }),
  ]);

  await Promise.all([
    ...childFiles.map((f) => prisma.file.update({ where: { id: f.id }, data: { deletedAt: when } })),
    ...childFolders.map(async (cf) => {
      await prisma.folder.update({ where: { id: cf.id }, data: { deletedAt: when } });
      await softDeleteFolderSubtree(cf.id, when);
    }),
  ]);
}

/** Walks up from `candidateId`'s parent chain — true if `ancestorId` is anywhere above it. */
export async function isDescendantFolder(ancestorId: string, candidateId: string): Promise<boolean> {
  let currentId: string | null = candidateId;
  while (currentId) {
    const current: { parentId: string | null } | null = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!current?.parentId) return false;
    if (current.parentId === ancestorId) return true;
    currentId = current.parentId;
  }
  return false;
}

/** After a folder is renamed or moved, every descendant's stored `path` needs to be recomputed. */
export async function recomputeFolderSubtreePaths(folderId: string, newPath: string): Promise<void> {
  const [childFolders, childFiles] = await Promise.all([
    prisma.folder.findMany({ where: { parentId: folderId } }),
    prisma.file.findMany({ where: { parentId: folderId } }),
  ]);

  await Promise.all([
    ...childFiles.map((f) => prisma.file.update({ where: { id: f.id }, data: { path: `${newPath}/${f.name}` } })),
    ...childFolders.map(async (cf) => {
      const childPath = `${newPath}/${cf.name}`;
      await prisma.folder.update({ where: { id: cf.id }, data: { path: childPath } });
      await recomputeFolderSubtreePaths(cf.id, childPath);
    }),
  ]);
}
