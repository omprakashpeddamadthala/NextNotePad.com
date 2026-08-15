import type { FolderModel, FileModel } from "@/generated/prisma/models";

export function folderToDto(folder: FolderModel) {
  return {
    id: folder.id,
    name: folder.name,
    path: folder.path,
    parentId: folder.parentId,
    type: "folder" as const,
    createdAt: folder.createdAt.getTime(),
    updatedAt: folder.updatedAt.getTime(),
    lastSynced: folder.updatedAt.getTime(),
    version: folder.version,
    checksum: null,
    deleted: folder.deletedAt !== null,
    collapsed: folder.collapsed,
    hidden: folder.hidden,
  };
}

export function fileToDto(file: FileModel, includeContent = false) {
  return {
    id: file.id,
    name: file.name,
    path: file.path,
    parentId: file.parentId,
    type: "file" as const,
    createdAt: file.createdAt.getTime(),
    updatedAt: file.updatedAt.getTime(),
    lastSynced: file.updatedAt.getTime(),
    version: file.version,
    checksum: file.checksum,
    deleted: file.deletedAt !== null,
    language: file.language,
    encoding: file.encoding,
    size: file.size,
    pinnedFavorite: false,
    hidden: file.hidden,
    locked: file.locked,
    encryptionSalt: file.encryptionSalt,
    encryptionIv: file.encryptionIv,
    ...(includeContent ? { content: file.content } : {}),
  };
}
