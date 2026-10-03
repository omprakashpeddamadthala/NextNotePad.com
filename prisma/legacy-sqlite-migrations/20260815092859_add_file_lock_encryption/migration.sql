-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'plaintext',
    "encoding" TEXT NOT NULL DEFAULT 'UTF-8',
    "content" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "driveFileId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT,
    "deletedAt" DATETIME,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "encryptionSalt" TEXT,
    "encryptionIv" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "File_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "File_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_File" ("checksum", "content", "createdAt", "deletedAt", "driveFileId", "encoding", "hidden", "id", "language", "name", "parentId", "path", "size", "updatedAt", "version", "workspaceId") SELECT "checksum", "content", "createdAt", "deletedAt", "driveFileId", "encoding", "hidden", "id", "language", "name", "parentId", "path", "size", "updatedAt", "version", "workspaceId" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE INDEX "File_workspaceId_parentId_idx" ON "File"("workspaceId", "parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
