-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "googleId" TEXT NOT NULL,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiresAt" DATETIME,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "activeWorkspaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_activeWorkspaceId_fkey" FOREIGN KEY ("activeWorkspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarUrl", "blocked", "createdAt", "email", "googleAccessToken", "googleId", "googleRefreshToken", "googleTokenExpiresAt", "id", "isAdmin", "name", "updatedAt") SELECT "avatarUrl", "blocked", "createdAt", "email", "googleAccessToken", "googleId", "googleRefreshToken", "googleTokenExpiresAt", "id", "isAdmin", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE TABLE "new_Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Workspace',
    "description" TEXT,
    "driveRootFolderId" TEXT,
    "driveWorkspaceFolderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Workspace" ("createdAt", "driveRootFolderId", "id", "updatedAt", "userId") SELECT "createdAt", "driveRootFolderId", "id", "updatedAt", "userId" FROM "Workspace";
DROP TABLE "Workspace";
ALTER TABLE "new_Workspace" RENAME TO "Workspace";
CREATE INDEX "Workspace_userId_idx" ON "Workspace"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
