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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "File_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "File_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_File" ("checksum", "content", "createdAt", "deletedAt", "driveFileId", "encoding", "id", "language", "name", "parentId", "path", "size", "updatedAt", "version", "workspaceId") SELECT "checksum", "content", "createdAt", "deletedAt", "driveFileId", "encoding", "id", "language", "name", "parentId", "path", "size", "updatedAt", "version", "workspaceId" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE INDEX "File_workspaceId_parentId_idx" ON "File"("workspaceId", "parentId");
CREATE TABLE "new_Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "driveFileId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Folder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Folder" ("collapsed", "createdAt", "deletedAt", "driveFileId", "id", "name", "parentId", "path", "updatedAt", "version", "workspaceId") SELECT "collapsed", "createdAt", "deletedAt", "driveFileId", "id", "name", "parentId", "path", "updatedAt", "version", "workspaceId" FROM "Folder";
DROP TABLE "Folder";
ALTER TABLE "new_Folder" RENAME TO "Folder";
CREATE INDEX "Folder_workspaceId_parentId_idx" ON "Folder"("workspaceId", "parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
