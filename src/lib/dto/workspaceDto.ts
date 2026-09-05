import type { FolderModel, FileModel } from "@/generated/prisma/models";

function toTimestamp(d: Date | string | number | null | undefined): number {
  if (!d) return Date.now();
  if (d instanceof Date) return d.getTime();
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? Date.now() : t;
}

export function folderToDto(folder: FolderModel) {
  const createdAt = toTimestamp(folder.createdAt);
  const updatedAt = toTimestamp(folder.updatedAt);
  return {
    id: folder.id,
    name: folder.name,
    path: folder.path,
    parentId: folder.parentId,
    type: "folder" as const,
    createdAt,
    updatedAt,
    lastSynced: updatedAt,
    version: folder.version ?? 1,
    checksum: null,
    deleted: folder.deletedAt !== null,
    collapsed: folder.collapsed ?? true,
    hidden: folder.hidden ?? false,
  };
}

export function fileToDto(file: FileModel, includeContent = false) {
  const createdAt = toTimestamp(file.createdAt);
  const updatedAt = toTimestamp(file.updatedAt);
  return {
    id: file.id,
    name: file.name,
    path: file.path,
    parentId: file.parentId,
    type: "file" as const,
    createdAt,
    updatedAt,
    lastSynced: updatedAt,
    version: file.version ?? 1,
    checksum: file.checksum ?? null,
    deleted: file.deletedAt !== null,
    language: file.language ?? "plaintext",
    encoding: file.encoding ?? "UTF-8",
    size: file.size ?? 0,
    pinnedFavorite: false,
    hidden: file.hidden ?? false,
    locked: file.locked ?? false,
    encryptionSalt: file.encryptionSalt ?? null,
    encryptionIv: file.encryptionIv ?? null,
    ...(includeContent ? { content: file.content ?? "" } : {}),
  };
}
